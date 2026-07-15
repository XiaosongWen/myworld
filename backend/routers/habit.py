from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.habit import (
    CheckInCreate, HabitCreate, HabitLogRead, HabitRead,
    HabitUpdate, HeatmapEntry, StreakResult,
)
from schemas.response import SingleResponse, ListResponse, Pagination
from services.checkin_service import CheckInService
from services.habit_service import HabitService
from services.streak_service import StreakService

router = APIRouter(tags=["habits"])

USER_ID = 1  # single default user


@router.get("/api/v1/habits", response_model=ListResponse[HabitRead])
async def list_habits(
    request: Request,
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    habits = await HabitService.list_habits(db, USER_ID, include_archived)
    # Enrich with streak data
    for habit in habits:
        streaks = await StreakService.get_streaks(db, habit.id, USER_ID)
        habit.current_streak = streaks.current_streak
        habit.longest_streak = streaks.longest_streak
    
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    pagination = Pagination(page=1, page_size=len(habits), total_rows=len(habits))
    return ListResponse(request_id=request_id, data=habits, pagination=pagination)


@router.post("/api/v1/habits", response_model=SingleResponse[HabitRead], status_code=status.HTTP_201_CREATED)
async def create_habit(
    request: Request,
    data: HabitCreate,
    db: AsyncSession = Depends(get_db),
):
    habit = await HabitService.create_habit(db, USER_ID, data)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=habit)


@router.get("/api/v1/habits/heatmap", response_model=ListResponse[HeatmapEntry])
async def get_heatmap(
    request: Request,
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: AsyncSession = Depends(get_db),
):
    data = await CheckInService.get_heatmap_data(db, USER_ID, from_date, to_date)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    pagination = Pagination(page=1, page_size=len(data), total_rows=len(data))
    return ListResponse(request_id=request_id, data=data, pagination=pagination)


@router.get("/api/v1/habits/{habit_id}", response_model=SingleResponse[HabitRead])
async def get_habit(
    request: Request,
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    habit = await HabitService.get_habit(db, habit_id, USER_ID)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=habit)


@router.patch("/api/v1/habits/{habit_id}", response_model=SingleResponse[HabitRead])
async def update_habit(
    request: Request,
    habit_id: int,
    data: HabitUpdate,
    db: AsyncSession = Depends(get_db),
):
    habit = await HabitService.update_habit(db, habit_id, USER_ID, data)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=habit)


@router.delete("/api/v1/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_habit(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    ok = await HabitService.archive_habit(db, habit_id, USER_ID)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")


@router.post("/api/v1/habits/{habit_id}/check-in", response_model=SingleResponse[HabitLogRead], status_code=status.HTTP_201_CREATED)
async def check_in(
    request: Request,
    habit_id: int,
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
):
    log_date = data.date or date.today()
    try:
        log = await CheckInService.check_in(db, habit_id, USER_ID, log_date, data.note)
        request_id = getattr(request.state, "request_id", "UNKNOWN")
        return SingleResponse(request_id=request_id, data=log)
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


@router.get("/api/v1/habits/{habit_id}/check-ins", response_model=ListResponse[HabitLogRead])
async def get_check_ins(
    request: Request,
    habit_id: int,
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: AsyncSession = Depends(get_db),
):
    logs = await CheckInService.get_check_ins(db, habit_id, USER_ID, from_date, to_date)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    pagination = Pagination(page=1, page_size=len(logs), total_rows=len(logs))
    return ListResponse(request_id=request_id, data=logs, pagination=pagination)


@router.get("/api/v1/habits/{habit_id}/streaks", response_model=SingleResponse[StreakResult])
async def get_streaks(
    request: Request,
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    streaks = await StreakService.get_streaks(db, habit_id, USER_ID)
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=streaks)
