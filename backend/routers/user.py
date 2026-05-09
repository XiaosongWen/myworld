from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from schemas.user import UserRead

router = APIRouter(tags=["users"])


@router.get("/api/v1/users/me", response_model=UserRead)
async def get_current_user(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == 1))
    user = result.scalar_one()
    return user
