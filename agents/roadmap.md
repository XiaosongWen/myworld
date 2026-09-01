# MyWorld — Development Roadmap

> Track progress by marking items: `[ ]` → `[/]` (in progress) → `[x]` (done)  
> Synced with GitHub Project Board: [Project 2](https://github.com/users/XiaosongWen/projects/2)

---

## Phase 1 — Foundation (Weeks 1-2)
> Get the skeleton running end-to-end

- [x] Project setup: Docker Compose (PostgreSQL + Redis), FastAPI scaffold, React Vite scaffold (#10)
- [x] Alembic setup + User table & default single user (#11)
- [x] API health check, CORS config, user endpoint (prove UI → API → DB works) (#12)
- [x] Basic navigation shell in web UI (sidebar with module links) (#13)
- [x] Set up GitHub Actions CI pipeline to auto-run tests on PRs (#51)
- [x] Create Deployment Docker Compose Files (stage + prod) (#47)

---

## Phase 2 — Core Modules (Weeks 3-6)
> Build and refine the core Pursuits (Commitments + Records), AI-Enabled Workout & Fitness Module, and Video Management Module.

- [x] **Habit Tracker & Task Manager (Legacy)** — Replaced by Pursuits refactor (#14, #15)
- [x] **API Response Standardization** — Standardized JSON envelope (#45)
- [x] **Logging & Tracing** — Loguru integration, request-level logging (#46)
- [x] **Pursuits Core Module: Backend** — Commitments, links, records CRUD, and progress computation (#53)
- [x] **Pursuits Core Module: Frontend** — Unified Pursuits UI, Calendar heatmap, MonthGlance, and DailyLog (#54, #56)
- [x] **Dashboard Module** — Consolidated daily overview via Pursuits API & Weather forecast strip (#16, #61)
- [x] **Label System: Backend & Frontend** — Cross-cutting tagging for all entities (#55)
- [ ] **AI-Enabled Workout & Fitness Module** (#71) —
  - [ ] **Backend Data Models & Migrations** — `workout_plans`, `workout_sessions`, `workout_exercises` tables (#72)
  - [ ] **AI Assistant & Cloud LLM Service Layer** — Multi-provider support (Gemini, OpenAI, Claude, heuristic fallback) (#73)
  - [ ] **AI Workout Plan Generator** — Tailored multi-day splits based on goals, schedule, equipment, experience (tracked in #73)
  - [ ] **AI Daily Coach & Suggestions** — Real-time routine recommendations adapting to fatigue, soreness, and time constraints (#74)
  - [ ] **Detailed Workout & Exercise Logger** — Session tracking with sets, reps, weight, RPE, rest timer, and notes (#75)
  - [ ] **Workout History & Progressive Overload Analytics** — Volume load tracking, PR milestones, and AI recovery/progression insights (tracked in #75)
  - [ ] **Frontend Workouts View & Active Logger UI** — Dedicated `/workouts` page, interactive logger, sidebar navigation, and daily dashboard sync (#76)
- [ ] **Video Management Module** (#26) —
  - [ ] **Video Upload & Supabase Storage Integration** — Direct/resumable upload to Supabase video bucket (tracked in #26)
  - [ ] **Collections & Metadata Extraction** — Duration, resolution, codec, and thumbnail/preview clip generation (tracked in #26)
  - [ ] **Streaming Video Player UI** — Smooth in-browser playback with collections and tag filtering (tracked in #26)

---

## Phase 3 — Web UI Responsiveness & Secure Cloud Deployment (Weeks 7-9)
> Make the Web UI fully responsive across Desktop, iPad/Tablet, and Mobile Phone viewports, harden security, and deploy live to Cloudflare Pages + Google Cloud Run + Supabase for immediate cross-device access.

- [ ] **Web UI Responsive Adaptation (Desktop, iPad, Phone)** (#65) —
  - [ ] Responsive navigation shell (collapsible sidebar / mobile bottom bar & touch drawer)
  - [ ] Viewport-specific layouts for Dashboard, Calendar Heatmap, and MonthGlance on tablets and mobile screens
  - [ ] Touch-friendly Pursuits, Workouts active logger, and daily check-in UI
- [ ] **Security & Cloud Hardening** (#77) —
  - [ ] Supabase JWT token verification middleware for FastAPI backend
  - [ ] PostgreSQL Row Level Security (RLS) & user-scoped data queries
  - [ ] Secure CORS whitelist for Cloudflare Pages production and preview domains
  - [ ] Google Cloud Secret Manager / environment variables injection
  - [ ] Security headers and request rate/payload limits
- [ ] **Cloud Deployment ("Test & Experience")** (#66) —
  - [ ] **Supabase Setup**: Provision PostgreSQL 16 with `pgvector`, Auth, and Storage buckets (`photos`, `videos`, `books`, `documents`, `avatars`) (#67)
  - [ ] **Google Cloud Run Backend Deployment**: Build container & deploy FastAPI service with auto-scaling to zero and secrets (#68)
  - [ ] **Cloudflare Pages Frontend Deployment**: Build and deploy Vite React SPA on Cloudflare Pages global edge CDN (#69)
  - [ ] **End-to-End Cloud Validation**: Verify live experience from iPhone, iPad, and Desktop; validate Calendar Heatmap, Daily Log, and Pursuits (#70)

---

## Phase 4 — Knowledge Space & Cloud RAG (Weeks 10-13)
> Connect and organize your thinking

- [ ] **Knowledge Space** — Create spaces, markdown notes, note linking (#22)
- [ ] **Cloud RAG Chat Interface** — "Ask your knowledge base" powered by Gemini / OpenAI (#23)
- [ ] **Text Embeddings & Vector Search** — Sentence-Transformers / Cloud embeddings stored in Supabase pgvector (#24)

---

## Phase 5 — Photo Library, Ebooks & Documents (Weeks 14-19)
> Media & file management backed by Supabase Storage

- [ ] **Photo Library** — Upload to Supabase bucket, albums, timeline view, EXIF extraction, thumbnails (#25)
- [ ] **Ebook Module** — Upload EPUB/PDF to Supabase Storage, in-browser reader, highlights & progress (#27)
- [ ] **Document Module** — Upload, folder structure, preview, OCR, full-text search (#28)
- [ ] **File Storage Infrastructure** — Organized storage & cloud bucket synchronization (#29)

---

## Phase 6 — Advanced Cloud AI Features (Weeks 20-24)
> Intelligence layer across all modules

- [ ] Setup local / cloud AI models (InsightFace, YOLOv8, CLIP, Sentence-Transformers) (#30)
- [ ] Background worker infrastructure (ARQ + Redis) (#31)
- [ ] Photo AI: face detection, object tagging, CLIP embeddings, semantic search (#32)
- [ ] Document AI: OCR, text embeddings, semantic search (#33)
- [ ] Knowledge Space AI: RAG pipeline (chunk → embed → retrieve → LLM answer) (#34)
- [ ] Auto-import book highlights & documents into Knowledge Space (#35)

---

## Phase 7 — Mobile App (React Native / iOS & Android) (Weeks 25-28)
> Consolidated native mobile application development (combining all v1 and v2 mobile tasks)

- [ ] **React Native (Expo) Project Setup** — App shell & navigation in `/mobile` (#17)
- [ ] **Shared API Client Layer** — Unified SDK for Web and Mobile (#18)
- [ ] **Core Mobile Screens** — Dashboard, Habits, Tasks / Pursuits (iOS & Android) (#19)
- [ ] **Additional Mobile Screens** — Photos, Videos, Books, Documents, Knowledge (#36)
- [ ] **Push Notifications** — Habit, workout, and commitment reminders (#20)
- [ ] **Photo & Video Capture** — Direct camera capture and upload from phone (#37)
- [ ] **Offline Caching & Sync** — Local SQLite caching for offline workout & habit tracking (#38)
- [ ] **Evaluate Mobile Experience** (#21)

---

## Phase 8 — Multi-User & Family Sharing (Future)
> Production-ready collaboration

- [ ] Authentication system (JWT) (#39)
- [ ] Multi-user: registration, login, per-user data isolation (#40)
- [ ] Family sharing: shared albums, shared workout splits, shared task lists (#41)
- [ ] Cloud migration path (#42)
- [ ] Backup & restore / export system (#43)
