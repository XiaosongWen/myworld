from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.commitment import Commitment
from models.commitment_link import CommitmentLink
from models.record import Record
from schemas.commitment import CommitmentCreate, CommitmentUpdate


class CommitmentService:
    @staticmethod
    async def list_commitments(
        db: AsyncSession, user_id: int,
        type_: str | None = None,
        status: str | None = None,
        parent_id: UUID | None = None,
        root: bool = False,
        priority: str | None = None,
        due_date_from: date | None = None,
        due_date_to: date | None = None,
        q: str | None = None,
        record_date: date | None = None,
    ) -> list[Commitment]:
        query = select(Commitment).where(Commitment.user_id == user_id)
        if type_:
            query = query.where(Commitment.type == type_)
        if status:
            query = query.where(Commitment.status == status)
        if priority:
            query = query.where(Commitment.priority == priority)
        if due_date_from:
            query = query.where(Commitment.due_date >= due_date_from)
        if due_date_to:
            query = query.where(Commitment.due_date <= due_date_to)
        if q:
            query = query.where(Commitment.title.ilike(f"%{q}%"))
        if record_date:
            # Commitments that have records on the given date
            exists_query = (
                select(Record.id)
                .where(Record.commitment_id == Commitment.id, Record.date == record_date)
                .exists()
            )
            query = query.where(exists_query)

        if root:
            # Not in any commitment_links as a child
            subquery = select(CommitmentLink.child_id)
            query = query.where(Commitment.id.notin_(subquery))
        elif parent_id:
            query = query.join(CommitmentLink, Commitment.id == CommitmentLink.child_id)\
                         .where(CommitmentLink.parent_id == parent_id)

        query = query.order_by(Commitment.sort_order.asc(), Commitment.created_at.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_commitment(db: AsyncSession, commitment_id: UUID, user_id: int) -> Commitment | None:
        result = await db.execute(
            select(Commitment).where(Commitment.id == commitment_id, Commitment.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_commitment(db: AsyncSession, user_id: int, data: CommitmentCreate) -> Commitment:
        commitment = Commitment(
            user_id=user_id,
            **data.model_dump()
        )
        db.add(commitment)
        await db.commit()
        await db.refresh(commitment)
        return commitment

    @staticmethod
    async def update_commitment(db: AsyncSession, commitment_id: UUID, user_id: int, data: CommitmentUpdate) -> Commitment | None:
        commitment = await CommitmentService.get_commitment(db, commitment_id, user_id)
        if commitment is None:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(commitment, field, value)
            
        await db.commit()
        await db.refresh(commitment)
        return commitment

    @staticmethod
    async def delete_commitment(db: AsyncSession, commitment_id: UUID, user_id: int) -> bool:
        commitment = await CommitmentService.get_commitment(db, commitment_id, user_id)
        if commitment is None:
            return False
        await db.delete(commitment)
        await db.commit()
        return True

    @staticmethod
    async def reorder_commitments(
        db: AsyncSession, items: list[tuple[UUID, int]], user_id: int,
    ) -> None:
        """Batch-update sort_order for a list of commitments."""
        for item_id, sort_order in items:
            result = await db.execute(
                select(Commitment).where(Commitment.id == item_id, Commitment.user_id == user_id)
            )
            commitment = result.scalar_one_or_none()
            if commitment:
                commitment.sort_order = sort_order
        await db.commit()
