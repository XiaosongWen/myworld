from datetime import date, timedelta
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from models.commitment import Commitment
from models.commitment_link import CommitmentLink
from models.record import Record
from schemas.commitment import ProgressMetrics

class ProgressService:
    @staticmethod
    async def compute_progress(db: AsyncSession, commitment: Commitment) -> ProgressMetrics:
        if commitment.type == 'habit':
            return await ProgressService._compute_habit_progress(db, commitment)
        elif commitment.type == 'goal':
            progress_type = commitment.config.get('progress_type', 'records') if commitment.config else 'records'
            if progress_type == 'checklist':
                return await ProgressService._compute_checklist_progress(db, commitment)
            elif progress_type == 'percentage':
                return await ProgressService._compute_percentage_progress(db, commitment)
            elif progress_type == 'auto_sub':
                return await ProgressService._compute_auto_sub_progress(db, commitment)
            
        # Default fallback
        return ProgressMetrics(method='records', done=0, total=0, percent=0)

    @staticmethod
    async def _compute_habit_progress(db: AsyncSession, habit: Commitment) -> ProgressMetrics:
        # compute streak
        result = await db.execute(
            select(Record.date)
            .where(
                Record.commitment_id == habit.id,
                Record.status == 'done'
            )
            .order_by(Record.date.asc())
        )
        dates = list(result.scalars().all())
        streak = 0
        
        if dates:
            runs: list[list[date]] = []
            current_run = [dates[0]]
            for d in dates[1:]:
                if (d - current_run[-1]).days == 1:
                    current_run.append(d)
                elif (d - current_run[-1]).days > 1: # avoid duplicates counting as breaks
                    runs.append(current_run)
                    current_run = [d]
            runs.append(current_run)
            
            today = date.today()
            for run in reversed(runs):
                if run[-1] == today or run[-1] == today - timedelta(days=1):
                    streak = len(run)
                    break

        return ProgressMetrics(
            method='streak',
            done=streak,
            total=0,
            percent=0,
            streak=streak
        )
        
    @staticmethod
    async def _compute_checklist_progress(db: AsyncSession, goal: Commitment) -> ProgressMetrics:
        subquery = select(CommitmentLink.child_id).where(CommitmentLink.parent_id == goal.id)
        children = (await db.execute(select(Commitment).where(Commitment.id.in_(subquery)))).scalars().all()
        
        total = len(children)
        if total == 0:
            return ProgressMetrics(method='checklist', done=0, total=0, percent=0)
            
        done = sum(1 for c in children if c.status == 'completed')
        percent = (done / total) * 100
        return ProgressMetrics(method='checklist', done=done, total=total, percent=percent)
        
    @staticmethod
    async def _compute_percentage_progress(db: AsyncSession, goal: Commitment) -> ProgressMetrics:
        target = float(goal.config.get('target_value', 100)) if goal.config else 100
        result = await db.execute(
            select(func.sum(Record.value)).where(Record.commitment_id == goal.id, Record.status == 'done')
        )
        done = float(result.scalar() or 0)
        percent = (done / target * 100) if target > 0 else 0
        percent = min(100.0, percent)
        return ProgressMetrics(method='percentage', done=done, total=target, percent=percent)

    @staticmethod
    async def _compute_auto_sub_progress(db: AsyncSession, goal: Commitment) -> ProgressMetrics:
        # Simplistic approach: average percent of children
        subquery = select(CommitmentLink.child_id).where(CommitmentLink.parent_id == goal.id)
        children = (await db.execute(select(Commitment).where(Commitment.id.in_(subquery)))).scalars().all()
        
        if not children:
            return ProgressMetrics(method='auto_sub', done=0, total=0, percent=0)
            
        total_percent = 0
        for child in children:
            child_prog = await ProgressService.compute_progress(db, child)
            total_percent += child_prog.percent
            
        avg_percent = total_percent / len(children)
        return ProgressMetrics(method='auto_sub', done=0, total=0, percent=avg_percent)
