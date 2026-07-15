"""Integration tests for the /api/v1/habits router.

Uses dependency overrides to mock the database session.
"""

from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import status

from database import get_db
from main import app


def _mock_habit(**kwargs):
    """Create a MagicMock with the given attributes.

    Avoids using ``name`` as a MagicMock constructor kwarg because
    it is reserved by the mock library for identification purposes.
    """
    name_value = kwargs.pop("name", None)
    m = MagicMock()
    for k, v in kwargs.items():
        setattr(m, k, v)
    if name_value is not None:
        m.name = name_value
    return m


@pytest.fixture
def mock_db():
    """Override get_db with a mock async session."""
    session = AsyncMock()
    app.dependency_overrides[get_db] = lambda: session
    yield session
    app.dependency_overrides.clear()


@pytest.fixture
def sample_habit_row():
    return _mock_habit(
        id=1, user_id=1, name="Run", description=None,
        color="#3B82F6", category="Health", frequency="daily",
        is_archived=False,
        created_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
        updated_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
    )


@pytest.fixture
def sample_log_row():
    return MagicMock(
        id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 15),
        note="Morning run", is_archived=False,
        created_at=datetime(2026, 6, 15, tzinfo=timezone.utc),
    )


def _refresh_set_id_and_dates(obj, id_val=1, created_at=None, updated_at=None):
    """Side-effect helper for db.refresh mock: sets id, created_at, updated_at."""
    obj.id = id_val
    if created_at is not None:
        obj.created_at = created_at
    if updated_at is not None:
        obj.updated_at = updated_at


class TestListHabits:
    @pytest.mark.asyncio
    async def test_list_habits_empty(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits")
        assert resp.status_code == 200
        assert resp.json()["data"] == []

    @pytest.mark.asyncio
    async def test_list_habits_with_data(self, client, mock_db, sample_habit_row):
        habit_result = MagicMock()
        habit_result.scalars.return_value.all.return_value = [sample_habit_row]
        streak_result = MagicMock()
        streak_result.scalars.return_value.all.return_value = [
            date(2026, 6, 1), date(2026, 6, 2), date(2026, 6, 3),
        ]
        mock_db.execute = AsyncMock(side_effect=[habit_result, streak_result])

        resp = await client.get("/api/v1/habits")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["name"] == "Run"
        assert data[0]["longest_streak"] == 3
        assert data[0]["current_streak"] == 0

    @pytest.mark.asyncio
    async def test_list_habits_include_archived(self, client, mock_db, sample_habit_row):
        sample_habit_row.is_archived = True
        habit_result = MagicMock()
        habit_result.scalars.return_value.all.return_value = [sample_habit_row]
        streak_result = MagicMock()
        streak_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(side_effect=[habit_result, streak_result])

        resp = await client.get("/api/v1/habits?include_archived=true")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["is_archived"] is True
        assert data[0]["current_streak"] == 0
        assert data[0]["longest_streak"] == 0


class TestCreateHabit:
    @pytest.mark.asyncio
    async def test_create_habit_success(self, client, mock_db):
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        now = datetime(2026, 6, 1, tzinfo=timezone.utc)
        mock_db.refresh = AsyncMock(side_effect=lambda obj: _refresh_set_id_and_dates(
            obj, id_val=1, created_at=now, updated_at=now,
        ))

        resp = await client.post("/api/v1/habits", json={
            "name": "Run", "color": "#3B82F6", "category": "Health",
        })
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["name"] == "Run"
        assert data["frequency"] == "daily"

    @pytest.mark.asyncio
    async def test_create_habit_missing_name(self, client, mock_db):
        resp = await client.post("/api/v1/habits", json={"color": "#3B82F6"})
        assert resp.status_code == 422


class TestGetHabit:
    @pytest.mark.asyncio
    async def test_get_habit_found(self, client, mock_db, sample_habit_row):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_habit_row
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/1")
        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == "Run"

    @pytest.mark.asyncio
    async def test_get_habit_not_found(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/999")
        assert resp.status_code == 404


class TestUpdateHabit:
    @pytest.mark.asyncio
    async def test_update_habit_success(self, client, mock_db, sample_habit_row):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_habit_row
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        resp = await client.patch("/api/v1/habits/1", json={"name": "Walk"})
        assert resp.status_code == 200
        data = resp.json()["data"]
        # The service mutates the ORM instance and returns it; after PATCH
        # the name should reflect the update, not the original value.
        assert data["name"] == "Walk"

    @pytest.mark.asyncio
    async def test_update_habit_not_found(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.patch("/api/v1/habits/999", json={"name": "Walk"})
        assert resp.status_code == 404


class TestArchiveHabit:
    @pytest.mark.asyncio
    async def test_archive_habit_success(self, client, mock_db, sample_habit_row):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_habit_row
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()

        resp = await client.delete("/api/v1/habits/1")
        assert resp.status_code == 204

    @pytest.mark.asyncio
    async def test_archive_habit_not_found(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.delete("/api/v1/habits/999")
        assert resp.status_code == 404


class TestCheckIn:
    @pytest.mark.asyncio
    async def test_check_in_success(self, client, mock_db):
        habit_mock = MagicMock()
        habit_mock.scalar_one_or_none.return_value = MagicMock()  # habit exists
        dup_mock = MagicMock()
        dup_mock.scalar_one_or_none.return_value = None  # no duplicate
        mock_db.execute = AsyncMock(side_effect=[habit_mock, dup_mock])
        refresh_dt = datetime(2026, 6, 15, tzinfo=timezone.utc)
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        def _refresh_log(obj):
            obj.id = 1
            obj.created_at = refresh_dt
        mock_db.refresh = AsyncMock(side_effect=_refresh_log)

        resp = await client.post("/api/v1/habits/1/check-in", json={})
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_check_in_with_date_and_note(self, client, mock_db):
        habit_mock = MagicMock()
        habit_mock.scalar_one_or_none.return_value = MagicMock()  # habit exists
        dup_mock = MagicMock()
        dup_mock.scalar_one_or_none.return_value = None  # no duplicate
        mock_db.execute = AsyncMock(side_effect=[habit_mock, dup_mock])
        refresh_dt = datetime(2026, 6, 15, tzinfo=timezone.utc)
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        def _refresh_log(obj):
            obj.id = 1
            obj.created_at = refresh_dt
        mock_db.refresh = AsyncMock(side_effect=_refresh_log)

        resp = await client.post(
            "/api/v1/habits/1/check-in",
            json={"date": "2026-06-15", "note": "Morning run"},
        )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_check_in_duplicate(self, client, mock_db):
        habit_mock = MagicMock()
        habit_mock.scalar_one_or_none.return_value = MagicMock()  # habit exists
        dup_mock = MagicMock()
        dup_mock.scalar_one_or_none.return_value = MagicMock(id=1)  # duplicate
        mock_db.execute = AsyncMock(side_effect=[habit_mock, dup_mock])

        resp = await client.post("/api/v1/habits/1/check-in", json={})
        assert resp.status_code == 409


class TestArchiveCheckIn:
    @pytest.mark.asyncio
    async def test_archive_check_in_success(self, client, mock_db, sample_log_row):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_log_row
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()

        resp = await client.delete("/api/v1/habits/1/check-in/1")
        assert resp.status_code == 204

    @pytest.mark.asyncio
    async def test_archive_check_in_not_found(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.delete("/api/v1/habits/1/check-in/999")
        assert resp.status_code == 404


class TestGetCheckIns:
    @pytest.mark.asyncio
    async def test_get_check_ins_with_data(self, client, mock_db, sample_log_row):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_log_row]
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get(
            "/api/v1/habits/1/check-ins?from=2026-06-01&to=2026-06-30"
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["note"] == "Morning run"

    @pytest.mark.asyncio
    async def test_get_check_ins_empty(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get(
            "/api/v1/habits/1/check-ins?from=2026-01-01&to=2026-01-31"
        )
        assert resp.status_code == 200
        assert resp.json()["data"] == []


class TestStreaks:
    @pytest.mark.asyncio
    async def test_streaks_with_check_ins(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            date(2026, 6, 1), date(2026, 6, 2), date(2026, 6, 3),
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/1/streaks")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["total_check_ins"] == 3
        assert data["longest_streak"] == 3

    @pytest.mark.asyncio
    async def test_streaks_empty(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/1/streaks")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["current_streak"] == 0
        assert data["longest_streak"] == 0
        assert data["total_check_ins"] == 0


class TestHeatmap:
    @pytest.mark.asyncio
    async def test_heatmap_with_data(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.all.return_value = [
            (date(2026, 6, 1), 3),
            (date(2026, 6, 2), 1),
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get(
            "/api/v1/habits/heatmap?from=2026-06-01&to=2026-06-30"
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 2
        assert data[0]["count"] == 3

    @pytest.mark.asyncio
    async def test_heatmap_empty(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get(
            "/api/v1/habits/heatmap?from=2026-06-01&to=2026-06-30"
        )
        assert resp.status_code == 200
        assert resp.json()["data"] == []
