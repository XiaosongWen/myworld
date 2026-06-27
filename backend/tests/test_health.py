"""Tests for the health-check endpoint."""

import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(client):
    """GET /api/v1/health should return {"status": "ok"}."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_health_returns_json_content_type(client):
    """GET /api/v1/health should return JSON."""
    response = await client.get("/api/v1/health")
    assert response.headers["content-type"] == "application/json"
