"""create labels

Revision ID: 004
Revises: 003
Create Date: 2026-07-19
"""

import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "labels",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("color", sa.String(7), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_labels_user_id"),
        sa.UniqueConstraint("user_id", "name", name="uq_labels_user_name"),
    )
    op.create_index(op.f("ix_labels_user_id"), "labels", ["user_id"])

    op.create_table(
        "entity_labels",
        sa.Column("label_id", UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("label_id", "entity_type", "entity_id"),
        sa.ForeignKeyConstraint(["label_id"], ["labels.id"], name="fk_entity_labels_label_id", ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_entity_labels_entity_type_id"), "entity_labels", ["entity_type", "entity_id"])
    op.create_index(op.f("ix_entity_labels_label_id_type"), "entity_labels", ["label_id", "entity_type"])


def downgrade():
    op.drop_table("entity_labels")
    op.drop_table("labels")
