# 2026-08-24: Cloud-Native Deployment Architecture

**Domain:** Core Infrastructure & Deployment

**Layer:** infra / storage / backend / frontend

**Status:** Accepted

**Context:**
Originally, MyWorld was designed to be hosted entirely on a local PC using Docker Compose and local GPU hardware. However, to enable continuous 24/7 access from any device (Desktop, iPad, Phone), effortless media synchronization, zero home server maintenance, and fast experience testing of core features (Calendar, Daily Log, Pursuits), a cloud-native architecture is desired.

**Decision:**
Adopt a serverless, managed 3-tier cloud architecture:
1. **Frontend**: Hosted on **Cloudflare Pages** (React 18 + Vite SPA built and served from Cloudflare's global edge CDN).
2. **Backend API**: Hosted on **Google Cloud Run** (Containerized FastAPI backend with automatic HTTPS, environment secrets, and scale-to-zero cost efficiency).
3. **Database, Auth & File Storage**: Hosted on **Supabase**:
   - **Database**: Managed PostgreSQL 16 + `pgvector` extension for vector embeddings.
   - **Authentication**: Supabase Auth (JWT token verification) for secure user sessions.
   - **File Storage**: Supabase Storage S3-compatible buckets (`photos`, `videos`, `books`, `documents`, `avatars`) with CDN caching.
4. **AI & LLM**: External Cloud LLM APIs (Google Gemini / OpenAI / Anthropic) for intelligent workout planning, daily coaching, and RAG.

**Alternatives considered:**
- **Local PC Docker Hosting**:
  - *Cons*: Requires maintaining a home server constantly powered on, dynamic DNS/port forwarding, network security risks, and no global edge CDN.
- **Single Monolithic VPS (e.g. AWS EC2 / DigitalOcean Droplet)**:
  - *Cons*: Requires manual OS patching, Docker maintenance, database backup management, and lacks auto-scaling/scale-to-zero.
- **Vercel + AWS RDS + AWS S3**:
  - *Cons*: Higher setup complexity across multiple separate cloud consoles and billing compared to Supabase + Cloud Run + Cloudflare.

**Rationale:**
- **Cloudflare Pages** delivers instant global static file loading with zero hosting cost for typical personal usage.
- **Google Cloud Run** provides seamless Docker container deployment with auto-scaling to zero when idle, keeping compute costs near zero while providing instant bursts of power when needed.
- **Supabase** consolidates PostgreSQL, `pgvector`, JWT Authentication, and S3-compatible object storage into a single unified platform with strong developer tooling.

**Consequences:**
- The codebase transitions from local filesystem paths to Supabase Storage client integration for media assets.
- Alembic database migrations target the cloud Supabase PostgreSQL connection string.
- The development flow supports an immediate **Phase 2A Cloud "Test & Experience"** milestone to test the Calendar heatmap and Pursuits live in the cloud before rolling out the AI Workout and Video Management modules.
