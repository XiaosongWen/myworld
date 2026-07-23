# Backend Configuration Migration Plan

## What will be built and why
We will refactor the backend to load configurations dynamically using a hybrid approach. Currently, all configurations are hardcoded or read from a single `.env` file. To easily switch between `dev`, `staging`, and `prod` environments, we will:
- Use **YAML files** for general, structured application configurations (like `storage_path`).
- Keep using **.env files** for sensitive secrets (like database credentials).
- An `APP_ENV` environment variable will dictate which YAML configuration file should be loaded.
- The YAML directory uses the plural name `configs/` (not `config/`) to avoid conflicting with the existing `backend/config.py` Python module.

## Files that will be created or modified
- `backend/requirements.txt`: Update `pydantic-settings` to include the `[yaml]` extra.
- `backend/configs/dev.yaml` (new): Contains dev-specific general settings.
- `backend/configs/staging.yaml` (new): Contains staging-specific general settings.
- `backend/configs/prod.yaml` (new): Contains production-specific general settings.
- `backend/config.py`: Refactor to load both `.env` and the specific YAML file determined by `APP_ENV`.
- `backend/alembic/env.py`: Ensure it imports `settings` from `config.py` to get the DB URL dynamically.
- `docker-compose.staging.yml`: Add `APP_ENV=staging` to the backend service environment variables.
- (Optional) Root `.env`: Can set `APP_ENV=dev` for local development; otherwise defaults to `dev`.

## Implementation Details

### 1. YAML config files

Create `backend/configs/dev.yaml`:
```yaml
storage_path: ./mynest-storage
```

Create `backend/configs/staging.yaml`:
```yaml
storage_path: /app/storage
```

Create `backend/configs/prod.yaml`:
```yaml
storage_path: /app/storage
```

> **Note:** Do not create `__init__.py` in `backend/configs/` — it is a data directory, not a Python package. YAML files are loaded by file path, not by import.

### 2. Updated `backend/config.py`

```python
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://mynest:mynest@localhost:5432/mynest"
    redis_url: str = "redis://localhost:6379"
    storage_path: str = "./mynest-storage"

    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8")


# Load environment-specific YAML on top of .env defaults
_env = os.environ.get("APP_ENV", "dev")
settings = Settings(_yaml_file=f"configs/{_env}.yaml")
```

Key points:
- `_yaml_file` is a runtime override passed directly to the constructor — not in `model_config` — so the path can be dynamic based on `APP_ENV`.
- `.env` values take precedence over class defaults; YAML values merge on top of `.env` (per pydantic-settings resolution order).
- The default `APP_ENV` is `dev` when not set anywhere.

### 3. Docker Compose updates

**`docker-compose.staging.yml`** — add `APP_ENV=staging` to the backend service:
```yaml
backend:
  environment:
    APP_ENV: staging
    DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER:-mynest}:${POSTGRES_PASSWORD:-mynest}@postgres:5432/${POSTGRES_DB:-mynest_stage}
    REDIS_URL: redis://redis:6379
    STORAGE_PATH: /app/storage
```

**`docker-compose.dev.yml`** — no changes needed. There is no backend container in dev compose (the backend runs locally via `uvicorn`). Set `APP_ENV=dev` in the root `.env` file or shell environment instead.

### 4. Root `.env` file

Create at repo root (`.env`):
```env
# Local development defaults
APP_ENV=dev
# DATABASE_URL=postgresql+asyncpg://mynest:mynest@localhost:5432/mynest
# REDIS_URL=redis://localhost:6379
```

The commented lines show the defaults used when omitted.

## Verification steps
1. Run `docker compose -f docker-compose.dev.yml up -d` and `cd backend && uvicorn main:app --reload`.
2. Check that the backend starts successfully without configuration errors.
3. Verify that the correct environment's settings are loaded (e.g. `storage_path` points to the dev path).
4. Run `alembic upgrade head` and verify it connects to the correct database and executes successfully.
5. Set `APP_ENV=staging` and confirm `storage_path` switches to `/app/storage`.
