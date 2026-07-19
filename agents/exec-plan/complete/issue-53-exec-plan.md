# Execution Plan for Issue #53: Pursuits Core Module Backend

This plan outlines the steps to implement the unified backend for Pursuits (Commitments, Commitment Links, and Records), as described in issue #53 and the `backend-01-commitments-and-records.md` design doc.

## 1. Alembic Migration
**Target:** Create a new migration script (e.g., `003_create_commitments_and_records.py`).
- Create `commitments` table:
  - Columns: `id` (UUID), `user_id` (Integer/UUID based on existing), `type` (Enum), `title` (String), `description` (Text), `status` (Enum), `priority` (Enum), `config` (JSONB), `due_date` (Date), `sort_order` (Integer), `created_at` (Timestamp), `updated_at` (Timestamp).
- Create `commitment_links` table:
  - Columns: `parent_id` (UUID), `child_id` (UUID), `sort_order` (Integer).
  - Primary Key: Composite (`parent_id`, `child_id`).
- Create `records` table:
  - Columns: `id` (UUID), `commitment_id` (UUID, nullable), `date` (Date), `content` (Text), `status` (Enum), `value` (Numeric), `sort_order` (Integer), `created_at` (Timestamp).
- Migrate data:
  - Move `habits` to `commitments` (`type='habit'`).
  - Move `habit_logs` to `records`.
  - Move `tasks` / `subtasks` to `commitments` (`type='task'`).
  - Move `projects` to `commitments` (`type='goal'`).
- Clean up: Drop old tables (`habits`, `habit_logs`, `projects`, `tasks`, `subtasks`, `tags`, `task_tags`).

## 2. SQLAlchemy Models
**Target:** Create SQLAlchemy model files in `models/`.
- `models/commitment.py`: `Commitment` model.
- `models/commitment_link.py`: `CommitmentLink` model.
- `models/record.py`: `Record` model.

## 3. Pydantic Schemas
**Target:** Create schema definitions in `schemas/`.
- `schemas/commitment.py`: Schemas for creating, updating, and reading commitments.
- `schemas/record.py`: Schemas for creating, updating, batch creating, and reading records.
- `schemas/daily.py`: Schema for the consolidated daily view (`GET /api/v1/pursuits/daily/:date`).

## 4. Services Layer
**Target:** Implement business logic in `services/`.
- `services/commitment_service.py`: CRUD operations and hierarchy traversal.
- `services/record_service.py`: CRUD, batch check-ins, and date-based filtering.
- `services/progress_service.py`: Auto-sub, record-based, and checklist progress logic, plus ported streak calculation.

## 5. API Router Endpoints
**Target:** Expose endpoints in `routers/pursuits.py`.
- `GET /api/v1/pursuits/commitments`: List commitments (with filters).
- `POST /api/v1/pursuits/commitments`: Create a commitment.
- `GET /api/v1/pursuits/commitments/{id}`: Get commitment details (including progress).
- `PUT /api/v1/pursuits/commitments/{id}`: Update a commitment.
- `PUT /api/v1/pursuits/commitments/reorder`: Batch reorder.
- `DELETE /api/v1/pursuits/commitments/{id}`: Delete a commitment.
- `GET /api/v1/pursuits/records`: List records (with filters).
- `POST /api/v1/pursuits/records`: Create a record.
- `POST /api/v1/pursuits/records/batch`: Batch create check-ins.
- `GET /api/v1/pursuits/records/{id}`: Get record details.
- `PUT /api/v1/pursuits/records/{id}`: Update a record.
- `PUT /api/v1/pursuits/records/reorder`: Batch reorder records.
- `DELETE /api/v1/pursuits/records/{id}`: Delete a record.
- `GET /api/v1/pursuits/daily/{date}`: Daily overview (habits, tasks, free-form records).

## 6. Testing
**Target:** Add pytest coverage.
- Tests for SQLAlchemy models and cascading deletes.
- Tests for services (CRUD and complex progress calculations).
- Integration tests for router endpoints.
