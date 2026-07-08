# Habit Tracker Module — Design Spec

> **Issue:** [#14](https://github.com/XiaosongWen/myworld/issues/14)
> **Parent Epic:** [#3 — Phase 2: Core Modules](https://github.com/XiaosongWen/myworld/issues/3)
> **Date:** 2026-06-29
> **Status:** Approved

---

## Overview

Build the Habit Tracker module — the first feature module in Phase 2. Users can create daily habits, check in each day (with optional notes and date backfilling), view streak statistics, and see their history on a GitHub-style contribution graph and monthly calendar.

---

## Architecture

**Approach B: Full Layered** — Router → Service → Model. All DB access goes through the service layer, matching the architecture prescribed in `CLAUDE.md`.

```
frontend/src/
├── api/habits.js          # API client for /api/v1/habits
├── stores/useHabitsStore.js  # Zustand store
└── views/Habits.jsx       # Main view (replaces placeholder)
    ├── HabitForm.jsx       # Create/edit habit form
    ├── HabitList.jsx       # List of habit cards
    ├── HabitCard.jsx       # Single habit with streak badge
    ├── CheckInModal.jsx    # Check-in modal (date + note)
    ├── CalendarHeatmap.jsx # GitHub-style contribution graph
    └── MonthCalendar.jsx   # Traditional monthly calendar

backend/
├── models/habit.py         # Habit + HabitLog SQLAlchemy models
├── schemas/habit.py        # Pydantic request/response schemas
├── routers/habit.py        # FastAPI router
├── services/               # NEW: service layer directory
│   ├── __init__.py
│   ├── habit_service.py    # Habit CRUD operations
│   ├── checkin_service.py  # Check-in logic
│   └── streak_service.py   # Streak calculation
└── tests/
    ├── test_habit_models.py
    ├── test_habit_schemas.py
    ├── test_habit_service.py
    ├── test_checkin_service.py
    ├── test_streak_service.py
    └── test_habit_router.py

frontend/src/__tests__/
    ├── habits.api.test.js
    ├── useHabitsStore.test.js
    ├── HabitCard.test.jsx
    ├── CheckInModal.test.jsx
    ├── CalendarHeatmap.test.jsx
    └── MonthCalendar.test.jsx
```

---

## Data Model

### `habits`

| Column | Type | Notes |
|---|---|---|
| `id` | `int` | PK, autoincrement |
| `user_id` | `int` | FK → users, indexed. Hardcoded to 1 for now. |
| `name` | `varchar(200)` | e.g., "Morning run" |
| `description` | `text` | nullable |
| `color` | `varchar(7)` | hex color, e.g., `#3B82F6` |
| `category` | `varchar(50)` | nullable, e.g., "Health", "Learning" |
| `frequency` | `varchar(20)` | `"daily"` for now; column exists for future weekly/custom |
| `is_archived` | `bool` | default `False` — soft delete, preserves check-in history |
| `created_at` | `datetime` | server default `now()` |
| `updated_at` | `datetime` | server default `now()`, auto-updated on change |

### `habit_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `int` | PK, autoincrement |
| `habit_id` | `int` | FK → habits, cascade delete |
| `user_id` | `int` | FK → users, indexed |
| `completed_at` | `date` | The date this check-in counts for (enables backfilling) |
| `note` | `text` | nullable |
| `is_archived` | `bool` | default `False` — soft delete |
| `created_at` | `datetime` | server default `now()` |

**Constraint:** `UNIQUE(habit_id, completed_at)` — max one check-in per habit per day.

---

## API Endpoints

All under `/api/v1/habits`. Single user (user_id=1).

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| `GET` | `/` | `?include_archived=false` | `Habit[]` | List habits |
| `POST` | `/` | `{name, description?, color, category?, frequency}` | `Habit` | Create habit |
| `GET` | `/{id}` | — | `Habit` | Get habit |
| `PATCH` | `/{id}` | partial fields | `Habit` | Update habit |
| `DELETE` | `/{id}` | — | `204` | Archive habit (soft) |
| `POST` | `/{id}/check-in` | `{date?, note?}` | `HabitLog` | Check in. Date defaults today. |
| `DELETE` | `/{id}/check-in/{log_id}` | — | `204` | Archive check-in (soft) |
| `GET` | `/{id}/check-ins` | `?from=&to=` | `HabitLog[]` | Check-ins in range |
| `GET` | `/{id}/streaks` | — | `StreakResult` | Current + longest streak |
| `GET` | `/heatmap` | `?from=&to=` | `{date: count}[]` | Aggregated counts for heatmap |

### Key Pydantic Schemas

```python
class HabitCreate(BaseModel):
    name: str
    description: str | None = None
    color: str  # hex
    category: str | None = None
    frequency: str = "daily"

class HabitUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    category: str | None = None
    frequency: str | None = None

class HabitRead(BaseModel):
    id: int; user_id: int; name: str; description: str | None
    color: str; category: str | None; frequency: str
    is_archived: bool; created_at: datetime; updated_at: datetime

class CheckInCreate(BaseModel):
    date: date | None = None  # defaults to today
    note: str | None = None

class HabitLogRead(BaseModel):
    id: int; habit_id: int; user_id: int
    completed_at: date; note: str | None
    is_archived: bool; created_at: datetime

class StreakResult(BaseModel):
    habit_id: int
    current_streak: int
    longest_streak: int
    total_check_ins: int

class HeatmapEntry(BaseModel):
    date: date
    count: int
```

---

## Service Layer

### `HabitService`
- `list_habits(db, user_id, include_archived=False) → list[Habit]`
- `get_habit(db, habit_id, user_id) → Habit` (raises 404 if not found)
- `create_habit(db, user_id, data: HabitCreate) → Habit`
- `update_habit(db, habit_id, user_id, data: HabitUpdate) → Habit`
- `archive_habit(db, habit_id, user_id) → None`

### `CheckInService`
- `check_in(db, habit_id, user_id, date, note) → HabitLog` (raises 409 if duplicate date)
- `archive_check_in(db, log_id, habit_id, user_id) → None`
- `get_check_ins(db, habit_id, user_id, from_date, to_date) → list[HabitLog]`
- `get_heatmap_data(db, user_id, from_date, to_date) → list[HeatmapEntry]`

### `StreakService`
- `get_streaks(db, habit_id, user_id) → StreakResult`

**Streak algorithm (daily habits):**
1. Query all non-archived check-in dates for habit, ordered DESC
2. Walk from today backward: current streak = consecutive days with a check-in (stops at first missing day before today)
3. Longest streak = max consecutive run across all dates
4. `total_check_ins` = count of all check-ins

Single DB query, Python iteration. Fast for single-user scale (~365 rows/year/habit).

---

## Frontend Components

### State Management
- **Zustand** installed as new dependency (resolves technical debt #2)
- `useHabitsStore`: habits list, heatmap data, loading/error states, actions (fetch, create, update, archive, checkIn)

### `Habits.jsx` (View)
- Fetches habits + heatmap data on mount
- Renders `CalendarHeatmap` (year overview at top), then `HabitList` with `HabitForm` for creating new habits
- Below the heatmap: `HabitList` of `HabitCard` components

### `HabitForm.jsx`
- Inline or slide-out panel for creating/editing habits
- Fields: name, color picker (preset colors), category dropdown, description

### `HabitCard.jsx`
- Displays habit name, color indicator, category badge
- `StreakBadge` showing current streak count + flame icon
- `CheckInButton` — opens `CheckInModal` for today
- Click to expand → shows recent check-ins, edit button, archive button

### `CheckInModal.jsx`
- Modal with: DatePicker (default today), NoteField, Confirm/Cancel
- Also openable from `CalendarHeatmap` or `MonthCalendar` by clicking a day

### `CalendarHeatmap.jsx` (GitHub-style)
- 52-week grid (past ~year), each cell = one day
- Color intensity by check-in count (0 = empty, 1 = light, 2+ = darker)
- Click a cell → expand to see habits checked in that day
- Rendered with CSS Grid, no chart library

### `MonthCalendar.jsx`
- Traditional month grid, navigable by ← month → arrows
- Days with check-ins get colored dots (habit colors)
- Click a day → opens `CheckInModal` for that date

---

## Testing Strategy

### Backend (pytest + async)
- **Model tests:** Table name, column constraints, defaults
- **Schema tests:** Validation, defaults, invalid inputs
- **Service tests:** Mock DB session, test CRUD logic, streak algorithm correctness (edge cases: no check-ins, single check-in, gap in streak, backfill)
- **Router tests:** Mock service layer, test HTTP response codes, request validation

### Frontend (vitest + @testing-library/react)
- **API module:** mock Axios, verify correct endpoints called
- **Store:** test state transitions on actions
- **Components:** render with test store, verify UI states (loading, empty, populated, error)

---

## Success Criteria (from issue)

- [x] Can create/edit/delete habits via API
- [x] Can check in to a habit
- [x] Calendar heatmap shows check-in history

---

## Out of Scope

- Weekly/custom frequency habits (daily only; `frequency` column exists for later)
- Multi-user (hardcoded to user_id=1)
- Push notification reminders (Phase 3)
- Habit streaks with "recovery" logic
- Mobile (Phase 3)
