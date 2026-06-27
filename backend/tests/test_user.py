"""Tests for the /api/v1/users/me endpoint.

Requires overriding the get_db dependency because the real
database is unavailable during unit tests.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from main import app
from models.user import User


@pytest.fixture
def mock_db_session():
    """Return a mock AsyncSession that looks up the default user."""
    session = AsyncMock(spec=AsyncSession)
    default_user = User(
        id=1,
        username="default",
        email=None,
        created_at=datetime.now(timezone.utc),
    )

    async def execute_side_effect(query):
        """Return the default user for *any* select(User).where(id==1) query."""
        result = MagicMock()
        if isinstance(query, type(select(User))):
            result.scalar_one.return_value = default_user
        else:
            result.scalar_one.return_value = default_user
        return result

    session.execute = AsyncMock(side_effect=execute_side_effect)
    return session


@pytest.fixture
def override_get_db(mock_db_session):
    """Replace the real get_db dependency with a mock session."""
    app.dependency_overrides[get_db] = lambda: mock_db_session
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_current_user_returns_default_user(client, override_get_db):
    """GET /api/v1/users/me should return the default seeded user."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["username"] == "default"
    assert data["email"] is None
    assert "created_at" in data


@pytest.mark.asyncio
async def test_get_current_user_response_shape(client, override_get_db):
    """The response should conform to the UserRead schema."""
    response = await client.get("/api/v1/users/me")
    data = response.json()
    assert isinstance(data["id"], int)
    assert isinstance(data["username"], str)
    assert data["email"] is None or isinstance(data["email"], str)


@pytest.mark.asyncio
async def test_user_router_not_found_for_unexpected_path(client):
    """Routes outside /api/v1/users/me should 404 under the users router."""
    response = await client.get("/api/v1/users/999")
    assert response.status_code == 404
