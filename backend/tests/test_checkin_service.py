"""Tests for CheckInService."""

from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import HabitLog
from services.checkin_service import CheckInService


@pytest.fixture
def db_session():
    return AsyncMock(spec=AsyncSession)


@pytest.mark.asyncio
async def test_check_in_creates_log(db_session):
    habit_mock = MagicMock()
    habit_mock.scalar_one_or_none.return_value = MagicMock()  # habit exists
    dup_mock = MagicMock()
    dup_mock.scalar_one_or_none.return_value = None  # no duplicate
    db_session.execute = AsyncMock(side_effect=[habit_mock, dup_mock])
    db_session.add = MagicMock()
    db_session.commit = AsyncMock()
    db_session.refresh = AsyncMock()

    log = await CheckInService.check_in(db_session, habit_id=1, user_id=1, log_date=date(2026, 6, 1), note=None)

    assert log.habit_id == 1
    assert log.completed_at == date(2026, 6, 1)
    db_session.add.assert_called_once()
    db_session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_check_in_duplicate_raises_error(db_session):
    existing = HabitLog(id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 1))
    habit_mock = MagicMock()
    habit_mock.scalar_one_or_none.return_value = MagicMock()  # habit exists
    dup_mock = MagicMock()
    dup_mock.scalar_one_or_none.return_value = existing
    db_session.execute = AsyncMock(side_effect=[habit_mock, dup_mock])

    with pytest.raises(ValueError, match="Already checked in"):
        await CheckInService.check_in(db_session, habit_id=1, user_id=1, log_date=date(2026, 6, 1), note=None)


@pytest.mark.asyncio
async def test_check_in_habit_not_found_raises_error(db_session):
    habit_mock = MagicMock()
    habit_mock.scalar_one_or_none.return_value = None  # habit not found
    db_session.execute = AsyncMock(return_value=habit_mock)

    with pytest.raises(ValueError, match="Habit 999 not found"):
        await CheckInService.check_in(db_session, habit_id=999, user_id=1, log_date=date(2026, 6, 1), note=None)


@pytest.mark.asyncio
async def test_archive_check_in(db_session):
    existing = HabitLog(id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 1), is_archived=False)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    db_session.execute = AsyncMock(return_value=mock_result)
    db_session.commit = AsyncMock()

    result = await CheckInService.archive_check_in(db_session, log_id=1, habit_id=1, user_id=1)
    assert result is True
    assert existing.is_archived is True
    db_session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_archive_check_in_not_found(db_session):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db_session.execute = AsyncMock(return_value=mock_result)

    result = await CheckInService.archive_check_in(db_session, log_id=999, habit_id=1, user_id=1)
    assert result is False


@pytest.mark.asyncio
async def test_get_check_ins_in_range(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [
        HabitLog(id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 1)),
        HabitLog(id=2, habit_id=1, user_id=1, completed_at=date(2026, 6, 2)),
    ]
    db_session.execute = AsyncMock(return_value=mock_result)

    logs = await CheckInService.get_check_ins(
        db_session, habit_id=1, user_id=1,
        from_date=date(2026, 6, 1), to_date=date(2026, 6, 30),
    )
    assert len(logs) == 2


@pytest.mark.asyncio
async def test_get_heatmap_data(db_session):
    mock_result = MagicMock()
    mock_result.all.return_value = [
        (date(2026, 6, 1), 3),
        (date(2026, 6, 2), 1),
    ]
    db_session.execute = AsyncMock(return_value=mock_result)

    entries = await CheckInService.get_heatmap_data(
        db_session, user_id=1,
        from_date=date(2026, 6, 1), to_date=date(2026, 6, 30),
    )
    assert len(entries) == 2
    assert entries[0].count == 3
