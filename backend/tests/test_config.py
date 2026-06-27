"""Tests for the Settings / config module."""

from config import Settings


class TestSettingsDefaults:
    """Default values when no env vars are set."""

    def test_database_url_default(self):
        s = Settings()
        assert (
            s.database_url
            == "postgresql+asyncpg://myworld:myworld@localhost:5432/myworld"
        )

    def test_redis_url_default(self):
        s = Settings()
        assert s.redis_url == "redis://localhost:6379"

    def test_storage_path_default(self):
        s = Settings()
        assert s.storage_path == "./myworld-storage"


class TestSettingsEnvOverride:
    """Values can be overridden via environment variables."""

    def test_database_url_override(self, monkeypatch):
        monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@h:9999/db")
        s = Settings()
        assert s.database_url == "postgresql+asyncpg://u:p@h:9999/db"

    def test_redis_url_override(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://remote:6380")
        s = Settings()
        assert s.redis_url == "redis://remote:6380"

    def test_storage_path_override(self, monkeypatch):
        monkeypatch.setenv("STORAGE_PATH", "/data/storage")
        s = Settings()
        assert s.storage_path == "/data/storage"

    def test_partial_override(self, monkeypatch):
        """Only the overridden field changes; defaults remain for others."""
        monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://override/db")
        s = Settings()
        assert s.database_url == "postgresql+asyncpg://override/db"
        assert s.redis_url == "redis://localhost:6379"
        assert s.storage_path == "./myworld-storage"
