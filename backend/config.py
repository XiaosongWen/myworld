import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "dev"
    database_url: str = "postgresql+asyncpg://myworld:myworld@localhost:5432/myworld"
    redis_url: str = "redis://localhost:6379"
    storage_path: str = "./myworld-storage"

    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")


_env = os.environ.get("APP_ENV", "dev")
_yaml_path = os.path.join(os.path.dirname(__file__), "configs", f"{_env}.yaml")

if os.path.exists(_yaml_path):
    settings = Settings(_yaml_file=_yaml_path)
else:
    settings = Settings()

