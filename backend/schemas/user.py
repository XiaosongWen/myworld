from datetime import datetime

from pydantic import BaseModel


class UserRead(BaseModel):
    id: int
    username: str
    email: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
