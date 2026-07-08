"""Tests for StreakService."""

from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from services.streak_service import StreakService


@pytest.fixture
def db_session():
    return AsyncMock(spec=AsyncSession)


@pytest.mark.asyncio
async def test_no_check_ins(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 0
    assert streaks.longest_streak == 0
    assert streaks.total_check_ins == 0


@pytest.mark.asyncio
async def test_single_check_in_today(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [date.today()]
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 1
    assert streaks.longest_streak == 1
    assert streaks.total_check_ins == 1


@pytest.mark.asyncio
async def test_consecutive_days(db_session):
    today = date.today()
    dates = sorted([today - timedelta(days=i) for i in range(5)])
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = dates
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 5
    assert streaks.longest_streak == 5


@pytest.mark.asyncio
async def test_gap_in_current_streak(db_session):
    today = date.today()
    # Missed yesterday, so current streak = 1 (today only)
    # Dates in ASC order: today-2, today
    dates = [today - timedelta(days=2), today]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = dates
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 1
    assert streaks.longest_streak == 1


@pytest.mark.asyncio
async def test_longest_streak_in_past(db_session):
    today = date.today()
    # 5 consecutive days ending 12 days ago, then nothing recent
    # ASC: today-16, today-15, today-14, today-13, today-12
    past_dates = sorted([
        today - timedelta(days=12 + i) for i in range(5)
    ])
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = past_dates
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 0  # gap since last check-in
    assert streaks.longest_streak == 5
    assert streaks.total_check_ins == 5
