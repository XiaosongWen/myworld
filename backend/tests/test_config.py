"""Tests for the Settings / config module."""

from config import Settings


class TestSettingsDefaults:
    """Default values when no env vars are set."""

    def test_database_url_default(self, monkeypatch):
        monkeypatch.delenv("DATABASE_URL", raising=False)
        monkeypatch.delenv("REDIS_URL", raising=False)
        monkeypatch.delenv("STORAGE_PATH", raising=False)
        monkeypatch.delenv("APP_ENV", raising=False)
        s = Settings(_env_file=None, _yaml_file="configs/dev.yaml")
        assert (
            s.database_url
            == "postgresql+asyncpg://mynest:mynest@localhost:5432/mynest"
        )

    def test_redis_url_default(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        s = Settings(_env_file=None, _yaml_file="configs/dev.yaml")
        assert s.redis_url == "redis://localhost:6379"

    def test_storage_path_default(self, monkeypatch):
        monkeypatch.delenv("STORAGE_PATH", raising=False)
        monkeypatch.delenv("APP_ENV", raising=False)
        s = Settings(_env_file=None, _yaml_file="configs/dev.yaml")
        assert s.storage_path == "./mynest-storage"


class TestSettingsEnvOverride:
    """Values can be overridden via environment variables."""

    def test_database_url_override(self, monkeypatch):
        monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@h:9999/db")
        s = Settings(_env_file=None)
        assert s.database_url == "postgresql+asyncpg://u:p@h:9999/db"

    def test_redis_url_override(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://remote:6380")
        s = Settings(_env_file=None)
        assert s.redis_url == "redis://remote:6380"

    def test_storage_path_override(self, monkeypatch):
        monkeypatch.setenv("STORAGE_PATH", "/data/storage")
        s = Settings(_env_file=None)
        assert s.storage_path == "/data/storage"

    def test_partial_override(self, monkeypatch):
        """Only the overridden field changes; defaults remain for others."""
        monkeypatch.delenv("REDIS_URL", raising=False)
        monkeypatch.delenv("STORAGE_PATH", raising=False)
        monkeypatch.delenv("APP_ENV", raising=False)
        monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://override/db")
        s = Settings(_env_file=None, _yaml_file="configs/dev.yaml")
        assert s.database_url == "postgresql+asyncpg://override/db"
        assert s.redis_url == "redis://localhost:6379"
        assert s.storage_path == "./mynest-storage"
