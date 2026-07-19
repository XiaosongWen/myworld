from datetime import date
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.record import Record
from schemas.record import RecordCreate, RecordUpdate

class RecordService:
    @staticmethod
    async def get_records(
        db: AsyncSession, 
        commitment_id: UUID | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        status: str | None = None
    ) -> list[Record]:
        query = select(Record)
        if commitment_id:
            query = query.where(Record.commitment_id == commitment_id)
        if date_from:
            query = query.where(Record.date >= date_from)
        if date_to:
            query = query.where(Record.date <= date_to)
        if status:
            query = query.where(Record.status == status)
            
        query = query.order_by(Record.date.desc(), Record.sort_order.asc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_record(db: AsyncSession, record_id: UUID) -> Record | None:
        result = await db.execute(select(Record).where(Record.id == record_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_record(db: AsyncSession, data: RecordCreate) -> Record:
        record = Record(**data.model_dump())
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record
        
    @staticmethod
    async def batch_create_records(db: AsyncSession, data_list: list[RecordCreate]) -> list[Record]:
        records = [Record(**data.model_dump()) for data in data_list]
        db.add_all(records)
        await db.commit()
        for r in records:
            await db.refresh(r)
        return records

    @staticmethod
    async def update_record(db: AsyncSession, record_id: UUID, data: RecordUpdate) -> Record | None:
        record = await RecordService.get_record(db, record_id)
        if record is None:
            return None
            
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(record, field, value)
            
        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def delete_record(db: AsyncSession, record_id: UUID) -> bool:
        record = await RecordService.get_record(db, record_id)
        if record is None:
            return False
        await db.delete(record)
        await db.commit()
        return True
