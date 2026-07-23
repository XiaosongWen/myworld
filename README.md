# MyWorld 🌍

MyWorld is a personal life operating system and workspace application that unifies commitments/pursuits tracking, habits, labels, weather forecast strips, and activity dashboards into a clean interface.

---

## 🚀 Features

- **Unified Life Operating System**: Manage daily logs, long-term pursuits, habits, and commitments.
- **Weather & Location Awareness**: Real-time forecast strips and location search.
- **Label System**: Flexible tags and organization across modules.
- **Multi-Environment Support**: Clean separation between `dev`, `staging`, and `prod` configurations.
- **Modular Docker Infrastructure**: Infrastructure services (`postgres`, `redis`) extracted into `docker-compose.infra.yml`, decoupled from application services (`docker-compose.stage.yml`, `docker-compose.prod.yml`).
- **Unified Single-Image Deployment**: Bundling React + Vite frontend and FastAPI backend into a single lightweight multi-stage Docker container.
- **Automated CI/CD**: Automated testing via GitHub Actions and automated Docker image publication to Docker Hub upon release.

---

## 🛠️ Deployment & How to Run

MyWorld can be run locally for development or deployed to staging/production environments using Docker Compose.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

---

### 1. Local Development Stack (`docker-compose.dev.yml`)

In development, PostgreSQL and Redis run inside Docker containers while the FastAPI backend and React Vite frontend run on your host system.

```bash
# Start PostgreSQL (port 5432) and Redis (port 6379)
docker compose -f docker-compose.dev.yml up -d

# Start Backend (in backend/ directory)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload

# Start Frontend (in frontend/ directory)
cd frontend
npm install
npm run dev
```

Visit the app at `http://localhost:5173`.

---

### 2. Building & Pushing the Unified Docker Image Locally

You can bundle both the frontend build assets and the backend API into a single image using the build script:

```bash
# Build locally without pushing
./scripts/build-docker.sh myworld latest

# Build locally and push to Docker Hub
./scripts/build-docker.sh username/myworld latest --push
```

Or directly via Docker:

```bash
docker build -t myworld:latest .
```

---

### 3. Infrastructure & Modular Compose Files

The infrastructure services (`postgres` and `redis`) are separated in `docker-compose.infra.yml`, while application containers reside in `docker-compose.stage.yml` and `docker-compose.prod.yml`. You can compose them together or run them separately.

#### Environment Parameterization
You can customize configuration options using environment variables (or a `.env` file):

| Variable | Description | Default |
| --- | --- | --- |
| `POSTGRES_USER` | PostgreSQL Username | `myworld` |
| `POSTGRES_PASSWORD` | PostgreSQL Password | `myworld` |
| `POSTGRES_DB` | PostgreSQL Database Name | `myworld` |
| `POSTGRES_PORT` | PostgreSQL Host Port | `5432` |
| `REDIS_PORT` | Redis Host Port | `6379` |
| `APP_PORT` | App Host Port | `8000` (prod), `8001` (stage) |
| `CPU_LIMIT` | App CPU limit (prod) | `2.0` |
| `MEMORY_LIMIT` | App Memory limit (prod) | `2048M` |

---

### 4. Running Staging Environment (`docker-compose.infra.yml` + `docker-compose.stage.yml`)

To start the staging infrastructure and application together:

```bash
# Start infrastructure + staging app
POSTGRES_PORT=5433 REDIS_PORT=6380 POSTGRES_DATA_DIR=./data/stage/postgres REDIS_DATA_DIR=./data/stage/redis \
docker compose -f docker-compose.infra.yml -f docker-compose.stage.yml up -d --build
```

Access the staging app at `http://localhost:8001`.

---

### 5. Running Production Environment (`docker-compose.infra.yml` + `docker-compose.prod.yml`)

To start the production infrastructure and application together:

```bash
# Start infrastructure + production app
POSTGRES_DATA_DIR=./data/prod/postgres REDIS_DATA_DIR=./data/prod/redis \
docker compose -f docker-compose.infra.yml -f docker-compose.prod.yml up -d --build
```

Access the production app at `http://localhost:8000`.

---

## 📦 Automated Release & Docker Hub Publication

When a GitHub Release is published, the GitHub Actions workflow (`.github/workflows/docker-release.yml`) automatically builds the multi-stage Docker image and pushes it to Docker Hub under `${DOCKERHUB_USERNAME}/myworld:latest` and tagged release versions (e.g. `v1.0.0`).
