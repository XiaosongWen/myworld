# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyWorld is a personal life OS — an all-in-one app for habit tracking, task management, photo/video libraries, ebook/document management, knowledge management, and AI-powered search/retrieval. It runs locally on a single machine (RTX 4090 GPU available for AI workloads).

**Current state:** Pre-implementation design phase. No code has been written yet. See `agents/design-doc/` for the full architecture and roadmap.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python 3.12 + FastAPI |
| Web Frontend | React 18 + Vite + React Router |
| Mobile | React Native + Expo |
| Database | PostgreSQL 16 + pgvector |
| Cache/Queue | Redis + ARQ (async Redis queue) |
| ORM | SQLAlchemy 2.0 + Alembic (migrations) |
| State (web & mobile) | Zustand |
| AI Models (local) | InsightFace, YOLOv8, CLIP, Sentence-Transformers, Ollama |
| Containerization | Docker + Docker Compose |

## Commands

```bash
# Start dev infrastructure (PostgreSQL + Redis only)
docker compose -f docker-compose.infra.yml up -d

# Start staging (app service, needs infra running)
docker compose -f docker-compose.stage.yml up -d

# Start production (app service, needs infra running)
docker compose -f docker-compose.prod.yml up -d

# Backend dev (run locally, needs dev infra running)
cd backend && uvicorn main:app --reload

# Frontend dev (run locally, needs dev infra + backend running)
cd frontend && npm run dev

# Database migrations
cd backend && alembic upgrade head

# Run tests (backend)
cd backend && pytest
```

## Architecture

**Monorepo structure** — `backend/`, `frontend/`, `mobile/` share a single repo. The backend is API-first: both web and mobile consume the same REST API at `/api/v1/`.

**Module system** — each feature domain (habits, tasks, photos, videos, books, documents, knowledge) is an independent module with its own router, models, schemas, and services under `backend/`. The dashboard aggregates across modules.

**Cross-module rule** — when module A needs data or logic from module B, it **must** call B's service layer. Never directly import another module's models or query its tables. This keeps modules decoupled and refactorable independently. Within a single module, router → service → model is the normal call chain.

**AI pipeline** — file uploads enqueue background AI tasks (face detection, object detection, embeddings, OCR) via ARQ + Redis. Results are stored in pgvector for semantic search. LLM (local Ollama or external API) provides RAG over the knowledge space.

**File storage** — local filesystem organized by date under `myworld-storage/`. Originals preserved, thumbnails are regeneratable. UUIDs for filenames to avoid conflicts.

See `agents/design-doc/high_level_design.md` for full DB schemas, API structure, AI pipeline diagrams, and design decision rationale.

## Development Roadmap

The phased roadmap is in `agents/design-doc/roadmap.md`. 

Current target: Phase 1.

## Guidelines

The `andrej-karpathy-skills:karpathy-guidelines` skill is installed. Key principles:

- **Think before coding** — surface assumptions and tradeoffs explicitly
- **Simplicity first** — minimum code, no speculative abstractions
- **Surgical changes** — touch only what's needed, match existing style
- **Goal-driven execution** — define verifiable success criteria for each step

## Task Workflow

When asked to implement a task from `agents/design-doc/roadmap.md`:

1. **Create a branch** — `git checkout -b <feature-branch>` from `main` (or the branch the user specifies)
2. **Write an execution plan** — create a `.md` file in `agents/exec-plan/active/` covering:
   - What will be built and why
   - Files that will be created or modified
   - Verification steps (how to confirm it works)
3. **Wait for approval** — present the plan and do not write any code until the user says to proceed
4. **Implement** — code only after the plan is approved
5. **Move plan** — once the user verifies the implementation, move the plan file from `active/` to `complete/`
6. **Record debt** — if anything is deferred or compromises are made, add an entry to `agents/design-doc/technical_debt.md`

Strict ordering: branch → plan → review → code → verify → archive + debt log.

## Important

- `.env` is in `.gitignore` — never commit it. It currently contains API keys in plaintext.
- The project uses a single default user for now; multi-user auth is a Phase 8 concern. Don't build auth prematurely.
- AI models run locally via direct Python (not separate services) — simpler for single-machine use.
