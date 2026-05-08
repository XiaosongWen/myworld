# Phase 1 — Foundation Execution Plan

## What We're Building

The project skeleton: Docker Compose with PostgreSQL + Redis, a FastAPI backend with Alembic migrations, a React Vite frontend with a navigation shell. End-to-end proof that UI → API → DB works.

## Files to Create/Modify

### Infrastructure
- `docker-compose.yml` — PostgreSQL 16 + Redis 7 + backend + frontend services
- `data/postgres/` — local bind-mounted DB data directory (portable across machines)
- `data/redis/` — local bind-mounted Redis data directory
- `.env.example` — template for DB credentials, storage path, etc.

### Backend
- `backend/requirements.txt` — FastAPI, SQLAlchemy 2.0, Alembic, psycopg2, asyncpg, redis, arq, uvicorn, pydantic
- `backend/main.py` — FastAPI app entry point, CORS config, health check router
- `backend/config.py` — Settings from `.env` via Pydantic BaseSettings
- `backend/database.py` — SQLAlchemy async engine + session factory
- `backend/models/__init__.py` — model registry
- `backend/models/user.py` — User table (id, username, email, created_at)
- `backend/schemas/__init__.py`
- `backend/schemas/user.py` — User read/response Pydantic schemas
- `backend/routers/__init__.py`
- `backend/routers/health.py` — GET /api/v1/health
- `backend/routers/user.py` — GET /api/v1/users/me (returns default user)
- `backend/alembic.ini` — Alembic config
- `backend/alembic/env.py` — async migration env
- `backend/alembic/versions/001_create_users.py` — initial migration
- `backend/Dockerfile` — container for backend
- `backend/.env` — local override (gitignored, same format as root .env)

### Frontend
- `frontend/package.json` — React 18, Vite, React Router, Zustand, Axios
- `frontend/vite.config.js` — dev server proxy to backend
- `frontend/index.html`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx` — Router + layout shell
- `frontend/src/api/client.js` — Axios instance pointing at /api/v1
- `frontend/src/components/Sidebar.jsx` — nav links to all module placeholders
- `frontend/src/components/Layout.jsx` — sidebar + content area
- `frontend/src/views/Dashboard.jsx` — placeholder page
- `frontend/src/views/Habits.jsx` — placeholder
- `frontend/src/views/Tasks.jsx` — placeholder
- `frontend/src/views/Photos.jsx` — placeholder
- `frontend/src/views/Videos.jsx` — placeholder
- `frontend/src/views/Books.jsx` — placeholder
- `frontend/src/views/Documents.jsx` — placeholder
- `frontend/src/views/Knowledge.jsx` — placeholder
- `frontend/src/styles/global.css` — basic styles
- `frontend/Dockerfile`

### Root files to modify
- `.gitignore` — add frontend node_modules/.cache/dist/ if not already covered

## Verification Steps

1. `docker-compose up --build` starts all 4 services (pg, redis, backend, frontend)
2. `curl http://localhost:8000/api/v1/health` returns `{"status": "ok"}`
3. `curl http://localhost:8000/api/v1/users/me` returns the default user
4. `curl http://localhost:8000/docs` returns the auto-generated Swagger docs
5. Open `http://localhost:5173` — the React app loads with a sidebar showing all 8 module links
6. Clicking a sidebar link navigates to the correct route and shows a placeholder

## Approach

- **Async everywhere** — FastAPI with async SQLAlchemy session, asyncpg driver
- **Single default user** — seeded in the migration itself (id=1, username="default")
- **No auth** — per roadmap, multi-user/auth is Phase 8
- **Frontend proxies `/api` to backend** — Vite dev server proxy avoids CORS in dev
- **CORS still configured** — for direct API access and future mobile use
- **Minimal styling** — just enough CSS for a working sidebar layout, not a design system

## Out of Scope

- Auth, Zustand stores, real module pages, file upload, AI, mobile app
- These come in Phase 2+
