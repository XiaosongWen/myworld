"""Tests for the Habit and HabitLog SQLAlchemy models."""

from datetime import date

from models.habit import Habit, HabitLog


class TestHabitModel:
    def test_create_habit_with_required_fields(self):
        habit = Habit(id=1, user_id=1, name="Morning run", color="#3B82F6")
        assert habit.id == 1
        assert habit.user_id == 1
        assert habit.name == "Morning run"
        assert habit.color == "#3B82F6"
        assert habit.frequency == "daily"  # default
        assert habit.is_archived is False  # default
        assert habit.category is None

    def test_create_habit_with_all_fields(self):
        habit = Habit(
            id=2, user_id=1, name="Read", description="Read 30 min",
            color="#10B981", category="Learning", frequency="daily",
        )
        assert habit.description == "Read 30 min"
        assert habit.category == "Learning"

    def test_table_name(self):
        assert Habit.__tablename__ == "habits"


class TestHabitLogModel:
    def test_create_habit_log(self):
        log = HabitLog(id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 1))
        assert log.completed_at == date(2026, 6, 1)
        assert log.is_archived is False
        assert log.note is None

    def test_habit_log_with_note(self):
        log = HabitLog(id=2, habit_id=1, user_id=1, completed_at=date(2026, 6, 1), note="Felt great")
        assert log.note == "Felt great"

    def test_table_name(self):
        assert HabitLog.__tablename__ == "habit_logs"
