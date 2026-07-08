from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import HabitLog
from schemas.habit import StreakResult


class StreakService:

    @staticmethod
    async def get_streaks(db: AsyncSession, habit_id: int, user_id: int) -> StreakResult:
        result = await db.execute(
            select(HabitLog.completed_at)
            .where(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == user_id,
                HabitLog.is_archived == False,
            )
            .order_by(HabitLog.completed_at.asc())
        )
        dates = list(result.scalars().all())
        total = len(dates)

        if total == 0:
            return StreakResult(habit_id=habit_id, current_streak=0, longest_streak=0, total_check_ins=0)

        # Split into consecutive runs
        runs: list[list[date]] = []
        current_run = [dates[0]]
        for d in dates[1:]:
            if (d - current_run[-1]).days == 1:
                current_run.append(d)
            else:
                runs.append(current_run)
                current_run = [d]
        runs.append(current_run)

        longest = max(len(run) for run in runs)

        # Current streak: find the run that contains today or yesterday
        today = date.today()
        current = 0
        for run in reversed(runs):
            if run[-1] == today or run[-1] == today - timedelta(days=1):
                current = len(run)
                break

        return StreakResult(
            habit_id=habit_id,
            current_streak=current,
            longest_streak=longest,
            total_check_ins=total,
        )
