# MyWorld — Development Roadmap

> Track progress by marking items: `[ ]` → `[/]` (in progress) → `[x]` (done)

---

## Phase 1 — Foundation (Weeks 1-2)
> Get the skeleton running end-to-end

- [ ] Project setup: Docker Compose (PostgreSQL + Redis), FastAPI scaffold, React Vite scaffold
- [ ] Alembic setup + User table & default single user
- [ ] API health check, CORS config, user endpoint (prove UI → API → DB works)
- [ ] Basic navigation shell in web UI (sidebar with module links)

---

## Phase 2 — Core Modules (Weeks 3-6)
> Build the most useful features first

- [ ] **Habit Tracker** — DB tables, CRUD API, check-in, streaks, calendar heatmap
- [ ] **Task Manager** — DB tables, CRUD API, projects, tags, kanban board, list view
- [ ] **Dashboard** — aggregate habits + tasks data

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
