import pytest
from unittest.mock import MagicMock
from uuid import uuid4
from schemas.label import LabelCreate, LabelUpdate, EntityLabelAttach
from services.label_service import LabelService

@pytest.mark.asyncio
async def test_create_label(db_session, test_user):
    data = LabelCreate(name="Urgent", color="#ff0000", description="Must do now")
    label = await LabelService.create_label(db_session, test_user.id, data)
    assert label.id is not None
    assert label.name == "Urgent"
    db_session.add.assert_called_once()
    db_session.commit.assert_called_once()
    db_session.refresh.assert_called_once_with(label)

@pytest.mark.asyncio
async def test_update_label(db_session, test_user):
    data = LabelCreate(name="Health", color="#00ff00")
    label = await LabelService.create_label(db_session, test_user.id, data)
    
    # Mock get_label inside update_label
    result = MagicMock()
    result.scalar_one_or_none.return_value = label
    db_session.execute.return_value = result
    
    update_data = LabelUpdate(color="#0000ff")
    updated = await LabelService.update_label(db_session, label.id, test_user.id, update_data)
    assert updated.color == "#0000ff"
    
@pytest.mark.asyncio
async def test_attach_detach_label(db_session, test_user):
    # Mock get_label
    label = MagicMock()
    label.id = uuid4()
    
    result = MagicMock()
    # attach: get_label → label, existence check → None (not attached)
    # detach: get_label → label, find entity_label → entity_label mock
    result.scalar_one_or_none.side_effect = [label, None, label, MagicMock()]
    db_session.execute.return_value = result
    
    entity_id = uuid4()
    attach_data = EntityLabelAttach(entity_type="commitment", entity_id=entity_id)
    
    # Attach
    ok = await LabelService.attach_label(db_session, label.id, test_user.id, attach_data)
    assert ok
    
    # Detach
    ok = await LabelService.detach_label(db_session, label.id, test_user.id, attach_data)
    assert ok
