# Task Plan: Issue #56 — Integrate UI with API & Add Integration Tests

## Goal
Fully integrate the unified Pursuits and Dashboard frontend components with all backend REST API endpoints (`/pursuits/commitments`, `/pursuits/records`, `/pursuits/daily`, `/labels`). Verify end-to-end data flow with comprehensive Vitest integration tests and Pytest API tests.

---

## Phases

### Phase 1: Audit & Gap Analysis of UI-API Data Bindings
- [x] Audit `CommitmentDetail.jsx` side panel data bindings (fetch commitment, links/sub-commitments, and historical timeline records)
- [x] Audit `DailyLog.jsx` (Dashboard) data bindings (Daily overview API, habits check-ins, tasks toggle, free records, heatmap)
- [x] Audit `Commitments.jsx` (Pursuits) data bindings (Commitments list/grid, search filter, habits check-ins, dynamic label colors)
- [x] Audit `CreateCommitmentModal.jsx` and `LabelPicker.jsx` data bindings (Commitment CRUD, Label CRUD)

### Phase 2: Implementation of UI-API Wireup Gaps
- [x] Wire `CommitmentDetail.jsx` side panel to real backend endpoints (`fetchRecords({ commitment_id })`, `fetchCommitmentLinks`, edit/archive triggers)
- [x] Ensure all search/filter controls in `Commitments.jsx` filter real store commitments dynamically
- [x] Verify error handling and loading indicators across all views

### Phase 3: Integration & E2E Testing
- [x] Create `frontend/src/__tests__/integration.pursuits.test.jsx` covering complete E2E user workflows (create habit -> check-in -> heatmap update -> streak update -> edit -> delete)
- [x] Create `frontend/src/__tests__/integration.labels.test.jsx` covering label creation, color assignment, and commitment tagging
- [x] Ensure all Vitest unit & integration tests pass (`npm run test`)
- [x] Ensure all Pytest backend tests pass (`pytest`)
- [x] Validate production build (`npm run build`)

### Phase 4: Final Review & Commit
- [x] Verify zero visual/data regressions
- [x] Commit changes and push branch to GitHub

---

## Key Files
- `frontend/src/views/Commitments.jsx`
- `frontend/src/views/DailyLog.jsx`
- `frontend/src/views/CommitmentDetail.jsx`
- `frontend/src/components/pursuits/CreateCommitmentModal.jsx`
- `frontend/src/components/pursuits/LabelPicker.jsx`
- `frontend/src/stores/pursuitsStore.js`
- `frontend/src/api/pursuits.js`
- `frontend/src/api/labels.js`
- `backend/routers/pursuits.py`
- `backend/routers/labels.py`

---

## Errors & Resolution Log
| Error | Phase | Attempt | Resolution |
|-------|-------|---------|------------|
| (None) | - | - | - |
