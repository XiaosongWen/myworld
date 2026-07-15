from fastapi import APIRouter, Request
from schemas.response import SingleResponse

router = APIRouter(tags=["health"])


@router.get("/api/v1/health", response_model=SingleResponse[dict])
async def health_check(request: Request):
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data={"status": "ok"})
