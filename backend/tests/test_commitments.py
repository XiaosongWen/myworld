import pytest
from uuid import uuid4
from datetime import date
from models.commitment import Commitment
from models.record import Record
from schemas.commitment import CommitmentCreate, CommitmentUpdate
from schemas.record import RecordCreate
from services.commitment_service import CommitmentService
from services.record_service import RecordService
from services.progress_service import ProgressService

@pytest.mark.asyncio
async def test_create_commitment(db_session, test_user):
    # Test creation using service
    data = CommitmentCreate(
        title="Test Habit",
        type="habit",
        status="active",
        priority="high"
    )
    commitment = await CommitmentService.create_commitment(db_session, test_user.id, data)
    assert commitment.id is not None
    assert commitment.title == "Test Habit"
    assert commitment.type == "habit"
    
@pytest.mark.asyncio
async def test_create_record(db_session, test_user):
    data = CommitmentCreate(title="Test", type="habit")
    commitment = await CommitmentService.create_commitment(db_session, test_user.id, data)
    
    rec_data = RecordCreate(
        commitment_id=commitment.id,
        date=date.today(),
        content="Did it",
        status="done"
    )
    record = await RecordService.create_record(db_session, rec_data)
    assert record.id is not None
    assert record.status == "done"
    
@pytest.mark.asyncio
async def test_progress_service_streak(db_session, test_user):
    data = CommitmentCreate(title="Test", type="habit")
    commitment = await CommitmentService.create_commitment(db_session, test_user.id, data)
    
    # 1. Create a record for today
    rec_data = RecordCreate(
        commitment_id=commitment.id,
        date=date.today(),
        status="done"
    )
    await RecordService.create_record(db_session, rec_data)
    
    progress = await ProgressService.compute_progress(db_session, commitment)
    assert progress.method == "streak"
    assert progress.streak == 1
