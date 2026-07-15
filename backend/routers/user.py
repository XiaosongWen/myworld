from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from schemas.user import UserRead
from schemas.response import SingleResponse

router = APIRouter(tags=["users"])


@router.get("/api/v1/users/me", response_model=SingleResponse[UserRead])
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == 1))
    user = result.scalar_one()
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data=user)
