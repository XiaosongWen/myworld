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
> Build and refine the core Pursuits (Commitments + Records), AI-Enabled Workout & Fitness Module, and Video Management Module.

- [x] **Habit Tracker & Task Manager (Legacy)** — Replaced by Pursuits refactor
- [x] **API Response Standardization** — Standardized JSON envelope
- [x] **Logging & Tracing** — Loguru integration, request-level logging
- [ ] **Pursuits Core Module: Backend** — Commitments, links, records CRUD, and progress computation
- [ ] **Pursuits Core Module: Frontend** — Unified Pursuits UI, Calendar heatmap, MonthGlance, and DailyLog
- [ ] **Dashboard Module** — Consolidated daily overview via Pursuits API
- [ ] **Label System: Backend & Frontend** — Cross-cutting tagging for all entities
- [ ] **AI-Enabled Workout & Fitness Module** —
  - [ ] **Backend Data Models & Migrations** — `workout_plans`, `workout_sessions`, `workout_exercises` tables
  - [ ] **AI Assistant & Cloud LLM Service Layer** — Multi-provider support (Gemini, OpenAI, Claude, heuristic fallback)
  - [ ] **AI Workout Plan Generator** — Tailored multi-day splits based on goals, schedule, equipment, experience
  - [ ] **AI Daily Coach & Suggestions** — Real-time routine recommendations adapting to fatigue, soreness, and time constraints
  - [ ] **Detailed Workout & Exercise Logger** — Session tracking with sets, reps, weight, RPE, rest timer, and notes
  - [ ] **Workout History & Progressive Overload Analytics** — Volume load tracking, PR milestones, and AI recovery/progression insights
  - [ ] **Frontend Workouts View & Active Logger UI** — Dedicated `/workouts` page, interactive logger, sidebar navigation, and daily dashboard sync
- [ ] **Video Management Module** —
  - [ ] **Video Upload & Supabase Storage Integration** — Direct/resumable upload to Supabase video bucket
  - [ ] **Collections & Metadata Extraction** — Duration, resolution, codec, and thumbnail/preview clip generation
  - [ ] **Streaming Video Player UI** — Smooth in-browser playback with collections and tag filtering

---

## Phase 3 — Web UI Responsiveness & Secure Cloud Deployment (Weeks 7-9)
> Make the Web UI fully responsive across Desktop, iPad/Tablet, and Mobile Phone viewports, harden security, and deploy live to Cloudflare Pages + Google Cloud Run + Supabase for immediate cross-device access.

- [ ] **Web UI Responsive Adaptation (Desktop, iPad, Phone)** —
  - [ ] Responsive navigation shell (collapsible sidebar / mobile bottom bar & touch drawer)
  - [ ] Viewport-specific layouts for Dashboard, Calendar Heatmap, and MonthGlance on tablets and mobile screens
  - [ ] Touch-friendly Pursuits, Workouts active logger, and daily check-in UI
- [ ] **Security & Cloud Hardening** —
  - [ ] Supabase JWT token verification middleware for FastAPI backend
  - [ ] PostgreSQL Row Level Security (RLS) & user-scoped data queries
  - [ ] Secure CORS whitelist for Cloudflare Pages production and preview domains
  - [ ] Google Cloud Secret Manager / environment variables injection
  - [ ] Security headers and request rate/payload limits
- [ ] **Supabase Cloud Setup** —
  - [ ] Provision PostgreSQL 16 with `pgvector` extension
  - [ ] Apply Alembic migrations to cloud database
  - [ ] Configure Supabase Storage buckets (`photos`, `videos`, `books`, `documents`, `avatars`)
  - [ ] Configure Supabase Auth
- [ ] **Google Cloud Run Backend Deployment** —
  - [ ] Build production Docker container for FastAPI
  - [ ] Configure Cloud Run service (auto-scaling to zero, custom domain/HTTPS, secrets)
- [ ] **Cloudflare Pages Frontend Deployment** —
  - [ ] Build and deploy Vite React SPA on Cloudflare Pages global edge CDN
  - [ ] Set `VITE_API_BASE_URL` to Cloud Run backend endpoint
- [ ] **End-to-End Cloud Validation ("Test & Experience")** —
  - [ ] Verify live experience from iPhone, iPad, and Desktop browsers
  - [ ] Validate Calendar Heatmap, Daily Log, Pursuits, Workouts, and Video streaming

---

## Phase 4 — Knowledge Space & Cloud RAG (Weeks 10-13)
> Connect and organize your thinking

- [ ] **Knowledge Space** — Create spaces, markdown notes, note linking
- [ ] **Cloud RAG Chat Interface** — "Ask your knowledge base" powered by Gemini / OpenAI
- [ ] **Text Embeddings & Vector Search** — Sentence-Transformers / Cloud embeddings stored in Supabase pgvector

---

## Phase 5 — Photo Library, Ebooks & Documents (Weeks 14-19)
> Media & file management backed by Supabase Storage

- [ ] **Photo Library** — Upload to Supabase bucket, albums, timeline view, EXIF extraction, thumbnails
- [ ] **Ebook Module** — Upload EPUB/PDF to Supabase Storage, in-browser reader, highlights & progress
- [ ] **Document Module** — Upload, folder structure, preview, OCR, full-text search

---

## Phase 6 — Advanced Cloud AI Features (Weeks 20-24)
> Intelligence layer across all modules

- [ ] Cloud Vision integration: face detection, object tagging, CLIP embeddings
- [ ] Document OCR pipeline & semantic search
- [ ] Knowledge Space: automated highlight extraction from books & documents

---

## Phase 7 — Mobile App (React Native / iOS & Android) (Weeks 25-28)
> Consolidated native mobile application development (combining all v1 and v2 mobile tasks)

- [ ] **React Native (Expo) Project Setup** — App shell & navigation in `/mobile`
- [ ] **Shared API Client Layer** — Unified SDK for Web and Mobile
- [ ] **Core Mobile Screens** — Dashboard, Pursuits, Workouts, Daily Log, Media Libraries
- [ ] **Push Notifications** — Habit, workout, and commitment reminders
- [ ] **Photo & Video Capture** — Direct camera capture and upload from phone
- [ ] **Offline Caching & Sync** — Local SQLite caching for offline workout & habit tracking

---

## Phase 8 — Multi-User & Family Sharing (Future)
> Production-ready collaboration

- [ ] Multi-user registration & organization isolation
- [ ] Family sharing: shared albums, shared workout splits, shared task lists
- [ ] Backup & export system
