from fastapi import APIRouter, HTTPException, Request
from loguru import logger
from pydantic import BaseModel
from schemas.response import SingleResponse

router = APIRouter(prefix="/test", tags=["test"])

class TestItem(BaseModel):
    name: str
    value: int

@router.get("/success", response_model=SingleResponse[dict])
async def test_success(request: Request):
    """
    Test a normal successful API call.
    Logs an info message and returns a SingleResponse format.
    """
    logger.info("This is a test success log from inside the route")
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    return SingleResponse(request_id=request_id, data={"message": "Success! Check logs for trace ID."})

@router.post("/validation-error")
async def test_validation_error(item: TestItem):
    """
    Test validation errors. 
    Send a POST request with invalid data (e.g. `value` as a string that can't be converted to int)
    to trigger the RequestValidationError handler.
    """
    # If the user sends valid data, it passes through.
    return {"status": "success", "item": item.model_dump()}

@router.get("/http-error")
async def test_http_error():
    """
    Test HTTP exception handling.
    Raises a 400 Bad Request error which will be caught by the StarletteHTTPException handler.
    """
    logger.warning("Triggering an HTTP Exception intentionally")
    raise HTTPException(status_code=400, detail="This is an intentional HTTP error")

@router.get("/server-error")
async def test_server_error():
    """
    Test unhandled exceptions.
    Causes a ZeroDivisionError to trigger the global Exception handler.
    """
    logger.error("Triggering an unhandled exception intentionally")
    # This will cause a ZeroDivisionError
    result = 1 / 0
    return {"result": result}
