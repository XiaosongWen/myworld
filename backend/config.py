from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://myworld:myworld@localhost:5432/myworld"
    redis_url: str = "redis://localhost:6379"
    storage_path: str = "./myworld-storage"

    model_config = {"env_file": "../.env", "env_file_encoding": "utf-8"}


settings = Settings()
