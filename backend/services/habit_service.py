from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import Habit
from schemas.habit import HabitCreate, HabitUpdate


class HabitService:

    @staticmethod
    async def list_habits(db: AsyncSession, user_id: int, include_archived: bool = False) -> list[Habit]:
        query = select(Habit).where(Habit.user_id == user_id)
        if not include_archived:
            query = query.where(Habit.is_archived == False)
        query = query.order_by(Habit.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_habit(db: AsyncSession, habit_id: int, user_id: int) -> Habit | None:
        result = await db.execute(
            select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_habit(db: AsyncSession, user_id: int, data: HabitCreate) -> Habit:
        habit = Habit(
            user_id=user_id,
            name=data.name,
            description=data.description,
            color=data.color,
            category=data.category,
            frequency=data.frequency,
        )
        db.add(habit)
        await db.commit()
        await db.refresh(habit)
        return habit

    @staticmethod
    async def update_habit(db: AsyncSession, habit_id: int, user_id: int, data: HabitUpdate) -> Habit | None:
        habit = await HabitService.get_habit(db, habit_id, user_id)
        if habit is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(habit, field, value)
        await db.commit()
        await db.refresh(habit)
        return habit

    @staticmethod
    async def archive_habit(db: AsyncSession, habit_id: int, user_id: int) -> bool:
        habit = await HabitService.get_habit(db, habit_id, user_id)
        if habit is None:
            return False
        habit.is_archived = True
        await db.commit()
        return True
