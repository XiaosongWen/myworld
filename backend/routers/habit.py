from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.habit import (
    CheckInCreate, HabitCreate, HabitLogRead, HabitRead,
    HabitUpdate, HeatmapEntry, StreakResult,
)
from services.checkin_service import CheckInService
from services.habit_service import HabitService
from services.streak_service import StreakService

router = APIRouter(tags=["habits"])

USER_ID = 1  # single default user


@router.get("/api/v1/habits", response_model=list[HabitRead])
async def list_habits(
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    habits = await HabitService.list_habits(db, USER_ID, include_archived)
    # Enrich with streak data
    for habit in habits:
        streaks = await StreakService.get_streaks(db, habit.id, USER_ID)
        habit.current_streak = streaks.current_streak
        habit.longest_streak = streaks.longest_streak
    return habits


@router.post("/api/v1/habits", response_model=HabitRead, status_code=status.HTTP_201_CREATED)
async def create_habit(
    data: HabitCreate,
    db: AsyncSession = Depends(get_db),
):
    return await HabitService.create_habit(db, USER_ID, data)


@router.get("/api/v1/habits/heatmap", response_model=list[HeatmapEntry])
async def get_heatmap(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: AsyncSession = Depends(get_db),
):
    return await CheckInService.get_heatmap_data(db, USER_ID, from_date, to_date)


@router.get("/api/v1/habits/{habit_id}", response_model=HabitRead)
async def get_habit(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    habit = await HabitService.get_habit(db, habit_id, USER_ID)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return habit


@router.patch("/api/v1/habits/{habit_id}", response_model=HabitRead)
async def update_habit(
    habit_id: int,
    data: HabitUpdate,
    db: AsyncSession = Depends(get_db),
):
    habit = await HabitService.update_habit(db, habit_id, USER_ID, data)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return habit


@router.delete("/api/v1/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_habit(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    ok = await HabitService.archive_habit(db, habit_id, USER_ID)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")


@router.post("/api/v1/habits/{habit_id}/check-in", response_model=HabitLogRead, status_code=status.HTTP_201_CREATED)
async def check_in(
    habit_id: int,
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
):
    log_date = data.date or date.today()
    try:
        return await CheckInService.check_in(db, habit_id, USER_ID, log_date, data.note)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/api/v1/habits/{habit_id}/check-in/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_check_in(
    habit_id: int,
    log_id: int,
    db: AsyncSession = Depends(get_db),
):
    ok = await CheckInService.archive_check_in(db, log_id, habit_id, USER_ID)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found")


@router.get("/api/v1/habits/{habit_id}/check-ins", response_model=list[HabitLogRead])
async def get_check_ins(
    habit_id: int,
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: AsyncSession = Depends(get_db),
):
    return await CheckInService.get_check_ins(db, habit_id, USER_ID, from_date, to_date)


@router.get("/api/v1/habits/{habit_id}/streaks", response_model=StreakResult)
async def get_streaks(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await StreakService.get_streaks(db, habit_id, USER_ID)
