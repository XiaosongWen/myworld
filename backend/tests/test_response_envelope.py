"""Tests for the standardized JSON response envelope.

Verifies that every endpoint returns the correct envelope structure:
- Success single: {"msg": "success", "request_id": "...", "data": {...}}
- Success list:   {"msg": "success", "request_id": "...", "data": [...], "pagination": {...}}
- Error:          {"msg": "...", "request_id": "..."}
"""

from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import status

from database import get_db
from main import app
from models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_habit(**kwargs):
    name_value = kwargs.pop("name", None)
    m = MagicMock()
    for k, v in kwargs.items():
        setattr(m, k, v)
    if name_value is not None:
        m.name = name_value
    return m


def _assert_single_envelope(body: dict):
    """Assert the body is a valid SingleResponse envelope."""
    assert body["msg"] == "success"
    assert isinstance(body["request_id"], str)
    assert len(body["request_id"]) > 0
    assert "data" in body


def _assert_list_envelope(body: dict):
    """Assert the body is a valid ListResponse envelope."""
    _assert_single_envelope(body)  # shares msg, request_id, data
    assert isinstance(body["data"], list)
    assert "pagination" in body
    pagination = body["pagination"]
    assert isinstance(pagination["page"], int)
    assert isinstance(pagination["page_size"], int)
    assert isinstance(pagination["total_rows"], int)


def _assert_error_envelope(body: dict):
    """Assert the body is a valid ErrorResponse envelope."""
    assert isinstance(body["msg"], str)
    assert len(body["msg"]) > 0
    assert isinstance(body["request_id"], str)
    assert "data" not in body


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db():
    session = AsyncMock()
    app.dependency_overrides[get_db] = lambda: session
    yield session
    app.dependency_overrides.clear()


@pytest.fixture
def sample_habit():
    return _mock_habit(
        id=1, user_id=1, name="Run", description=None,
        color="#3B82F6", category="Health", frequency="daily",
        is_archived=False,
        created_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
        updated_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
    )


@pytest.fixture
def mock_user_db():
    session = AsyncMock()
    default_user = User(
        id=1, username="default", email=None,
        created_at=datetime.now(timezone.utc),
    )

    async def execute_side_effect(query):
        result = MagicMock()
        result.scalar_one.return_value = default_user
        return result

    session.execute = AsyncMock(side_effect=execute_side_effect)
    app.dependency_overrides[get_db] = lambda: session
    yield session
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# SingleResponse envelope tests
# ---------------------------------------------------------------------------

class TestSingleResponseEnvelope:
    @pytest.mark.asyncio
    async def test_health_envelope(self, client):
        resp = await client.get("/api/v1/health")
        body = resp.json()
        _assert_single_envelope(body)
        assert body["data"] == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_user_me_envelope(self, client, mock_user_db):
        resp = await client.get("/api/v1/users/me")
        body = resp.json()
        _assert_single_envelope(body)
        assert body["data"]["id"] == 1

    @pytest.mark.asyncio
    async def test_get_habit_envelope(self, client, mock_db, sample_habit):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_habit
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/1")
        body = resp.json()
        _assert_single_envelope(body)
        assert body["data"]["id"] == 1

    @pytest.mark.asyncio
    async def test_create_habit_envelope(self, client, mock_db):
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        now = datetime(2026, 6, 1, tzinfo=timezone.utc)
        mock_db.refresh = AsyncMock(side_effect=lambda obj: setattr(obj, "id", 1) or setattr(obj, "created_at", now) or setattr(obj, "updated_at", now))

        resp = await client.post("/api/v1/habits", json={
            "name": "Run", "color": "#3B82F6",
        })
        body = resp.json()
        _assert_single_envelope(body)
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_update_habit_envelope(self, client, mock_db, sample_habit):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_habit
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        resp = await client.patch("/api/v1/habits/1", json={"name": "Walk"})
        body = resp.json()
        _assert_single_envelope(body)

    @pytest.mark.asyncio
    async def test_check_in_envelope(self, client, mock_db):
        habit_mock = MagicMock()
        habit_mock.scalar_one_or_none.return_value = MagicMock()
        dup_mock = MagicMock()
        dup_mock.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(side_effect=[habit_mock, dup_mock])
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        refresh_dt = datetime(2026, 6, 15, tzinfo=timezone.utc)
        mock_db.refresh = AsyncMock(side_effect=lambda obj: setattr(obj, "id", 1) or setattr(obj, "created_at", refresh_dt))

        resp = await client.post("/api/v1/habits/1/check-in", json={})
        body = resp.json()
        _assert_single_envelope(body)
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_streaks_envelope(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            date(2026, 6, 1), date(2026, 6, 2),
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/1/streaks")
        body = resp.json()
        _assert_single_envelope(body)
        assert "current_streak" in body["data"]

    @pytest.mark.asyncio
    async def test_test_success_envelope(self, client):
        resp = await client.get("/test/success")
        body = resp.json()
        _assert_single_envelope(body)

    @pytest.mark.asyncio
    async def test_test_validation_success_envelope(self, client):
        resp = await client.post("/test/validation-error", json={"name": "x", "value": 1})
        body = resp.json()
        _assert_single_envelope(body)


# ---------------------------------------------------------------------------
# ListResponse envelope tests
# ---------------------------------------------------------------------------

class TestListResponseEnvelope:
    @pytest.mark.asyncio
    async def test_list_habits_envelope(self, client, mock_db, sample_habit):
        habit_result = MagicMock()
        habit_result.scalars.return_value.all.return_value = [sample_habit]
        streak_result = MagicMock()
        streak_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(side_effect=[habit_result, streak_result])

        resp = await client.get("/api/v1/habits")
        body = resp.json()
        _assert_list_envelope(body)
        assert body["pagination"]["total_rows"] == 1

    @pytest.mark.asyncio
    async def test_list_habits_empty_envelope(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits")
        body = resp.json()
        _assert_list_envelope(body)
        assert body["pagination"]["total_rows"] == 0

    @pytest.mark.asyncio
    async def test_check_ins_envelope(self, client, mock_db):
        log = MagicMock(
            id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 15),
            note=None, is_archived=False,
            created_at=datetime(2026, 6, 15, tzinfo=timezone.utc),
        )
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [log]
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/1/check-ins?from=2026-06-01&to=2026-06-30")
        body = resp.json()
        _assert_list_envelope(body)
        assert body["pagination"]["total_rows"] == 1

    @pytest.mark.asyncio
    async def test_heatmap_envelope(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.all.return_value = [
            (date(2026, 6, 1), 3),
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/heatmap?from=2026-06-01&to=2026-06-30")
        body = resp.json()
        _assert_list_envelope(body)


# ---------------------------------------------------------------------------
# ErrorResponse envelope tests
# ---------------------------------------------------------------------------

class TestErrorResponseEnvelope:
    @pytest.mark.asyncio
    async def test_validation_error_envelope(self, client):
        """POST with invalid data triggers RequestValidationError → error envelope."""
        resp = await client.post("/test/validation-error", json={"name": "x", "value": "not_an_int_string"})
        # FastAPI will coerce "not_an_int_string" failure → 422
        # Actually, pydantic may coerce strings to int if possible.
        # Use a dict that is clearly invalid:
        resp = await client.post("/test/validation-error", json={"name": 123})
        body = resp.json()
        _assert_error_envelope(body)
        assert body["msg"] == "validation_error"

    @pytest.mark.asyncio
    async def test_http_exception_envelope(self, client):
        """GET /test/http-error triggers HTTPException → error envelope."""
        resp = await client.get("/test/http-error")
        assert resp.status_code == 400
        body = resp.json()
        _assert_error_envelope(body)
        assert body["msg"] == "This is an intentional HTTP error"

    @pytest.mark.asyncio
    async def test_server_error_envelope(self, client):
        """GET /test/server-error triggers unhandled exception → error envelope."""
        resp = await client.get("/test/server-error")
        assert resp.status_code == 500
        body = resp.json()
        _assert_error_envelope(body)
        assert body["msg"] == "server_error"

    @pytest.mark.asyncio
    async def test_404_not_found_envelope(self, client, mock_db):
        """GET non-existent habit → 404 with error envelope."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/999")
        assert resp.status_code == 404
        body = resp.json()
        _assert_error_envelope(body)

    @pytest.mark.asyncio
    async def test_409_conflict_envelope(self, client, mock_db):
        """Duplicate check-in → 409 with error envelope."""
        habit_mock = MagicMock()
        habit_mock.scalar_one_or_none.return_value = MagicMock()
        dup_mock = MagicMock()
        dup_mock.scalar_one_or_none.return_value = MagicMock(id=1)
        mock_db.execute = AsyncMock(side_effect=[habit_mock, dup_mock])

        resp = await client.post("/api/v1/habits/1/check-in", json={})
        assert resp.status_code == 409
        body = resp.json()
        _assert_error_envelope(body)


# ---------------------------------------------------------------------------
# Request-ID consistency tests
# ---------------------------------------------------------------------------

class TestRequestIdConsistency:
    @pytest.mark.asyncio
    async def test_request_id_in_header_matches_body(self, client):
        """X-Request-ID header should match the request_id in the JSON body."""
        resp = await client.get("/api/v1/health")
        body = resp.json()
        header_id = resp.headers.get("x-request-id")
        assert header_id is not None
        assert header_id == body["request_id"]

    @pytest.mark.asyncio
    async def test_request_ids_are_unique(self, client):
        """Two consecutive requests should get different request_ids."""
        resp1 = await client.get("/api/v1/health")
        resp2 = await client.get("/api/v1/health")
        assert resp1.json()["request_id"] != resp2.json()["request_id"]
