# Execution Plan: GitHub Actions CI Pipeline Setup

## Overview
Set up a continuous integration (CI) pipeline using GitHub Actions to automatically run test suites, lint checks, and build validations whenever a Pull Request (PR) is opened or updated targeting the `master`/`main` branch.

Issue Reference: [#51 - Set up GitHub Actions CI pipeline to auto-run tests on PRs](https://github.com/XiaosongWen/myworld/issues/51)
Parent Epic: [#50 - [Epic] General Infrastructure Setup & Enhancements](https://github.com/XiaosongWen/myworld/issues/50)

## Proposed Changes

### 1. Workflow File Creation
Create `.github/workflows/ci.yml` with two primary parallel/sequential jobs:
- `backend-tests`: Backend Python 3.12 validation & pytest suite
- `frontend-tests`: Web React/Vite Vitest suite & build verification

### 2. Job Specifications

#### `backend-tests` Job:
- **Runner Environment**: `ubuntu-latest`
- **Services Containers**:
  - `postgres` (image `pgvector/pgvector:pg16` with environment variables for database name `myworld_test`, user `myworld`, password `myworld_pass`). Health checks configured with `pg_isready`.
  - `redis` (image `redis:7-alpine`). Health check configured with `redis-cli ping`.
- **Steps**:
  1. Checkout repository (`actions/checkout@v4`)
  2. Setup Python 3.12 (`actions/setup-python@v5`) with pip cache
  3. Install dependencies from `backend/requirements.txt`
  4. Run Alembic database migrations (`alembic upgrade head`) with test DB env variables
  5. Execute `pytest` suite in `backend/`

#### `frontend-tests` Job:
- **Runner Environment**: `ubuntu-latest`
- **Steps**:
  1. Checkout repository (`actions/checkout@v4`)
  2. Setup Node.js 20 (`actions/setup-node@v4`) with npm cache
  3. Install frontend dependencies (`npm ci` or `npm install` in `frontend/`)
  4. Run `npm test` (`vitest run`) in `frontend/`
  5. Run `npm run build` (`vite build`) to verify production bundle build integrity

## Files to Create/Modify
- `.github/workflows/ci.yml` (New)

## Verification Plan

### Local Verification
1. Validate workflow YAML syntax using `actionlint` or standard YAML validation.
2. Verify local pytest suite passes (`cd backend && pytest`).
3. Verify local frontend test and build pass (`cd frontend && npm test && npm run build`).

### Remote / GitHub Verification
1. Push branch `feat/ci-pipeline-github-actions` to GitHub.
2. Open a Pull Request targeting `master`.
3. Verify GitHub Actions triggers automatically on the PR and both `backend-tests` and `frontend-tests` jobs pass successfully.
