"""Tests for HabitService."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import Habit
from schemas.habit import HabitCreate, HabitUpdate
from services.habit_service import HabitService


@pytest.fixture
def db_session():
    return AsyncMock(spec=AsyncSession)


@pytest.mark.asyncio
async def test_list_habits_excludes_archived(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [
        Habit(id=1, user_id=1, name="Run", color="#3B82F6"),
    ]
    db_session.execute = AsyncMock(return_value=mock_result)

    habits = await HabitService.list_habits(db_session, user_id=1)

    assert len(habits) == 1
    assert habits[0].name == "Run"
    # Verify query filters is_archived=False
    call_query = db_session.execute.call_args[0][0]
    assert "is_archived" in str(call_query)


@pytest.mark.asyncio
async def test_list_habits_includes_archived(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db_session.execute = AsyncMock(return_value=mock_result)

    habits = await HabitService.list_habits(db_session, user_id=1, include_archived=True)
    assert habits == []
    call_query = db_session.execute.call_args[0][0]
    # Should NOT filter by is_archived when include_archived is True
    # Check the WHERE clause specifically (is_archived appears in SELECT column list)
    where_str = str(call_query.whereclause)
    assert "is_archived" not in where_str


@pytest.mark.asyncio
async def test_get_habit_returns_habit(db_session):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = Habit(id=1, user_id=1, name="Run", color="#3B82F6")
    db_session.execute = AsyncMock(return_value=mock_result)

    habit = await HabitService.get_habit(db_session, habit_id=1, user_id=1)
    assert habit is not None
    assert habit.name == "Run"


@pytest.mark.asyncio
async def test_get_habit_not_found(db_session):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db_session.execute = AsyncMock(return_value=mock_result)

    habit = await HabitService.get_habit(db_session, habit_id=999, user_id=1)
    assert habit is None


@pytest.mark.asyncio
async def test_create_habit(db_session):
    data = HabitCreate(name="Run", color="#3B82F6", category="Health")
    db_session.add = MagicMock()
    db_session.commit = AsyncMock()
    db_session.refresh = AsyncMock()

    habit = await HabitService.create_habit(db_session, user_id=1, data=data)

    assert habit.name == "Run"
    assert habit.color == "#3B82F6"
    assert habit.user_id == 1
    db_session.add.assert_called_once()
    db_session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_habit(db_session):
    existing = Habit(id=1, user_id=1, name="Run", color="#3B82F6")
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    db_session.execute = AsyncMock(return_value=mock_result)
    db_session.commit = AsyncMock()
    db_session.refresh = AsyncMock()

    updated = await HabitService.update_habit(
        db_session, habit_id=1, user_id=1, data=HabitUpdate(name="Morning run"),
    )

    assert updated.name == "Morning run"
    assert updated.color == "#3B82F6"  # unchanged
    db_session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_archive_habit(db_session):
    existing = Habit(id=1, user_id=1, name="Run", color="#3B82F6", is_archived=False)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    db_session.execute = AsyncMock(return_value=mock_result)
    db_session.commit = AsyncMock()

    await HabitService.archive_habit(db_session, habit_id=1, user_id=1)

    assert existing.is_archived is True
    db_session.commit.assert_awaited_once()
