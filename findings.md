# Findings & Technical Research: Issue #56

## System Architecture Overview

### API Envelope Shape
All API responses from `/api/v1/*` endpoints are wrapped in standard single/list JSON envelopes:
- Single object: `{ msg: "success", request_id: "...", data: { ... } }`
- List of objects: `{ msg: "success", request_id: "...", data: [ ... ], pagination: { page, page_size, total_rows } }`

### Pursuits API Endpoints (`/api/v1/pursuits/*`)
- `GET /commitments` (Query params: `status`, `type`) -> Returns active commitments + progress metrics.
- `POST /commitments` -> Creates commitment.
- `GET /commitments/{id}` -> Returns single commitment.
- `PUT /commitments/{id}` -> Updates commitment fields & config.
- `DELETE /commitments/{id}` -> Archives/soft deletes commitment.
- `POST /records` -> Creates a record (`{ commitment_id, date, status, value, notes }`).
- `DELETE /records/{record_id}` -> Deletes a record.
- `GET /daily/{target_date}` -> Returns `{ date, habits: [{ commitment, today_record }], tasks, free_records }`.
- `GET /heatmap` -> Returns `{ date: "YYYY-MM-DD", count: N }`.

### Label System API Endpoints (`/api/v1/labels/*`)
- `GET /labels` -> List all labels for user.
- `POST /labels` -> Create label `{ name, color, description }`.
- `PUT /labels/{id}` -> Update label.
- `DELETE /labels/{id}` -> Delete label.

---

## Identified Binding Gaps

1. **`CommitmentDetail.jsx`**:
   - Needs `onClose` and `commitmentId` props wired in `Commitments.jsx` and `DailyLog.jsx`.
   - Needs real record fetching from `pursuitsStore.fetchRecords({ commitment_id })`.
   - Needs `onEdit` trigger to open `CreateCommitmentModal` pre-populated.
   - Needs Archive action calling `deleteCommitment(id)`.

2. **Search Filter in `Commitments.jsx`**:
   - Search text input is currently un-wired to state. Needs filtering by `title` and `tags`.
