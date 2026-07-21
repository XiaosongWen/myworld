# Future Backlog & Technical Debt

This document tracks identified issues, feature requests, and technical debt items planned for future implementation.

---

## 📌 Feature Requests & UX Enhancements

### 1. Weather API Integration for Dashboard (Issue #61)
- **Status**: Deferred to Phase 2 (Tracked in GitHub Issue [#61](https://github.com/XiaosongWen/myworld/issues/61))
- **Description**: Connect `WeatherStrip` in `frontend/src/views/DailyLog.jsx` to a real-time Weather API (e.g. Open-Meteo or WeatherAPI) based on user location/timezone.

### 2. Custom Color Selection for Labels
- **Status**: Backlog
- **Description**: Add a color palette selector modal/dropdown to `LabelPicker.jsx` allowing users to manually pick custom hex colors when creating or updating labels.

### 3. Commitment Detail Side Panel
- **Status**: Backlog
- **Description**: Fully integrate `CommitmentDetail.jsx` side panel so clicking commitment cards opens a detailed drawer displaying sub-commitments, linked items, and historical check-in records (`Timeline`).

### 4. Interactive Mini Heatmap Drilldown
- **Status**: Backlog
- **Description**: Make individual date cells in `InlineCalendar.jsx` clickable to open/filter daily records for historical dates.

### 5. Hierarchical Sub-Goal & Sub-Task Tree View
- **Status**: Backlog
- **Description**: Support nested sub-commitments linked via `parent_id` in `commitment_links`, allowing expandable goal trees in the Pursuits tab.

---

## 🛠️ Technical Debt & Backend Enhancements

### 1. Label Attachment API Integration
- **Status**: Backlog
- **Description**: Utilize `POST /api/v1/labels/{id}/attach` and `/detach` endpoints to explicitly link labels in `entity_labels` table rather than storing tag names inside JSON `config.tags`.

### 2. Timezone Configuration Service
- **Status**: Backlog
- **Description**: Replace hardcoded timezone string (`"Chicago"`) on `DailyLog.jsx` header with dynamic user setting fetched from `GET /api/v1/users/me`.
