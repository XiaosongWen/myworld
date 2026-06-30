import datetime

from pydantic import BaseModel


class HabitCreate(BaseModel):
    name: str
    description: str | None = None
    color: str
    category: str | None = None
    frequency: str = "daily"


class HabitUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    category: str | None = None
    frequency: str | None = None


class HabitRead(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    color: str
    category: str | None
    frequency: str
    is_archived: bool
    current_streak: int = 0
    longest_streak: int = 0
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class CheckInCreate(BaseModel):
    date: datetime.date | None = None
    note: str | None = None


class HabitLogRead(BaseModel):
    id: int
    habit_id: int
    user_id: int
    completed_at: datetime.date
    note: str | None
    is_archived: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class StreakResult(BaseModel):
    habit_id: int
    current_streak: int
    longest_streak: int
    total_check_ins: int


class HeatmapEntry(BaseModel):
    date: datetime.date
    count: int
