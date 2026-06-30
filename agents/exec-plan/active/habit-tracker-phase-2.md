# Habit Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional Habit Tracker module with daily check-ins, streak tracking, and calendar heatmap visualization.

**Architecture:** Full layered backend (Router → Service → Model) per CLAUDE.md conventions. Zustand store for frontend state. Soft-delete (is_archived) on all records. Streaks computed on read from habit_logs.

**Tech Stack:** Python 3.12 + FastAPI + SQLAlchemy 2.0 async, React 18 + Zustand + CSS Grid (no chart library).

## Global Constraints

- All DB queries are async via SQLAlchemy 2.0 async sessions
- Single user (user_id=1) hardcoded — no auth
- Soft delete via `is_archived` flag, never hard delete
- All backend tests mock the DB session (no real PG)
- Backend tests: pytest + pytest-asyncio + httpx AsyncClient
- Frontend tests: vitest + @testing-library/react
- Frontend API client at `src/api/client.js`, base URL `/api/v1`
- Color codes: hex strings e.g. `#3B82F6`
- Frequency: `"daily"` only for now; column present for future expansion

---

### Task 1: Migrations — habits + habit_logs tables

**Files:**
- Create: `backend/alembic/versions/002_create_habits.py`

**Interfaces:**
- Consumes: existing `Base` metadata from `database.py`, existing `001_create_users.py` migration
- Produces: `habits` and `habit_logs` tables with FK constraints

- [ ] **Step 1: Write migration**

```python
"""create habits and habit_logs tables

Revision ID: 002
Revises: 001
Create Date: 2026-06-29
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "habits",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(7), nullable=False),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("frequency", sa.String(20), nullable=False, server_default="daily"),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_habits_user_id"),
    )
    op.create_index(op.f("ix_habits_user_id"), "habits", ["user_id"])

    op.create_table(
        "habit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("habit_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.Date(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["habit_id"], ["habits.id"], name="fk_habit_logs_habit_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_habit_logs_user_id"),
        sa.UniqueConstraint("habit_id", "completed_at", name="uq_habit_logs_habit_date"),
    )
    op.create_index(op.f("ix_habit_logs_user_id"), "habit_logs", ["user_id"])


def downgrade():
    op.drop_table("habit_logs")
    op.drop_table("habits")
```

- [ ] **Step 2: Register models in env.py for auto-detection**

Edit `backend/models/__init__.py`:
```python
from models.user import User
from models.habit import Habit  # noqa: F401 — will exist after Task 2

__all__ = ["User", "Habit"]
```

Also update `backend/alembic/env.py` import line:
```python
from models import User, Habit  # noqa: F401 — ensure models are registered
```

- [ ] **Step 3: Commit**

```bash
git add backend/alembic/versions/002_create_habits.py backend/models/__init__.py backend/alembic/env.py
git commit -m "feat: add habits and habit_logs migration"
```

---

### Task 2: SQLAlchemy Models

**Files:**
- Create: `backend/models/habit.py`

**Interfaces:**
- Consumes: `Base` from `database.py`
- Produces: `Habit`, `HabitLog` ORM classes used by services

- [ ] **Step 1: Write model tests**

Create `backend/tests/test_habit_models.py`:
```python
"""Tests for the Habit and HabitLog SQLAlchemy models."""

from datetime import date

from models.habit import Habit, HabitLog


class TestHabitModel:
    def test_create_habit_with_required_fields(self):
        habit = Habit(id=1, user_id=1, name="Morning run", color="#3B82F6")
        assert habit.id == 1
        assert habit.user_id == 1
        assert habit.name == "Morning run"
        assert habit.color == "#3B82F6"
        assert habit.frequency == "daily"  # default
        assert habit.is_archived is False  # default
        assert habit.category is None

    def test_create_habit_with_all_fields(self):
        habit = Habit(
            id=2, user_id=1, name="Read", description="Read 30 min",
            color="#10B981", category="Learning", frequency="daily",
        )
        assert habit.description == "Read 30 min"
        assert habit.category == "Learning"

    def test_table_name(self):
        assert Habit.__tablename__ == "habits"


class TestHabitLogModel:
    def test_create_habit_log(self):
        log = HabitLog(id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 1))
        assert log.completed_at == date(2026, 6, 1)
        assert log.is_archived is False
        assert log.note is None

    def test_habit_log_with_note(self):
        log = HabitLog(id=2, habit_id=1, user_id=1, completed_at=date(2026, 6, 1), note="Felt great")
        assert log.note == "Felt great"

    def test_table_name(self):
        assert HabitLog.__tablename__ == "habit_logs"
```

- [ ] **Step 2: Run model tests to verify they fail**

```bash
cd backend && python -m pytest tests/test_habit_models.py -v 2>&1 || true
```
Expected: ModuleNotFoundError (habit.py doesn't exist yet)

- [ ] **Step 3: Write Habit + HabitLog models**

Create `backend/models/habit.py`:
```python
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(7), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    frequency: Mapped[str] = mapped_column(String(20), nullable=False, default="daily")
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    logs: Mapped[list["HabitLog"]] = relationship(back_populates="habit")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habit_id: Mapped[int] = mapped_column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    completed_at: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    habit: Mapped["Habit"] = relationship(back_populates="logs")
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && python -m pytest tests/test_habit_models.py -v
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/models/habit.py backend/tests/test_habit_models.py
git commit -m "feat: add Habit and HabitLog models"
```

---

### Task 3: Pydantic Schemas

**Files:**
- Create: `backend/schemas/habit.py`

**Interfaces:**
- Produces: `HabitCreate`, `HabitUpdate`, `HabitRead`, `CheckInCreate`, `HabitLogRead`, `StreakResult`, `HeatmapEntry` — used by router as request/response types

- [ ] **Step 1: Write schema tests**

Create `backend/tests/test_habit_schemas.py`:
```python
"""Tests for habit Pydantic schemas."""

from datetime import date, datetime, timezone

import pytest
from pydantic import ValidationError

from schemas.habit import (
    HabitCreate, HabitLogRead, HabitRead, HabitUpdate,
    HeatmapEntry, StreakResult,
)


class TestHabitCreate:
    def test_valid_habit_create(self):
        data = HabitCreate(name="Morning run", color="#3B82F6")
        assert data.name == "Morning run"
        assert data.color == "#3B82F6"
        assert data.frequency == "daily"
        assert data.description is None
        assert data.category is None

    def test_missing_name_raises_error(self):
        with pytest.raises(ValidationError):
            HabitCreate(color="#3B82F6")

    def test_missing_color_raises_error(self):
        with pytest.raises(ValidationError):
            HabitCreate(name="Morning run")

    def test_with_all_fields(self):
        data = HabitCreate(
            name="Read", description="Read 30 min",
            color="#10B981", category="Learning",
        )
        assert data.description == "Read 30 min"
        assert data.category == "Learning"


class TestHabitUpdate:
    def test_all_fields_optional(self):
        data = HabitUpdate()
        assert data.name is None
        assert data.color is None

    def test_partial_update(self):
        data = HabitUpdate(name="New name")
        assert data.name == "New name"
        assert data.color is None


class TestHabitRead:
    def test_from_attributes(self):
        now = datetime.now(timezone.utc)
        data = HabitRead.model_validate({
            "id": 1, "user_id": 1, "name": "Run", "description": None,
            "color": "#3B82F6", "category": "Health", "frequency": "daily",
            "is_archived": False, "created_at": now, "updated_at": now,
        })
        assert data.id == 1
        assert data.name == "Run"
        assert data.model_config.get("from_attributes") is True


class TestHabitLogRead:
    def test_from_attributes(self):
        now = datetime.now(timezone.utc)
        data = HabitLogRead.model_validate({
            "id": 1, "habit_id": 1, "user_id": 1,
            "completed_at": date(2026, 6, 1), "note": "Felt great",
            "is_archived": False, "created_at": now,
        })
        assert data.completed_at == date(2026, 6, 1)
        assert data.note == "Felt great"


class TestStreakResult:
    def test_streak_result_values(self):
        s = StreakResult(habit_id=1, current_streak=5, longest_streak=10, total_check_ins=30)
        assert s.current_streak == 5
        assert s.longest_streak == 10


class TestHeatmapEntry:
    def test_heatmap_entry(self):
        e = HeatmapEntry(date=date(2026, 6, 1), count=3)
        assert e.count == 3
```

- [ ] **Step 2: Run schema tests to verify they fail**

```bash
cd backend && python -m pytest tests/test_habit_schemas.py -v 2>&1 || true
```
Expected: ModuleNotFoundError (schemas/habit.py doesn't exist yet)

- [ ] **Step 3: Write schemas**

Create `backend/schemas/habit.py`:
```python
from datetime import date, datetime

from pydantic import BaseModel


class HabitCreate(BaseModel):
    name: str
    description: str | None = None
    color: str
    category: str | None = None
    frequency: str = "daily"


class HabitUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    category: str | None = None
    frequency: str | None = None


class HabitRead(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    color: str
    category: str | None
    frequency: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CheckInCreate(BaseModel):
    date: date | None = None
    note: str | None = None


class HabitLogRead(BaseModel):
    id: int
    habit_id: int
    user_id: int
    completed_at: date
    note: str | None
    is_archived: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StreakResult(BaseModel):
    habit_id: int
    current_streak: int
    longest_streak: int
    total_check_ins: int


class HeatmapEntry(BaseModel):
    date: date
    count: int
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && python -m pytest tests/test_habit_schemas.py -v
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/schemas/habit.py backend/tests/test_habit_schemas.py
git commit -m "feat: add habit Pydantic schemas"
```

---

### Task 4: Service Layer — HabitService + CheckInService + StreakService

**Files:**
- Create: `backend/services/__init__.py`
- Create: `backend/services/habit_service.py`
- Create: `backend/services/checkin_service.py`
- Create: `backend/services/streak_service.py`

**Interfaces:**
- Consumes: `Habit`, `HabitLog` models, `HabitCreate`, `HabitUpdate`, `CheckInCreate`, `StreakResult`, `HeatmapEntry` schemas
- Produces: `HabitService`, `CheckInService`, `StreakService` — consumed by router

- [ ] **Step 1: Create services directory**

```bash
mkdir -p backend/services
touch backend/services/__init__.py
```

- [ ] **Step 2: Write HabitService tests**

Create `backend/tests/test_habit_service.py`:
```python
"""Tests for HabitService."""

from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import Habit
from schemas.habit import HabitCreate, HabitUpdate
from services.habit_service import HabitService


@pytest.fixture
def db_session():
    return AsyncMock(spec=AsyncSession)


@pytest.mark.asyncio
async def test_list_habits_excludes_archived(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [
        Habit(id=1, user_id=1, name="Run", color="#3B82F6"),
    ]
    db_session.execute = AsyncMock(return_value=mock_result)

    habits = await HabitService.list_habits(db_session, user_id=1)

    assert len(habits) == 1
    assert habits[0].name == "Run"
    # Verify query filters is_archived=False
    call_query = db_session.execute.call_args[0][0]
    assert "is_archived" in str(call_query)


@pytest.mark.asyncio
async def test_list_habits_includes_archived(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db_session.execute = AsyncMock(return_value=mock_result)

    habits = await HabitService.list_habits(db_session, user_id=1, include_archived=True)
    assert habits == []
    call_query = db_session.execute.call_args[0][0]
    # Should NOT filter by is_archived when include_archived is True
    assert "is_archived" not in str(call_query)


@pytest.mark.asyncio
async def test_get_habit_returns_habit(db_session):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = Habit(id=1, user_id=1, name="Run", color="#3B82F6")
    db_session.execute = AsyncMock(return_value=mock_result)

    habit = await HabitService.get_habit(db_session, habit_id=1, user_id=1)
    assert habit is not None
    assert habit.name == "Run"


@pytest.mark.asyncio
async def test_get_habit_not_found(db_session):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db_session.execute = AsyncMock(return_value=mock_result)

    habit = await HabitService.get_habit(db_session, habit_id=999, user_id=1)
    assert habit is None


@pytest.mark.asyncio
async def test_create_habit(db_session):
    data = HabitCreate(name="Run", color="#3B82F6", category="Health")
    db_session.add = AsyncMock()
    db_session.commit = AsyncMock()
    db_session.refresh = AsyncMock()

    habit = await HabitService.create_habit(db_session, user_id=1, data=data)

    assert habit.name == "Run"
    assert habit.color == "#3B82F6"
    assert habit.user_id == 1
    db_session.add.assert_awaited_once()
    db_session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_habit(db_session):
    existing = Habit(id=1, user_id=1, name="Run", color="#3B82F6")
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    db_session.execute = AsyncMock(return_value=mock_result)
    db_session.commit = AsyncMock()
    db_session.refresh = AsyncMock()

    updated = await HabitService.update_habit(
        db_session, habit_id=1, user_id=1, data=HabitUpdate(name="Morning run"),
    )

    assert updated.name == "Morning run"
    assert updated.color == "#3B82F6"  # unchanged
    db_session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_archive_habit(db_session):
    existing = Habit(id=1, user_id=1, name="Run", color="#3B82F6", is_archived=False)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    db_session.execute = AsyncMock(return_value=mock_result)
    db_session.commit = AsyncMock()

    await HabitService.archive_habit(db_session, habit_id=1, user_id=1)

    assert existing.is_archived is True
    db_session.commit.assert_awaited_once()
```

- [ ] **Step 3: Write HabitService implementation**

Create `backend/services/habit_service.py`:
```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import Habit
from schemas.habit import HabitCreate, HabitUpdate


class HabitService:

    @staticmethod
    async def list_habits(db: AsyncSession, user_id: int, include_archived: bool = False) -> list[Habit]:
        query = select(Habit).where(Habit.user_id == user_id)
        if not include_archived:
            query = query.where(Habit.is_archived == False)
        query = query.order_by(Habit.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_habit(db: AsyncSession, habit_id: int, user_id: int) -> Habit | None:
        result = await db.execute(
            select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_habit(db: AsyncSession, user_id: int, data: HabitCreate) -> Habit:
        habit = Habit(
            user_id=user_id,
            name=data.name,
            description=data.description,
            color=data.color,
            category=data.category,
            frequency=data.frequency,
        )
        db.add(habit)
        await db.commit()
        await db.refresh(habit)
        return habit

    @staticmethod
    async def update_habit(db: AsyncSession, habit_id: int, user_id: int, data: HabitUpdate) -> Habit | None:
        habit = await HabitService.get_habit(db, habit_id, user_id)
        if habit is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(habit, field, value)
        await db.commit()
        await db.refresh(habit)
        return habit

    @staticmethod
    async def archive_habit(db: AsyncSession, habit_id: int, user_id: int) -> bool:
        habit = await HabitService.get_habit(db, habit_id, user_id)
        if habit is None:
            return False
        habit.is_archived = True
        await db.commit()
        return True
```

- [ ] **Step 4: Run HabitService tests to verify they pass**

```bash
cd backend && python -m pytest tests/test_habit_service.py -v
```
Expected: all tests PASS

- [ ] **Step 5: Write CheckInService tests**

Create `backend/tests/test_checkin_service.py`:
```python
"""Tests for CheckInService."""

from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import HabitLog
from services.checkin_service import CheckInService


@pytest.fixture
def db_session():
    return AsyncMock(spec=AsyncSession)


@pytest.mark.asyncio
async def test_check_in_creates_log(db_session):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None  # no existing check-in
    db_session.execute = AsyncMock(return_value=mock_result)
    db_session.add = AsyncMock()
    db_session.commit = AsyncMock()
    db_session.refresh = AsyncMock()

    log = await CheckInService.check_in(db_session, habit_id=1, user_id=1, log_date=date(2026, 6, 1), note=None)

    assert log.habit_id == 1
    assert log.completed_at == date(2026, 6, 1)
    db_session.add.assert_awaited_once()
    db_session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_check_in_duplicate_raises_error(db_session):
    existing = HabitLog(id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 1))
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    db_session.execute = AsyncMock(return_value=mock_result)

    with pytest.raises(ValueError, match="already checked in"):
        await CheckInService.check_in(db_session, habit_id=1, user_id=1, log_date=date(2026, 6, 1), note=None)


@pytest.mark.asyncio
async def test_archive_check_in(db_session):
    existing = HabitLog(id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 1), is_archived=False)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing
    db_session.execute = AsyncMock(return_value=mock_result)
    db_session.commit = AsyncMock()

    result = await CheckInService.archive_check_in(db_session, log_id=1, habit_id=1, user_id=1)
    assert result is True
    assert existing.is_archived is True
    db_session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_archive_check_in_not_found(db_session):
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db_session.execute = AsyncMock(return_value=mock_result)

    result = await CheckInService.archive_check_in(db_session, log_id=999, habit_id=1, user_id=1)
    assert result is False


@pytest.mark.asyncio
async def test_get_check_ins_in_range(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [
        HabitLog(id=1, habit_id=1, user_id=1, completed_at=date(2026, 6, 1)),
        HabitLog(id=2, habit_id=1, user_id=1, completed_at=date(2026, 6, 2)),
    ]
    db_session.execute = AsyncMock(return_value=mock_result)

    logs = await CheckInService.get_check_ins(
        db_session, habit_id=1, user_id=1,
        from_date=date(2026, 6, 1), to_date=date(2026, 6, 30),
    )
    assert len(logs) == 2


@pytest.mark.asyncio
async def test_get_heatmap_data(db_session):
    mock_result = MagicMock()
    mock_result.all.return_value = [
        (date(2026, 6, 1), 3),
        (date(2026, 6, 2), 1),
    ]
    db_session.execute = AsyncMock(return_value=mock_result)

    entries = await CheckInService.get_heatmap_data(
        db_session, user_id=1,
        from_date=date(2026, 6, 1), to_date=date(2026, 6, 30),
    )
    assert len(entries) == 2
    assert entries[0].count == 3
```

- [ ] **Step 6: Write CheckInService implementation**

Create `backend/services/checkin_service.py`:
```python
from datetime import date

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import HabitLog
from schemas.habit import HeatmapEntry


class CheckInService:

    @staticmethod
    async def check_in(
        db: AsyncSession, habit_id: int, user_id: int,
        log_date: date, note: str | None = None,
    ) -> HabitLog:
        # Check for duplicate
        existing = await db.execute(
            select(HabitLog).where(
                HabitLog.habit_id == habit_id,
                HabitLog.completed_at == log_date,
                HabitLog.is_archived == False,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise ValueError(f"Already checked in for {log_date}")

        log = HabitLog(
            habit_id=habit_id,
            user_id=user_id,
            completed_at=log_date,
            note=note,
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    @staticmethod
    async def archive_check_in(
        db: AsyncSession, log_id: int, habit_id: int, user_id: int,
    ) -> bool:
        result = await db.execute(
            select(HabitLog).where(
                HabitLog.id == log_id,
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == user_id,
            )
        )
        log = result.scalar_one_or_none()
        if log is None:
            return False
        log.is_archived = True
        await db.commit()
        return True

    @staticmethod
    async def get_check_ins(
        db: AsyncSession, habit_id: int, user_id: int,
        from_date: date, to_date: date,
    ) -> list[HabitLog]:
        result = await db.execute(
            select(HabitLog)
            .where(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == user_id,
                HabitLog.completed_at >= from_date,
                HabitLog.completed_at <= to_date,
                HabitLog.is_archived == False,
            )
            .order_by(HabitLog.completed_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_heatmap_data(
        db: AsyncSession, user_id: int,
        from_date: date, to_date: date,
    ) -> list[HeatmapEntry]:
        result = await db.execute(
            select(
                HabitLog.completed_at,
                func.count(HabitLog.id).label("count"),
            )
            .where(
                HabitLog.user_id == user_id,
                HabitLog.completed_at >= from_date,
                HabitLog.completed_at <= to_date,
                HabitLog.is_archived == False,
            )
            .group_by(HabitLog.completed_at)
            .order_by(HabitLog.completed_at)
        )
        return [HeatmapEntry(date=row[0], count=row[1]) for row in result.all()]
```

- [ ] **Step 7: Run CheckInService tests**

```bash
cd backend && python -m pytest tests/test_checkin_service.py -v
```
Expected: all tests PASS

- [ ] **Step 8: Write StreakService tests**

Create `backend/tests/test_streak_service.py`:
```python
"""Tests for StreakService."""

from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import HabitLog
from services.streak_service import StreakService


@pytest.fixture
def db_session():
    return AsyncMock(spec=AsyncSession)


def make_logs(dates: list[date]) -> list[HabitLog]:
    return [HabitLog(id=i, habit_id=1, user_id=1, completed_at=d) for i, d in enumerate(dates)]


@pytest.mark.asyncio
async def test_no_check_ins(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 0
    assert streaks.longest_streak == 0
    assert streaks.total_check_ins == 0


@pytest.mark.asyncio
async def test_single_check_in_today(db_session):
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = make_logs([date.today()])
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 1
    assert streaks.longest_streak == 1
    assert streaks.total_check_ins == 1


@pytest.mark.asyncio
async def test_consecutive_days(db_session):
    today = date.today()
    dates = [today - __import__("datetime").timedelta(days=i) for i in range(5)]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = make_logs(dates)
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 5
    assert streaks.longest_streak == 5


@pytest.mark.asyncio
async def test_gap_in_current_streak(db_session):
    today = date.today()
    # Missed yesterday, so current streak = 1 (today only)
    dates = [today, today - __import__("datetime").timedelta(days=2)]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = make_logs(dates)
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 1
    assert streaks.longest_streak == 1


@pytest.mark.asyncio
async def test_longest_streak_in_past(db_session):
    today = date.today()
    # 5 consecutive days ending 10 days ago, then nothing recent
    past_dates = [
        today - __import__("datetime").timedelta(days=12 + i) for i in range(5)
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = make_logs(past_dates)
    db_session.execute = AsyncMock(return_value=mock_result)

    streaks = await StreakService.get_streaks(db_session, habit_id=1, user_id=1)
    assert streaks.current_streak == 0  # gap since last check-in
    assert streaks.longest_streak == 5
    assert streaks.total_check_ins == 5
```

- [ ] **Step 9: Write StreakService implementation**

Create `backend/services/streak_service.py`:
```python
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.habit import HabitLog
from schemas.habit import StreakResult


class StreakService:

    @staticmethod
    async def get_streaks(db: AsyncSession, habit_id: int, user_id: int) -> StreakResult:
        result = await db.execute(
            select(HabitLog.completed_at)
            .where(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == user_id,
                HabitLog.is_archived == False,
            )
            .order_by(HabitLog.completed_at.desc())
        )
        dates = [row[0] for row in result.all()]
        total = len(dates)

        if total == 0:
            return StreakResult(habit_id=habit_id, current_streak=0, longest_streak=0, total_check_ins=0)

        # Calculate current streak
        current = 0
        today = date.today()
        # Check if today or yesterday has a check-in (current streak starts from most recent)
        check_date = today
        for d in dates:
            if d == check_date or d == check_date - timedelta(days=1):
                # Start or continue streak from the most recent check-in date
                break
        else:
            # Most recent check-in is older than yesterday
            pass

        # Walk backward from the most recent check-in
        check_date = dates[0]
        for d in dates:
            if d == check_date:
                current += 1
                check_date -= timedelta(days=1)
            elif d < check_date:
                break

        # Calculate longest streak
        longest = 0
        run = 1
        sorted_asc = sorted(set(dates))
        for i in range(1, len(sorted_asc)):
            if (sorted_asc[i] - sorted_asc[i - 1]).days == 1:
                run += 1
            else:
                longest = max(longest, run)
                run = 1
        longest = max(longest, run) if sorted_asc else 0

        # For a gap between last check-in and today, current streak is 0
        if dates[0] < today - timedelta(days=1):
            current = 0

        # If last check-in is yesterday, current streak includes yesterday
        if dates[0] == today - timedelta(days=1):
            # Recalculate from yesterday backward
            current = 0
            check_date = today - timedelta(days=1)
            # dates are in DESC order
            for d in dates:
                if d == check_date:
                    current += 1
                    check_date -= timedelta(days=1)
                elif d < check_date:
                    break

        return StreakResult(
            habit_id=habit_id,
            current_streak=current,
            longest_streak=longest,
            total_check_ins=total,
        )
```

Wait, this streak logic is getting complex. Let me simplify it. The algorithm should be:

1. Get all sorted check-in dates ascending
2. Find consecutive runs by iterating
3. Current streak: take the last run that includes today or yesterday
4. Longest streak: max run length

Let me simplify:

```python
class StreakService:

    @staticmethod
    async def get_streaks(db: AsyncSession, habit_id: int, user_id: int) -> StreakResult:
        result = await db.execute(
            select(HabitLog.completed_at)
            .where(
                HabitLog.habit_id == habit_id,
                HabitLog.user_id == user_id,
                HabitLog.is_archived == False,
            )
            .order_by(HabitLog.completed_at.asc())
        )
        dates = [row[0] for row in result.all()]
        total = len(dates)

        if total == 0:
            return StreakResult(habit_id=habit_id, current_streak=0, longest_streak=0, total_check_ins=0)

        # Split into consecutive runs
        runs: list[list[date]] = []
        current_run = [dates[0]]
        for d in dates[1:]:
            if (d - current_run[-1]).days == 1:
                current_run.append(d)
            else:
                runs.append(current_run)
                current_run = [d]
        runs.append(current_run)

        longest = max(len(run) for run in runs)

        # Current streak: find the run that contains today or yesterday
        today = date.today()
        current = 0
        for run in reversed(runs):
            if run[-1] == today or run[-1] == today - timedelta(days=1):
                current = len(run)
                break

        return StreakResult(
            habit_id=habit_id,
            current_streak=current,
            longest_streak=longest,
            total_check_ins=total,
        )
```

This is cleaner. Let me use this.

- [ ] **Step 10: Run StreakService tests**

```bash
cd backend && python -m pytest tests/test_streak_service.py -v
```
Expected: all tests PASS

- [ ] **Step 11: Commit**

```bash
git add backend/services/ backend/tests/test_habit_service.py backend/tests/test_checkin_service.py backend/tests/test_streak_service.py
git commit -m "feat: add habit service layer (HabitService, CheckInService, StreakService)"
```

---

### Task 5: Router — HTTP Endpoints

**Files:**
- Create: `backend/routers/habit.py`
- Modify: `backend/main.py` (register router)

**Interfaces:**
- Consumes: `HabitService`, `CheckInService`, `StreakService` services
- Produces: 10 HTTP endpoints under `/api/v1/habits`

- [ ] **Step 1: Write router tests**

Create `backend/tests/test_habit_router.py`:
```python
"""Integration tests for the /api/v1/habits router.

Uses dependency overrides to mock the database session.
"""

from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import status

from database import get_db
from main import app


@pytest.fixture
def mock_db():
    session = AsyncMock()
    app.dependency_overrides[get_db] = lambda: session
    yield session
    app.dependency_overrides.clear()


def make_habit_row(id=1, name="Run", archived=False):
    return {
        "id": id, "user_id": 1, "name": name, "description": None,
        "color": "#3B82F6", "category": "Health", "frequency": "daily",
        "is_archived": archived,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


class TestListHabits:
    @pytest.mark.asyncio
    async def test_list_habits_empty(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_list_habits_with_data(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [MagicMock(
            id=1, user_id=1, name="Run", description=None,
            color="#3B82F6", category="Health", frequency="daily",
            is_archived=False,
            created_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
            updated_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
        )]
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Run"


class TestCreateHabit:
    @pytest.mark.asyncio
    async def test_create_habit_success(self, client, mock_db):
        mock_db.add = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock(side_effect=lambda x: setattr(x, "id", 1))

        resp = await client.post("/api/v1/habits", json={
            "name": "Run", "color": "#3B82F6", "category": "Health",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Run"

    @pytest.mark.asyncio
    async def test_create_habit_missing_name(self, client, mock_db):
        resp = await client.post("/api/v1/habits", json={"color": "#3B82F6"})
        assert resp.status_code == 422


class TestGetHabit:
    @pytest.mark.asyncio
    async def test_get_habit_found(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock(
            id=1, user_id=1, name="Run", description=None,
            color="#3B82F6", category="Health", frequency="daily",
            is_archived=False,
            created_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
            updated_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
        )
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/1")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Run"

    @pytest.mark.asyncio
    async def test_get_habit_not_found(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/999")
        assert resp.status_code == 404


class TestCheckIn:
    @pytest.mark.asyncio
    async def test_check_in_success(self, client, mock_db):
        # First call (check duplicate) returns None
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock(side_effect=lambda x: setattr(x, "id", 1))

        resp = await client.post("/api/v1/habits/1/check-in", json={})
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_check_in_duplicate(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock(id=1)
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.post("/api/v1/habits/1/check-in", json={})
        assert resp.status_code == 409


class TestStreaks:
    @pytest.mark.asyncio
    async def test_streaks_empty(self, client, mock_db):
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        resp = await client.get("/api/v1/habits/1/streaks")
        assert resp.status_code == 200
        data = resp.json()
        assert data["current_streak"] == 0
        assert data["longest_streak"] == 0
```

- [ ] **Step 2: Write router implementation**

Create `backend/routers/habit.py`:
```python
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.habit import (
    CheckInCreate, HabitCreate, HabitLogRead, HabitRead,
    HabitUpdate, HeatmapEntry, StreakResult,
)
from services.checkin_service import CheckInService
from services.habit_service import HabitService
from services.streak_service import StreakService

router = APIRouter(prefix="/api/v1/habits", tags=["habits"])

USER_ID = 1  # single default user


@router.get("", response_model=list[HabitRead])
async def list_habits(
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService.list_habits(db, USER_ID, include_archived)


@router.post("", response_model=HabitRead, status_code=status.HTTP_201_CREATED)
async def create_habit(
    data: HabitCreate,
    db: AsyncSession = Depends(get_db),
):
    return await HabitService.create_habit(db, USER_ID, data)


@router.get("/{habit_id}", response_model=HabitRead)
async def get_habit(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    habit = await HabitService.get_habit(db, habit_id, USER_ID)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return habit


@router.patch("/{habit_id}", response_model=HabitRead)
async def update_habit(
    habit_id: int,
    data: HabitUpdate,
    db: AsyncSession = Depends(get_db),
):
    habit = await HabitService.update_habit(db, habit_id, USER_ID, data)
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    return habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_habit(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    ok = await HabitService.archive_habit(db, habit_id, USER_ID)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")


@router.post("/{habit_id}/check-in", response_model=HabitLogRead, status_code=status.HTTP_201_CREATED)
async def check_in(
    habit_id: int,
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
):
    log_date = data.date or date.today()
    try:
        return await CheckInService.check_in(db, habit_id, USER_ID, log_date, data.note)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/{habit_id}/check-in/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_check_in(
    habit_id: int,
    log_id: int,
    db: AsyncSession = Depends(get_db),
):
    ok = await CheckInService.archive_check_in(db, log_id, habit_id, USER_ID)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found")


@router.get("/{habit_id}/check-ins", response_model=list[HabitLogRead])
async def get_check_ins(
    habit_id: int,
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: AsyncSession = Depends(get_db),
):
    return await CheckInService.get_check_ins(db, habit_id, USER_ID, from_date, to_date)


@router.get("/{habit_id}/streaks", response_model=StreakResult)
async def get_streaks(
    habit_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await StreakService.get_streaks(db, habit_id, USER_ID)


@router.get("/heatmap", response_model=list[HeatmapEntry])
async def get_heatmap(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: AsyncSession = Depends(get_db),
):
    return await CheckInService.get_heatmap_data(db, USER_ID, from_date, to_date)
```

- [ ] **Step 3: Register router in main.py**

Edit `backend/main.py`:
```python
from routers.habit import router as habit_router

# After user_router:
app.include_router(habit_router)
```

The full updated section:
```python
from routers.health import router as health_router
from routers.habit import router as habit_router
from routers.user import router as user_router

# ... lifespan and CORS ...

app.include_router(health_router)
app.include_router(habit_router)
app.include_router(user_router)
```

- [ ] **Step 4: Run router tests**

```bash
cd backend && python -m pytest tests/test_habit_router.py -v
```
Expected: all tests PASS (run in --asyncio-mode=auto)

- [ ] **Step 5: Commit**

```bash
git add backend/routers/habit.py backend/main.py backend/tests/test_habit_router.py
git commit -m "feat: add habit router with all CRUD and check-in endpoints"
```

---

### Task 6: Backend Tests — Full Suite

- [ ] **Step 1: Run full backend test suite**

```bash
cd backend && python -m pytest -v
```
Expected: all tests PASS (existing user tests + all habit tests)

- [ ] **Step 2: Verify streak algorithm edge cases**

All streak test cases should pass:
- `test_no_check_ins` — returns all zeros
- `test_single_check_in_today` — current=1, longest=1
- `test_consecutive_days` — current=5, longest=5
- `test_gap_in_current_streak` — streak broken, current=1 (today only)
- `test_longest_streak_in_past` — current=0 (old streak), longest=5

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "test: complete backend test suite for habit module"
```

---

### Task 7: Frontend — Zustand + API Module

**Files:**
- Create: `frontend/src/api/habits.js`
- Create: `frontend/src/stores/useHabitsStore.js`
- Modify: `frontend/package.json` (add zustand dependency)

**Interfaces:**
- Consumes: Zustand (new dep), existing `client` from `api/client.js`
- Produces: `useHabitsStore` with actions consumed by components

- [ ] **Step 1: Install Zustand**

```bash
cd frontend && npm install zustand
```

- [ ] **Step 2: Write API module**

Create `frontend/src/api/habits.js`:
```javascript
import client from "./client";

export async function fetchHabits(includeArchived = false) {
  const params = includeArchived ? { include_archived: true } : {};
  const { data } = await client.get("/habits", { params });
  return data;
}

export async function createHabit(habitData) {
  const { data } = await client.post("/habits", habitData);
  return data;
}

export async function getHabit(id) {
  const { data } = await client.get(`/habits/${id}`);
  return data;
}

export async function updateHabit(id, habitData) {
  const { data } = await client.patch(`/habits/${id}`, habitData);
  return data;
}

export async function archiveHabit(id) {
  await client.delete(`/habits/${id}`);
}

export async function checkIn(habitId, payload = {}) {
  const { data } = await client.post(`/habits/${habitId}/check-in`, payload);
  return data;
}

export async function archiveCheckIn(habitId, logId) {
  await client.delete(`/habits/${habitId}/check-in/${logId}`);
}

export async function getCheckIns(habitId, fromDate, toDate) {
  const { data } = await client.get(`/habits/${habitId}/check-ins`, {
    params: { from: fromDate, to: toDate },
  });
  return data;
}

export async function getStreaks(habitId) {
  const { data } = await client.get(`/habits/${habitId}/streaks`);
  return data;
}

export async function getHeatmap(fromDate, toDate) {
  const { data } = await client.get("/habits/heatmap", {
    params: { from: fromDate, to: toDate },
  });
  return data;
}
```

- [ ] **Step 3: Write Zustand store**

Create `frontend/src/stores/useHabitsStore.js`:
```javascript
import { create } from "zustand";
import * as habitsApi from "../api/habits";

const useHabitsStore = create((set, get) => ({
  habits: [],
  heatmapData: [],
  loading: false,
  error: null,

  fetchHabits: async (includeArchived = false) => {
    set({ loading: true, error: null });
    try {
      const habits = await habitsApi.fetchHabits(includeArchived);
      set({ habits, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createHabit: async (habitData) => {
    try {
      const habit = await habitsApi.createHabit(habitData);
      set((state) => ({ habits: [habit, ...state.habits] }));
      return habit;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateHabit: async (id, habitData) => {
    try {
      const habit = await habitsApi.updateHabit(id, habitData);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? habit : h)),
      }));
      return habit;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  archiveHabit: async (id) => {
    try {
      await habitsApi.archiveHabit(id);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  checkIn: async (habitId, payload = {}) => {
    try {
      const log = await habitsApi.checkIn(habitId, payload);
      return log;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchHeatmap: async (fromDate, toDate) => {
    try {
      const data = await habitsApi.getHeatmap(fromDate, toDate);
      set({ heatmapData: data });
    } catch (err) {
      set({ error: err.message });
    }
  },
}));

export default useHabitsStore;
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/habits.js frontend/src/stores/useHabitsStore.js frontend/package.json frontend/package-lock.json
git commit -m "feat: add habits API module and Zustand store"
```

---

### Task 8: Frontend — HabitCard, HabitForm, HabitList, CheckInModal

**Files:**
- Create: `frontend/src/components/HabitCard.jsx`
- Create: `frontend/src/components/HabitForm.jsx`
- Create: `frontend/src/components/HabitList.jsx`
- Create: `frontend/src/components/CheckInModal.jsx`

- [ ] **Step 1: Create HabitCard component**

Create `frontend/src/components/HabitCard.jsx`:
```jsx
import { useState } from "react";
import CheckInModal from "./CheckInModal";

export default function HabitCard({ habit, onArchive, onCheckIn, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCheckIn = async (payload) => {
    await onCheckIn(habit.id, payload);
    setShowModal(false);
  };

  return (
    <div className="habit-card" style={{ borderLeftColor: habit.color }}>
      <div className="habit-card-header">
        <span className="habit-color-dot" style={{ backgroundColor: habit.color }} />
        <span className="habit-name" onClick={() => setExpanded(!expanded)}>
          {habit.name}
        </span>
        {habit.category && <span className="habit-category">{habit.category}</span>}
        <span className="habit-streak">🔥 {habit.currentStreak ?? 0}</span>
        <button className="btn-checkin" onClick={() => setShowModal(true)}>
          ✓ Check in
        </button>
      </div>
      {expanded && (
        <div className="habit-card-detail">
          {habit.description && <p className="habit-desc">{habit.description}</p>}
          <button className="btn-edit" onClick={() => onUpdate(habit)}>Edit</button>
          <button className="btn-archive" onClick={() => onArchive(habit.id)}>Archive</button>
        </div>
      )}
      {showModal && (
        <CheckInModal
          habit={habit}
          onConfirm={handleCheckIn}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create CheckInModal component**

Create `frontend/src/components/CheckInModal.jsx`:
```jsx
import { useState } from "react";

export default function CheckInModal({ habit, onConfirm, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ date: date || undefined, note: note || undefined });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Check in: {habit.name}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Date:
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Note (optional):
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Check in</button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create HabitForm component**

Create `frontend/src/components/HabitForm.jsx`:
```jsx
import { useState } from "react";

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

export default function HabitForm({ onSubmit, initialData = null, onCancel = null }) {
  const [name, setName] = useState(initialData?.name || "");
  const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);
  const [category, setCategory] = useState(initialData?.category || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color, category: category || null, description: description || null });
    if (!initialData) {
      setName(""); setColor(PRESET_COLORS[0]); setCategory(""); setDescription("");
    }
  };

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <input
        type="text" placeholder="Habit name" value={name}
        onChange={(e) => setName(e.target.value)} required
      />
      <div className="color-picker">
        {PRESET_COLORS.map((c) => (
          <button
            key={c} type="button"
            className={`color-swatch ${c === color ? "selected" : ""}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <input
        type="text" placeholder="Category (optional)" value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <textarea
        placeholder="Description (optional)" value={description}
        onChange={(e) => setDescription(e.target.value)} rows={2}
      />
      <div className="form-actions">
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
        <button type="submit">{initialData ? "Save" : "Add habit"}</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create HabitList component**

Create `frontend/src/components/HabitList.jsx`:
```jsx
import HabitCard from "./HabitCard";

export default function HabitList({ habits, onArchive, onCheckIn, onUpdate }) {
  if (habits.length === 0) {
    return <p className="empty-state">No habits yet. Create one above!</p>;
  }

  return (
    <div className="habit-list">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onArchive={onArchive}
          onCheckIn={onCheckIn}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/HabitCard.jsx frontend/src/components/HabitForm.jsx frontend/src/components/HabitList.jsx frontend/src/components/CheckInModal.jsx
git commit -m "feat: add HabitCard, HabitForm, HabitList, CheckInModal components"
```

---

### Task 9: Frontend — CalendarHeatmap + MonthCalendar

**Files:**
- Create: `frontend/src/components/CalendarHeatmap.jsx`
- Create: `frontend/src/components/MonthCalendar.jsx`

- [ ] **Step 1: Create CalendarHeatmap component**

Create `frontend/src/components/CalendarHeatmap.jsx`:
```jsx
import { useMemo } from "react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getIntensity(count) {
  if (count === 0) return "level-0";
  if (count === 1) return "level-1";
  if (count <= 3) return "level-2";
  return "level-3";
}

export default function CalendarHeatmap({ data, onClickDay, year = null }) {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const endDate = targetYear === now.getFullYear() ? now : new Date(targetYear, 11, 31);
  const startDate = new Date(targetYear, 0, 1);

  // Build map: dateString -> count
  const countMap = useMemo(() => {
    const map = {};
    if (data) {
      data.forEach(({ date: d, count }) => {
        map[d] = count;
      });
    }
    return map;
  }, [data]);

  // Generate day cells
  const weeks = useMemo(() => {
    const cells = [];
    const cursor = new Date(startDate);
    // Pad to start of week (Sunday)
    const startDay = cursor.getDay();
    for (let i = 0; i < startDay; i++) {
      cells.push(null);
    }
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().split("T")[0];
      cells.push({
        date: new Date(cursor),
        dateStr,
        count: countMap[dateStr] || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    // Pad to end of week
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    // Split into weeks
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [startDate, endDate, countMap]);

  return (
    <div className="heatmap">
      <div className="heatmap-header">Contribution graph — {targetYear}</div>
      <div className="heatmap-grid">
        <div className="heatmap-labels">
          {DAYS_OF_WEEK.map((d) => (
            <span key={d} className="heatmap-day-label">{d}</span>
          ))}
        </div>
        <div className="heatmap-cells">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-week">
              {week.map((cell, di) =>
                cell ? (
                  <div
                    key={di}
                    className={`heatmap-cell ${getIntensity(cell.count)}`}
                    title={`${cell.dateStr}: ${cell.count} check-ins`}
                    onClick={() => onClickDay?.(cell.dateStr)}
                  />
                ) : (
                  <div key={di} className="heatmap-cell empty" />
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="heatmap-cell level-0" />
        <div className="heatmap-cell level-1" />
        <div className="heatmap-cell level-2" />
        <div className="heatmap-cell level-3" />
        <span>More</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create MonthCalendar component**

Create `frontend/src/components/MonthCalendar.jsx`:
```jsx
import { useMemo, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthCalendar({ data, onClickDay }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const countMap = useMemo(() => {
    const map = {};
    if (data) data.forEach(({ date: d, count }) => { map[d] = count; });
    return map;
  }, [data]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells = [];
    for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split("T")[0];
      cells.push({ day: d, dateStr, count: countMap[dateStr] || 0 });
    }
    return cells;
  }, [year, month, countMap]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="month-calendar">
      <div className="month-calendar-header">
        <button onClick={prevMonth}>←</button>
        <span>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth}>→</button>
      </div>
      <div className="month-grid">
        {DAY_HEADERS.map(d => <div key={d} className="month-day-header">{d}</div>)}
        {days.map((cell, i) =>
          cell ? (
            <div
              key={i}
              className={`month-day ${cell.count > 0 ? "has-checkin" : ""}`}
              onClick={() => onClickDay?.(cell.dateStr)}
            >
              <span>{cell.day}</span>
              {cell.count > 0 && <span className="day-dot" />}
            </div>
          ) : (
            <div key={i} className="month-day empty" />
          )
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/CalendarHeatmap.jsx frontend/src/components/MonthCalendar.jsx
git commit -m "feat: add CalendarHeatmap and MonthCalendar components"
```

---

### Task 10: Frontend — Main Habits View

**Files:**
- Modify: `frontend/src/views/Habits.jsx` (from placeholder to full view)

- [ ] **Step 1: Write Habits view**

Overwrite `frontend/src/views/Habits.jsx`:
```jsx
import { useEffect, useState } from "react";
import CalendarHeatmap from "../components/CalendarHeatmap";
import CheckInModal from "../components/CheckInModal";
import HabitForm from "../components/HabitForm";
import HabitList from "../components/HabitList";
import MonthCalendar from "../components/MonthCalendar";
import useHabitsStore from "../stores/useHabitsStore";

export default function Habits() {
  const {
    habits, heatmapData, loading, error,
    fetchHabits, createHabit, updateHabit, archiveHabit, checkIn, fetchHeatmap,
  } = useHabitsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInDate, setCheckInDate] = useState(null);

  useEffect(() => {
    fetchHabits();
    const now = new Date();
    const from = new Date(now.getFullYear() - 1, 0, 1).toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];
    fetchHeatmap(from, to);
  }, [fetchHabits, fetchHeatmap]);

  const handleCreate = async (data) => {
    await createHabit(data);
    setShowForm(false);
  };

  const handleUpdate = async (data) => {
    await updateHabit(editingHabit.id, data);
    setEditingHabit(null);
  };

  const handleCheckIn = async (habitId, payload) => {
    await checkIn(habitId, payload);
    fetchHabits();
  };

  const handleDayClick = (dateStr) => {
    setCheckInDate(dateStr);
    setShowCheckInModal(true);
  };

  const handleBulkCheckIn = async (payload) => {
    for (const habit of habits) {
      try {
        await checkIn(habit.id, { date: payload.date || checkInDate, note: payload.note });
      } catch (e) {
        // skip duplicates silently
      }
    }
    setShowCheckInModal(false);
    fetchHabits();
  };

  if (loading && habits.length === 0) return <div className="loading">Loading habits...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="habits-page">
      <h2>Habits</h2>

      <CalendarHeatmap data={heatmapData} onClickDay={handleDayClick} />
      <MonthCalendar data={heatmapData} onClickDay={handleDayClick} />

      <div className="habits-toolbar">
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + New Habit
        </button>
        <button className="btn-secondary" onClick={() => setShowCheckInModal(true)}>
          Check in all
        </button>
      </div>

      {showForm && (
        <HabitForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {editingHabit && (
        <HabitForm
          initialData={editingHabit}
          onSubmit={handleUpdate}
          onCancel={() => setEditingHabit(null)}
        />
      )}

      <HabitList
        habits={habits}
        onArchive={archiveHabit}
        onCheckIn={handleCheckIn}
        onUpdate={setEditingHabit}
      />

      {showCheckInModal && (
        <CheckInModal
          habit={{ name: checkInDate ? `All habits — ${checkInDate}` : "All habits" }}
          onConfirm={handleBulkCheckIn}
          onClose={() => { setShowCheckInModal(false); setCheckInDate(null); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/Habits.jsx
git commit -m "feat: wire up full Habits view with store integration"
```

---

### Task 11: Frontend Tests

**Files:**
- Create: `frontend/src/__tests__/habits.api.test.js`
- Create: `frontend/src/__tests__/useHabitsStore.test.js`
- Create: `frontend/src/__tests__/HabitCard.test.jsx`
- Create: `frontend/src/__tests__/CheckInModal.test.jsx`
- Create: `frontend/src/__tests__/CalendarHeatmap.test.jsx`
- Create: `frontend/src/__tests__/MonthCalendar.test.jsx`

- [ ] **Step 1: Write API module tests**

Create `frontend/src/__tests__/habits.api.test.js`:
```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../api/client";

vi.mock("../api/client");

const {
  fetchHabits, createHabit, getHabit, updateHabit, archiveHabit,
  checkIn, getStreaks, getHeatmap,
} = await import("../api/habits");

describe("habits API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchHabits calls GET /habits", async () => {
    client.get.mockResolvedValue({ data: [] });
    const result = await fetchHabits();
    expect(client.get).toHaveBeenCalledWith("/habits", { params: {} });
    expect(result).toEqual([]);
  });

  it("createHabit calls POST /habits", async () => {
    const habit = { name: "Run", color: "#3B82F6" };
    client.post.mockResolvedValue({ data: { id: 1, ...habit } });
    const result = await createHabit(habit);
    expect(client.post).toHaveBeenCalledWith("/habits", habit);
    expect(result.id).toBe(1);
  });

  it("checkIn calls POST /habits/{id}/check-in", async () => {
    client.post.mockResolvedValue({ data: { id: 1 } });
    const result = await checkIn(1, { note: "Good" });
    expect(client.post).toHaveBeenCalledWith("/habits/1/check-in", { note: "Good" });
    expect(result.id).toBe(1);
  });

  it("getStreaks calls GET /habits/{id}/streaks", async () => {
    client.get.mockResolvedValue({ data: { current_streak: 5 } });
    const result = await getStreaks(1);
    expect(client.get).toHaveBeenCalledWith("/habits/1/streaks");
    expect(result.current_streak).toBe(5);
  });

  it("getHeatmap calls GET /habits/heatmap", async () => {
    client.get.mockResolvedValue({ data: [] });
    await getHeatmap("2026-01-01", "2026-12-31");
    expect(client.get).toHaveBeenCalledWith("/habits/heatmap", {
      params: { from: "2026-01-01", to: "2026-12-31" },
    });
  });
});
```

- [ ] **Step 2: Write store tests**

Create `frontend/src/__tests__/useHabitsStore.test.js`:
```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useHabitsStore from "../stores/useHabitsStore";
import * as habitsApi from "../api/habits";

vi.mock("../api/habits");

describe("useHabitsStore", () => {
  beforeEach(() => {
    act(() => useHabitsStore.getState().habits.length && useHabitsStore.setState({ habits: [], heatmapData: [], loading: false, error: null }));
  });

  it("fetchHabits sets habits on success", async () => {
    const mockHabits = [{ id: 1, name: "Run" }];
    habitsApi.fetchHabits.mockResolvedValue(mockHabits);

    await act(async () => {
      await useHabitsStore.getState().fetchHabits();
    });

    const state = useHabitsStore.getState();
    expect(state.habits).toEqual(mockHabits);
    expect(state.loading).toBe(false);
  });

  it("createHabit prepends habit", async () => {
    useHabitsStore.setState({ habits: [] });
    const newHabit = { id: 1, name: "Run" };
    habitsApi.createHabit.mockResolvedValue(newHabit);

    await act(async () => {
      await useHabitsStore.getState().createHabit({ name: "Run" });
    });

    expect(useHabitsStore.getState().habits).toEqual([newHabit]);
  });
});
```

- [ ] **Step 3: Write component tests**

Create `frontend/src/__tests__/HabitCard.test.jsx`:
```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HabitCard from "../components/HabitCard";

const mockHabit = {
  id: 1, name: "Morning run", color: "#3B82F6",
  category: "Health", description: "Run 5k",
  currentStreak: 3,
};

describe("HabitCard", () => {
  it("renders habit name and category", () => {
    render(<HabitCard habit={mockHabit} onArchive={vi.fn()} onCheckIn={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByText("Morning run")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
  });

  it("shows streak count", () => {
    render(<HabitCard habit={mockHabit} onArchive={vi.fn()} onCheckIn={vi.fn()} onUpdate={vi.fn()} />);
    expect(screen.getByText(/🔥 3/)).toBeInTheDocument();
  });

  it("opens modal on check-in click", async () => {
    render(<HabitCard habit={mockHabit} onArchive={vi.fn()} onCheckIn={vi.fn()} onUpdate={vi.fn()} />);
    await userEvent.click(screen.getByText("✓ Check in"));
    expect(screen.getByText(/Check in/)).toBeInTheDocument();
  });
});
```

Create `frontend/src/__tests__/CheckInModal.test.jsx`:
```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckInModal from "../components/CheckInModal";

describe("CheckInModal", () => {
  it("renders modal with habit name", () => {
    render(<CheckInModal habit={{ name: "Run" }} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/Check in/)).toBeInTheDocument();
  });

  it("calls onConfirm with date and note", async () => {
    const onConfirm = vi.fn();
    render(<CheckInModal habit={{ name: "Run" }} onConfirm={onConfirm} onClose={vi.fn()} />);
    await userEvent.click(screen.getByText("Check in"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on overlay click", async () => {
    const onClose = vi.fn();
    render(<CheckInModal habit={{ name: "Run" }} onConfirm={vi.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

Create `frontend/src/__tests__/CalendarHeatmap.test.jsx`:
```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CalendarHeatmap from "../components/CalendarHeatmap";

describe("CalendarHeatmap", () => {
  it("renders with empty data", () => {
    render(<CalendarHeatmap data={[]} onClickDay={vi.fn()} />);
    expect(screen.getByText(/Contribution graph/)).toBeInTheDocument();
  });

  it("renders with data", () => {
    const data = [{ date: "2026-06-01", count: 3 }];
    render(<CalendarHeatmap data={data} onClickDay={vi.fn()} year={2026} />);
    expect(screen.getByText("2026")).toBeInTheDocument();
  });
});
```

Create `frontend/src/__tests__/MonthCalendar.test.jsx`:
```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MonthCalendar from "../components/MonthCalendar";

describe("MonthCalendar", () => {
  it("renders month navigation", () => {
    render(<MonthCalendar data={[]} onClickDay={vi.fn()} />);
    expect(screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toBeInTheDocument();
  });

  it("shows day headers", () => {
    render(<MonthCalendar data={[]} onClickDay={vi.fn()} />);
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run frontend tests**

```bash
cd frontend && npm test 2>&1 || true
```
Expected: Run the tests with vitest

If any tests fail, fix the component implementation and re-run.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/__tests__/habits.api.test.js frontend/src/__tests__/useHabitsStore.test.js frontend/src/__tests__/HabitCard.test.jsx frontend/src/__tests__/CheckInModal.test.jsx frontend/src/__tests__/CalendarHeatmap.test.jsx frontend/src/__tests__/MonthCalendar.test.jsx
git commit -m "test: add frontend tests for habit components"
```

---

### Task 12: Integration Verification

- [ ] **Step 1: Start backend dev services**

```bash
docker compose -f docker-compose.dev.yml up -d
```

- [ ] **Step 2: Run backend migration**

```bash
cd backend && alembic upgrade head
```

- [ ] **Step 3: Run backend test suite**

```bash
cd backend && python -m pytest -v
```
All tests should PASS.

- [ ] **Step 4: Start backend**

```bash
cd backend && uvicorn main:app --reload &
```

- [ ] **Step 5: Run frontend**

```bash
cd frontend && npm run dev &
```

- [ ] **Step 6: Quick API smoke test**

```bash
# Create a habit
curl -s -X POST http://localhost:8000/api/v1/habits \
  -H "Content-Type: application/json" \
  -d '{"name":"Morning run","color":"#3B82F6","category":"Health"}'

# List habits
curl -s http://localhost:8000/api/v1/habits

# Check in
curl -s -X POST http://localhost:8000/api/v1/habits/1/check-in \
  -H "Content-Type: application/json" \
  -d '{}'

# Get streaks
curl -s http://localhost:8000/api/v1/habits/1/streaks

# Get heatmap
curl -s "http://localhost:8000/api/v1/habits/heatmap?from=2026-01-01&to=2026-12-31"
```

Verify all return expected 200/201 responses.

- [ ] **Step 7: Commit if any fixes were needed**

```bash
git add -A && git commit -m "fix: integration fixes"
```

---

### Post-Implementation

- [ ] **Move plan file** from `active/` to `complete/`

```bash
mv agents/exec-plan/active/habit-tracker-phase-2.md agents/exec-plan/complete/habit-tracker-phase-2.md
```

- [ ] **Record technical debt if any** — check `agents/design-doc/technical_debt.md` and add entries if components were deferred or shortcuts were taken.
