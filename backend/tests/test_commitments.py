from datetime import date
from unittest.mock import MagicMock, AsyncMock

import pytest

from schemas.commitment import CommitmentCreate
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

    # Mock: commitment lookup succeeds, duplicate check returns none
    commit_result = MagicMock()
    commit_result.scalar_one_or_none.return_value = commitment
    dup_result = MagicMock()
    dup_result.scalar_one_or_none.return_value = None
    db_session.execute.side_effect = [commit_result, dup_result]

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

    # Mock: commitment lookup succeeds, duplicate check returns none
    commit_result = MagicMock()
    commit_result.scalar_one_or_none.return_value = commitment
    dup_result = MagicMock()
    dup_result.scalar_one_or_none.return_value = None
    db_session.execute.side_effect = [commit_result, dup_result]

    # 1. Create a record for today
    rec_data = RecordCreate(
        commitment_id=commitment.id,
        date=date.today(),
        status="done"
    )
    await RecordService.create_record(db_session, rec_data)

    # Reset side_effect so the streak query uses the default return_value
    db_session.execute.side_effect = None
    db_session.execute.return_value.scalars.return_value.all.return_value = [date.today()]

    progress = await ProgressService.compute_progress(db_session, commitment)
    assert progress.method == "streak"
    assert progress.streak == 1


@pytest.mark.asyncio
async def test_update_commitment_parent_id(db_session, test_user):
    from schemas.commitment import CommitmentUpdate
    from models.commitment_link import CommitmentLink
    from sqlalchemy import select

    # 1. Create a parent list
    parent_data = CommitmentCreate(title="Parent List", type="list")
    parent = await CommitmentService.create_commitment(db_session, test_user.id, parent_data)

    # 2. Create a child task
    child_data = CommitmentCreate(title="Child Task", type="task")
    child = await CommitmentService.create_commitment(db_session, test_user.id, child_data)
    child.parent_id = None

    # Mock execute returns for update_commitment (get_commitment lookup, cycle check ancestor query, old parent links query)
    get_commit_res = MagicMock()
    get_commit_res.scalar_one_or_none.return_value = child

    cycle_res = MagicMock()
    cycle_res.scalar_one_or_none.return_value = None
    
    # Mock links check (no existing links)
    links_res = MagicMock()
    links_res.scalars.return_value.all.return_value = []
    
    db_session.execute.side_effect = [get_commit_res, cycle_res, links_res]

    # 3. Update parent_id of child to parent.id
    update_data = CommitmentUpdate(parent_id=parent.id)
    await CommitmentService.update_commitment(db_session, child.id, test_user.id, update_data)
    
    # Verify link was added
    added_objects = [args[0] for args, _ in db_session.add.call_args_list]
    link_added = any(isinstance(obj, CommitmentLink) and obj.parent_id == parent.id and obj.child_id == child.id for obj in added_objects)
    assert link_added

    # 4. Remove parent_id (set to None)
    get_commit_res_2 = MagicMock()
    get_commit_res_2.scalar_one_or_none.return_value = child
    
    existing_link = CommitmentLink(parent_id=parent.id, child_id=child.id)
    links_res_2 = MagicMock()
    links_res_2.scalars.return_value.all.return_value = [existing_link]
    
    db_session.execute.side_effect = [get_commit_res_2, links_res_2]
    db_session.delete = AsyncMock()

    update_none = CommitmentUpdate(parent_id=None)
    await CommitmentService.update_commitment(db_session, child.id, test_user.id, update_none)
    
    db_session.delete.assert_called_with(existing_link)


@pytest.mark.asyncio
async def test_update_commitment_circular_parent_id(db_session, test_user):
    from schemas.commitment import CommitmentUpdate
    from uuid import uuid4

    item_id = uuid4()
    item = CommitmentCreate(title="Self Parent Task", type="task")
    created_item = await CommitmentService.create_commitment(db_session, test_user.id, item)
    created_item.id = item_id

    get_commit_res = MagicMock()
    get_commit_res.scalar_one_or_none.return_value = created_item
    db_session.execute.side_effect = [get_commit_res]

    # Updating item to be its own parent should raise ValueError
    with pytest.raises(ValueError, match="cannot be its own parent"):
        await CommitmentService.update_commitment(db_session, item_id, test_user.id, CommitmentUpdate(parent_id=item_id))
