# MyWorld — Development Roadmap

> Track progress by marking items: `[ ]` → `[/]` (in progress) → `[x]` (done)

---

## Phase 1 — Foundation (Weeks 1-2)
> Get the skeleton running end-to-end

- [x] Project setup: Docker Compose (PostgreSQL + Redis), FastAPI scaffold, React Vite scaffold
- [x] Alembic setup + User table & default single user
- [x] API health check, CORS config, user endpoint (prove UI → API → DB works)
- [x] Basic navigation shell in web UI (sidebar with module links)

---

## Phase 2 — Core Modules (Weeks 3-6)
> Build the unified Pursuits (Commitments + Records) core module and Dashboard, replacing separate Habit/Task/Goal modules with a flexible 3-table architecture.

- [x] **Habit Tracker & Task Manager (Legacy)** — Replaced by Pursuits refactor
- [x] **API Response Standardization** — Standardized JSON envelope
- [x] **Logging & Tracing** — Loguru integration, request-level logging
- [ ] **Backend Config Migration** — YAML configs per environment
- [ ] **Deployment Compose Setup** — docker-compose stage/prod files
- [ ] **Pursuits Core Module: Backend** — commitments, commitment_links, records CRUD & progress
- [ ] **Pursuits Core Module: Frontend** — Unified Pursuits UI (Commitments, Detail, DailyLog)
- [ ] **Dashboard Module** — Consolidated daily overview via Pursuits API
- [ ] **Label System: Backend** — Cross-cutting tagging for all entities
- [ ] **Integration: UI & API + Integration Tests** — Data binding and E2E testing

---

## Phase 3 — iOS App v1 (Weeks 7-9)
> Early mobile experience with core modules

- [ ] React Native (Expo) project setup
- [ ] Shared API client layer
- [ ] Core screens: Dashboard, Habits, Tasks
- [ ] Push notifications for habit reminders
- [ ] Evaluate iOS experience → decide on further mobile investment

---

## Phase 4 — Knowledge Space (Weeks 10-13)
> Connect and organize your thinking

- [ ] **Knowledge Space** — create spaces, markdown notes, note linking
- [ ] RAG chat interface ("ask your knowledge base")
- [ ] Text embeddings + semantic search (Sentence-Transformers + pgvector)

---

## Phase 5 — Media & File Libraries (Weeks 14-19)
> Photo, video, ebook, and document management

- [ ] **Photo Library** — upload, albums, thumbnails, timeline view, EXIF extraction
- [ ] **Video Library** — upload, collections, thumbnails, streaming playback
- [ ] **Ebook Module** — upload, epub/pdf reader, progress tracking, highlights
- [ ] **Document Module** — upload, folder structure, preview, full-text search
- [ ] File storage infrastructure (organized folder structure)

---

## Phase 6 — AI Features (Weeks 20-24)
> Intelligence layer across all modules

- [ ] Setup local AI models (InsightFace, YOLOv8, CLIP, Sentence-Transformers)
- [ ] Background worker infrastructure (ARQ + Redis)
- [ ] Photo: face detection, object tagging, CLIP embeddings, semantic search
- [ ] Document: OCR, text embeddings, semantic search
- [ ] Knowledge Space: RAG pipeline (chunk → embed → retrieve → LLM answer)
- [ ] Auto-import book highlights & documents into Knowledge Space

---

## Phase 7 — iOS App v2 + Polish (Weeks 25-28)
> Expand mobile to all modules

- [ ] Add screens: Photos, Videos, Books, Documents, Knowledge
- [ ] Photo capture & upload from phone
- [ ] Offline support for habits & tasks

---

## Phase 8 — Multi-user & Cloud (Future)
> Production-ready

- [ ] Authentication system (JWT)
- [ ] Multi-user: registration, login, per-user data isolation
- [ ] Family sharing: shared albums, shared task lists
- [ ] Cloud migration path (Docker → cloud hosting)
- [ ] Backup & restore system
