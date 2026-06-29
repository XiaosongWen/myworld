"""Tests for habit Pydantic schemas."""

from datetime import date, datetime, timezone

import pytest
from pydantic import ValidationError

from schemas.habit import (
    HabitCreate, HabitLogRead, HabitRead, HabitUpdate,
    CheckInCreate, HeatmapEntry, StreakResult,
)


class TestHabitCreate:
    def test_valid_habit_create(self):
        data = HabitCreate(name="Morning run", color="#3B82F6")
        assert data.name == "Morning run"
        assert data.color == "#3B82F6"
        assert data.frequency == "daily"
        assert data.description is None
        assert data.category is None

    def test_missing_name_raises_error(self):
        with pytest.raises(ValidationError):
            HabitCreate(color="#3B82F6")

    def test_missing_color_raises_error(self):
        with pytest.raises(ValidationError):
            HabitCreate(name="Morning run")

    def test_with_all_fields(self):
        data = HabitCreate(
            name="Read", description="Read 30 min",
            color="#10B981", category="Learning",
        )
        assert data.description == "Read 30 min"
        assert data.category == "Learning"


class TestHabitUpdate:
    def test_all_fields_optional(self):
        data = HabitUpdate()
        assert data.name is None
        assert data.color is None

    def test_partial_update(self):
        data = HabitUpdate(name="New name")
        assert data.name == "New name"
        assert data.color is None


class TestHabitRead:
    def test_from_attributes(self):
        now = datetime.now(timezone.utc)
        data = HabitRead.model_validate({
            "id": 1, "user_id": 1, "name": "Run", "description": None,
            "color": "#3B82F6", "category": "Health", "frequency": "daily",
            "is_archived": False, "created_at": now, "updated_at": now,
        })
        assert data.id == 1
        assert data.name == "Run"
        assert data.model_config.get("from_attributes") is True


class TestCheckInCreate:
    def test_default_date_is_none(self):
        data = CheckInCreate()
        assert data.date is None
        assert data.note is None

    def test_with_note_only(self):
        data = CheckInCreate(note="Felt great")
        assert data.note == "Felt great"
        assert data.date is None

    def test_with_date_only(self):
        d = date(2026, 6, 1)
        data = CheckInCreate(date=d)
        assert data.date == d
        assert data.note is None


class TestHabitLogRead:
    def test_from_attributes(self):
        now = datetime.now(timezone.utc)
        data = HabitLogRead.model_validate({
            "id": 1, "habit_id": 1, "user_id": 1,
            "completed_at": date(2026, 6, 1), "note": "Felt great",
            "is_archived": False, "created_at": now,
        })
        assert data.completed_at == date(2026, 6, 1)
        assert data.note == "Felt great"

    def test_note_is_optional(self):
        now = datetime.now(timezone.utc)
        data = HabitLogRead.model_validate({
            "id": 2, "habit_id": 1, "user_id": 1,
            "completed_at": date(2026, 6, 1), "note": None,
            "is_archived": False, "created_at": now,
        })
        assert data.note is None


class TestStreakResult:
    def test_streak_result_values(self):
        s = StreakResult(habit_id=1, current_streak=5, longest_streak=10, total_check_ins=30)
        assert s.current_streak == 5
        assert s.longest_streak == 10

    def test_streak_result_zero_values(self):
        s = StreakResult(habit_id=1, current_streak=0, longest_streak=0, total_check_ins=0)
        assert s.current_streak == 0


class TestHeatmapEntry:
    def test_heatmap_entry(self):
        e = HeatmapEntry(date=date(2026, 6, 1), count=3)
        assert e.count == 3

    def test_heatmap_entry_zero_count(self):
        e = HeatmapEntry(date=date(2026, 6, 1), count=0)
        assert e.count == 0
