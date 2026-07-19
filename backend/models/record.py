import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Integer, String, Date, Text, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Record(Base):
    __tablename__ = "records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commitment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("commitments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="done")
    value: Mapped[Optional[Decimal]] = mapped_column(Numeric, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    commitment = relationship("Commitment", back_populates="records")
