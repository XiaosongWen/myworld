import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "dev"
    database_url: str = "postgresql+asyncpg://mynest:mynest@localhost:5432/mynest"
    redis_url: str = ""
    storage_path: str = "./mynest-storage"

    # Supabase Settings (supports both Publishable/Secret and Anon/Service Role keys)
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_service_role_key: str = ""

    @property
    def public_key(self) -> str:
        return self.supabase_publishable_key or self.supabase_anon_key

    @property
    def private_key(self) -> str:
        return self.supabase_secret_key or self.supabase_service_role_key

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


_env = os.environ.get("APP_ENV", "dev")
_yaml_path = os.path.join(os.path.dirname(__file__), "configs", f"{_env}.yaml")

if os.path.exists(_yaml_path):
    settings = Settings(_yaml_file=_yaml_path)
else:
    settings = Settings()

