"""create commitments and records

Revision ID: 003
Revises: 002
Create Date: 2026-07-19
"""

import uuid
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Create new tables
    op.create_table(
        "commitments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(50), nullable=False), # habit, goal, task, list
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"), # active, in_progress, archived, completed, paused
        sa.Column("priority", sa.String(50), nullable=False, server_default="none"), # none, low, medium, high
        sa.Column("config", JSONB(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_commitments_user_id"),
    )
    op.create_index(op.f("ix_commitments_user_id"), "commitments", ["user_id"])

    op.create_table(
        "commitment_links",
        sa.Column("parent_id", UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", UUID(as_uuid=True), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("parent_id", "child_id"),
        sa.ForeignKeyConstraint(["parent_id"], ["commitments.id"], name="fk_links_parent_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["commitments.id"], name="fk_links_child_id", ondelete="CASCADE"),
    )

    op.create_table(
        "records",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("commitment_id", UUID(as_uuid=True), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="done"), # done, not_done, partial, skip
        sa.Column("value", sa.Numeric(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["commitment_id"], ["commitments.id"], name="fk_records_commitment_id", ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_records_commitment_id"), "records", ["commitment_id"])

    # 2. Migrate Data
    conn = op.get_bind()
    
    # Check if old tables exist before attempting migration
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if "habits" in tables and "habit_logs" in tables:
        habits = conn.execute(sa.text("SELECT id, user_id, name, description, is_archived, created_at, updated_at FROM habits")).fetchall()
        
        habit_id_map = {}
        for habit in habits:
            new_uuid = str(uuid.uuid4())
            habit_id_map[habit.id] = new_uuid
            config = json.dumps({"target_count": 7})
            status = 'archived' if habit.is_archived else 'active'
            conn.execute(sa.text("""
                INSERT INTO commitments (id, user_id, type, title, description, status, priority, config, sort_order, created_at, updated_at)
                VALUES (:id, :user_id, :type, :title, :description, :status, :priority, :config, :sort_order, :created_at, :updated_at)
            """), {
                "id": new_uuid,
                "user_id": habit.user_id,
                "type": "habit",
                "title": habit.name,
                "description": habit.description,
                "status": status,
                "priority": "none",
                "config": config,
                "sort_order": 0,
                "created_at": habit.created_at,
                "updated_at": habit.updated_at
            })

        habit_logs = conn.execute(sa.text("SELECT id, habit_id, completed_at, note, created_at FROM habit_logs")).fetchall()
        for log in habit_logs:
            new_uuid = str(uuid.uuid4())
            new_commitment_id = habit_id_map.get(log.habit_id)
            if new_commitment_id:
                conn.execute(sa.text("""
                    INSERT INTO records (id, commitment_id, date, content, status, sort_order, created_at)
                    VALUES (:id, :commitment_id, :date, :content, :status, :sort_order, :created_at)
                """), {
                    "id": new_uuid,
                    "commitment_id": new_commitment_id,
                    "date": log.completed_at,
                    "content": log.note,
                    "status": "done",
                    "sort_order": 0,
                    "created_at": log.created_at
                })

        # 3. Drop old tables
        op.drop_table("habit_logs")
        op.drop_table("habits")


def downgrade():
    op.create_table(
        "habits",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(7), nullable=False, server_default="#000000"),
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

    # Attempt to reverse migrate
    conn = op.get_bind()
    commitments = conn.execute(sa.text("SELECT id, user_id, title, description, status, created_at, updated_at FROM commitments WHERE type = 'habit'")).fetchall()
    
    # We map back uuid -> newly generated integer ID
    # Since we can't easily force inserts into autoincrement column properly without sequence hacking in PG,
    # we'll let postgres handle the ID, and use RETURNING to get the new ID.
    commitment_to_habit = {}
    for c in commitments:
        is_archived = True if c.status == 'archived' else False
        res = conn.execute(sa.text("""
            INSERT INTO habits (user_id, name, description, is_archived, created_at, updated_at)
            VALUES (:user_id, :name, :description, :is_archived, :created_at, :updated_at)
            RETURNING id
        """), {
            "user_id": c.user_id,
            "name": c.title,
            "description": c.description,
            "is_archived": is_archived,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        }).fetchone()
        if res:
            commitment_to_habit[c.id] = res[0]

    records = conn.execute(sa.text("SELECT id, commitment_id, date, content, created_at FROM records WHERE status = 'done'")).fetchall()
    for r in records:
        habit_id = commitment_to_habit.get(r.commitment_id)
        if habit_id:
            # Check for existing user_id
            user_id = next((c.user_id for c in commitments if c.id == r.commitment_id), 1)
            conn.execute(sa.text("""
                INSERT INTO habit_logs (habit_id, user_id, completed_at, note, created_at)
                VALUES (:habit_id, :user_id, :completed_at, :note, :created_at)
                ON CONFLICT (habit_id, completed_at) DO NOTHING
            """), {
                "habit_id": habit_id,
                "user_id": user_id,
                "completed_at": r.date,
                "note": r.content,
                "created_at": r.created_at
            })

    op.drop_table("records")
    op.drop_table("commitment_links")
    op.drop_table("commitments")
