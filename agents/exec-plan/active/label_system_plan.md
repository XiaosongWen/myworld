# Label System Implementation Plan

## What will be built and why
We will implement the cross-cutting **Label System** defined in `agents/design-doc/backend-02-label-system.md`. This provides a GitHub-like labeling experience (names, colors, descriptions) that can be attached to any entity in the platform (commitments, records, knowledge, documents) using a single polymorphic join table. This avoids creating repetitive mapping tables for every new module.

## Files that will be created or modified
- `backend/models/label.py` (new): SQLAlchemy models for `Label` and `EntityLabel`.
- `backend/schemas/label.py` (new): Pydantic schemas for request/response validation.
- `backend/services/label_service.py` (new): Business logic for CRUD operations and attaching/detaching labels.
- `backend/routers/labels.py` (new): API endpoints.
- `backend/main.py`: Include the new `labels` router.
- Alembic migration scripts: To create the `labels` and `entity_labels` tables.

## Implementation Details

### 1. Database Schema & Migration
Generate an alembic revision to create two tables:
- **`labels`**:
  - `id`: UUID (Primary Key)
  - `user_id`: UUID (Foreign Key to users)
  - `name`: String(50)
  - `color`: String(7)
  - `description`: String(255) (Nullable)
  - `created_at`, `updated_at`: DateTime
  - *Constraint*: Unique constraint on `(user_id, name)`

- **`entity_labels`**:
  - `label_id`: UUID (Foreign Key to labels, ON DELETE CASCADE)
  - `entity_type`: String(50)
  - `entity_id`: UUID
  - `created_at`: DateTime
  - *Constraint*: Primary Key is `(label_id, entity_type, entity_id)`
  - *Indexes*: `(entity_type, entity_id)` and `(label_id, entity_type)`

### 2. SQLAlchemy Models
Create `backend/models/label.py` with `Label` and `EntityLabel` matching the schema above. Use `Mapped` and `mapped_column` syntax from SQLAlchemy 2.0.

### 3. Pydantic Schemas
Create `backend/schemas/label.py`:
- `LabelBase`: name, color, description
- `LabelCreate`: Inherits LabelBase
- `LabelUpdate`: Inherits LabelBase, fields optional
- `LabelResponse`: Inherits LabelBase + id, user_id, created_at, updated_at
- `EntityLabelAttach`: entity_type, entity_id

### 4. Service Layer
Create `backend/services/label_service.py`:
- `create_label(db, user_id, label_in)`
- `get_labels(db, user_id)`
- `update_label(db, user_id, label_id, label_in)`
- `delete_label(db, user_id, label_id)`
- `attach_label(db, user_id, label_id, entity_type, entity_id)`
- `detach_label(db, user_id, label_id, entity_type, entity_id)`

### 5. API Routes
Create `backend/routers/labels.py`:
- `POST /api/v1/labels`
- `GET /api/v1/labels`
- `GET /api/v1/labels/{id}`
- `PUT /api/v1/labels/{id}`
- `DELETE /api/v1/labels/{id}`
- `POST /api/v1/labels/{id}/attach`
- `POST /api/v1/labels/{id}/detach`

Add router to `backend/main.py`.

## Verification steps
1. Run `alembic revision --autogenerate -m "add_label_system"` and `alembic upgrade head`. Check that tables are created successfully.
2. Start the API using `uvicorn main:app --reload`.
3. Use cURL or Swagger UI (`/docs`) to test creating a label.
4. Test attaching the label to a mock entity UUID and type.
5. Verify that violating the unique constraint (same name for same user) returns an appropriate 400 error.
6. Verify that deleting a label automatically cascades and deletes the `entity_labels` entries.
