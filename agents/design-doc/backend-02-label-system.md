# Label System — Cross-Cutting Tagging

> **A unified labeling system** similar to GitHub's, allowing users to categorize, filter, and organize any entity across the MyWorld platform (commitments, records, knowledge notes, documents, media).

---

## 1. Motivation

In the previous schema migrations, legacy `tags` were deferred because tagging is a cross-cutting concern. A commitment, a daily record, a knowledge note, and a document might all belong to the same logical category (e.g., "Project X" or "Health").

Instead of building a separate tagging system for each module (e.g., `commitment_tags`, `note_tags`), we need a centralized **Label System**. This system will provide a GitHub-like experience (labels have names, colors, and descriptions) and can be attached to any entity via a polymorphic join table.

---

## 2. Core Tables

Two tables to manage the labels and their associations with various entities.

### 2.1 `labels` — The Label Definitions

| Field | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users (User who owns the label) |
| `name` | `varchar(50)` | e.g., "bug", "health", "urgent" |
| `color` | `varchar(7)` | Hex color code (e.g., "#ff0000") |
| `description` | `varchar(255)` | Optional short description |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Constraints:**
- Unique constraint on `(user_id, name)` — a user cannot have duplicate label names.

### 2.2 `entity_labels` — Polymorphic Join Table

Instead of `commitment_labels`, `record_labels`, etc., we use a single join table. Since all our primary keys are UUIDs, this approach is extremely clean and scalable.

| Field | Type | Description |
|---|---|---|
| `label_id` | UUID | PK, FK → labels |
| `entity_id` | UUID | PK (The UUID of the commitment, record, note, etc.) |
| `entity_type` | `varchar(50)` | e.g., 'commitment', 'record', 'note', 'document', 'photo' |
| `created_at` | `timestamptz` | When the label was attached |

**Indexes:**
- Primary Key: `(label_id, entity_type, entity_id)`
- Index on `(entity_type, entity_id)` to quickly find all labels for a given entity.
- Index on `(label_id, entity_type)` to quickly find all entities of a specific type that share a label.

---

## 3. API Design

### 3.1 Base URL

```
/api/v1/labels/
```

### 3.2 Label CRUD

```
POST   /api/v1/labels                  — Create a new label (name, color, description)
GET    /api/v1/labels                  — List all labels for the current user
GET    /api/v1/labels/:id              — Get label details
PUT    /api/v1/labels/:id              — Update label (name, color, description)
DELETE /api/v1/labels/:id              — Delete label (also cascades/deletes from entity_labels)
```

### 3.3 Attaching / Detaching Labels

While entities could manage labels through their own update endpoints, having generic attach/detach endpoints simplifies the API and frontend logic for bulk operations.

```
POST   /api/v1/labels/:id/attach       
Body: { "entity_type": "commitment", "entity_id": "uuid-here" }

POST   /api/v1/labels/:id/detach       
Body: { "entity_type": "commitment", "entity_id": "uuid-here" }
```

Alternatively, bulk update for an entity:
```
PUT    /api/v1/labels/entity
Body: { "entity_type": "commitment", "entity_id": "uuid-here", "label_ids": ["uuid-1", "uuid-2"] }
```

### 3.4 Filtering Entities by Label

To support cross-module filtering, each module's list endpoint will accept a `labels` query parameter (comma-separated UUIDs).

```
GET /api/v1/pursuits/commitments?labels=uuid1,uuid2
GET /api/v1/knowledge/notes?labels=uuid1
GET /api/v1/documents?labels=uuid1
```

For a global search (finding *everything* with a label):
```
GET /api/v1/labels/:id/entities
// Returns grouped entities, e.g.:
// {
//   "commitments": [...],
//   "notes": [...],
//   "documents": [...]
// }
```

---

## 4. Integration with Other Modules

- **SQLAlchemy Relationships:** In the SQLAlchemy models (`Commitment`, `Record`, `Note`), we can define a `labels` property using a `primaryjoin` condition that automatically filters by `entity_type` and joins through `entity_labels`.
- **Response Schemas:** All entity schemas (e.g., `CommitmentResponse`, `NoteResponse`) will include an optional `labels: List[LabelResponse]` field.
- **Frontend Components:** A shared `<LabelBadge />` and `<LabelPicker />` component will be created in the frontend to be reused across the Dashboard, Pursuits, Knowledge, and Document views.

---

## 5. Directory Structure Additions

```
backend/
├── routers/
│   └── labels.py                # API routes for Label CRUD and attachment
├── schemas/
│   └── label.py                 # Pydantic schemas (LabelCreate, LabelResponse, etc.)
├── services/
│   └── label_service.py         # Business logic for labels
└── models/
    └── label.py                 # SQLAlchemy models (Label, EntityLabel)
```

---

## 6. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Single polymorphic join table vs per-entity join tables | **Single table (`entity_labels`)** | Drastically reduces table sprawl. Since all IDs are UUIDs, collisions are virtually impossible. Makes it trivial to add tags to new modules without creating new DB tables. |
| Global Search Endpoint | **By Label ID** | Grouping cross-module entities by label allows users to see everything related to a single "Project" or "Area" in one view. |
| Label metadata | **Name, Color, Description** | Directly models the GitHub label experience, providing rich visual organization. |
| Cascade Deletion | **Yes** | If a label is deleted, its associations in `entity_labels` should be automatically cleared. |
