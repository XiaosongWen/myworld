from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RecordBase(BaseModel):
    commitment_id: Optional[UUID] = None
    date: date
    content: Optional[str] = None
    status: str = "done" # done, not_done, partial, skip
    value: Optional[Decimal] = None
    sort_order: int = 0


class RecordCreate(RecordBase):
    pass


class RecordUpdate(BaseModel):
    commitment_id: Optional[UUID] = None
    date: Optional[date] = None
    content: Optional[str] = None
    status: Optional[str] = None
    value: Optional[Decimal] = None
    sort_order: Optional[int] = None


class RecordRead(RecordBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecordBatchCreate(BaseModel):
    records: List[RecordCreate]
