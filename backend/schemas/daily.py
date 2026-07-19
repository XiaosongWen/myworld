from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from schemas.commitment import CommitmentRead
from schemas.record import RecordRead


class DailyHabitCheckin(BaseModel):
    commitment: CommitmentRead
    today_record: Optional[RecordRead] = None


class DailyResponse(BaseModel):
    date: date
    habits: List[DailyHabitCheckin]
    tasks: List[CommitmentRead]
    free_records: List[RecordRead]
