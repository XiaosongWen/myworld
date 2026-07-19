# Execution Plan for Issue #55: Label System

This plan outlines the steps to implement the cross-cutting Label System as described in `agents/design-doc/backend-02-label-system.md` and issue #55.

## 1. Alembic Migration
**Target:** `004_create_labels.py`
- Create `labels` table:
  - `id` (UUID PK), `user_id` (Integer FK → users), `name` (varchar 50), `color` (varchar 7), `description` (varchar 255 nullable), `created_at`, `updated_at`
  - Unique constraint on `(user_id, name)`
- Create `entity_labels` table:
  - `label_id` (UUID FK → labels ON DELETE CASCADE), `entity_type` (varchar 50), `entity_id` (UUID), `created_at`
  - Primary Key: `(label_id, entity_type, entity_id)`
  - Indexes: `(entity_type, entity_id)` and `(label_id, entity_type)`
- Check if migration `003` exists vs `002` for `down_revision`

## 2. SQLAlchemy Models (`models/label.py`)
- `Label` model matching the schema, with `User` FK
- `EntityLabel` model with composite PK

## 3. Pydantic Schemas (`schemas/label.py`)
- `LabelBase`: name (max 50), color (max 7), description (optional)
- `LabelCreate(LabelBase)`
- `LabelUpdate`: all fields optional
- `LabelResponse(LabelBase)`: id, user_id, created_at, updated_at
- `EntityLabelAttach`: entity_type, entity_id

## 4. Service Layer (`services/label_service.py`)
- CRUD: create, list, get, update, delete
- Attach/detach: attach_label, detach_label
- Users in `entity_type` validation

## 5. API Router (`routers/labels.py`)
- `POST /api/v1/labels` — Create
- `GET /api/v1/labels` — List
- `GET /api/v1/labels/{id}` — Detail
- `PUT /api/v1/labels/{id}` — Update
- `DELETE /api/v1/labels/{id}` — Delete
- `POST /api/v1/labels/{id}/attach` — Attach to entity
- `POST /api/v1/labels/{id}/detach` — Detach from entity
- All wrapped in `SingleResponse`/`ListResponse` envelopes

## 6. Integration
- Register router in `backend/main.py`
- Update `backend/models/__init__.py`
- Update `backend/routers/__init__.py`
- Update `backend/services/__init__.py`

## 7. Testing
- Unit tests for label service CRUD operations
- Tests for attach/detach logic

## Verification
1. `alembic upgrade head` — tables created
2. `python -m pytest tests/ -v` — all tests pass
3. OpenAPI docs at `/docs` show new `/api/v1/labels` endpoints
