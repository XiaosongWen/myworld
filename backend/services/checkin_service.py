from datetime import date

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import HabitLog
from schemas.habit import HeatmapEntry


class CheckInService:

    @staticmethod
    async def check_in(
        db: AsyncSession, habit_id: int, user_id: int,
        log_date: date, note: str | None = None,
    ) -> HabitLog:
        # Check for duplicate
        existing = await db.execute(
            select(HabitLog).where(
                HabitLog.habit_id == habit_id,
                HabitLog.completed_at == log_date,
                HabitLog.is_archived == False,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise ValueError(f"Already checked in for {log_date}")

        log = HabitLog(
            habit_id=habit_id,
            user_id=user_id,
            completed_at=log_date,
            note=note,
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    @staticmethod
    async def archive_check_in(
        db: AsyncSession, log_id: int, habit_id: int, user_id: int,
    ) -> bool:
        result = await db.execute(
            select(HabitLog).where(
                HabitLog.id == log_id,
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == user_id,
            )
        )
        log = result.scalar_one_or_none()
        if log is None:
            return False
        log.is_archived = True
        await db.commit()
        return True

    @staticmethod
    async def get_check_ins(
        db: AsyncSession, habit_id: int, user_id: int,
        from_date: date, to_date: date,
    ) -> list[HabitLog]:
        result = await db.execute(
            select(HabitLog)
            .where(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == user_id,
                HabitLog.completed_at >= from_date,
                HabitLog.completed_at <= to_date,
                HabitLog.is_archived == False,
            )
            .order_by(HabitLog.completed_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_heatmap_data(
        db: AsyncSession, user_id: int,
        from_date: date, to_date: date,
    ) -> list[HeatmapEntry]:
        result = await db.execute(
            select(
                HabitLog.completed_at,
                func.count(HabitLog.id).label("count"),
            )
            .where(
                HabitLog.user_id == user_id,
                HabitLog.completed_at >= from_date,
                HabitLog.completed_at <= to_date,
                HabitLog.is_archived == False,
            )
            .group_by(HabitLog.completed_at)
            .order_by(HabitLog.completed_at)
        )
        return [HeatmapEntry(date=row[0], count=row[1]) for row in result.all()]
