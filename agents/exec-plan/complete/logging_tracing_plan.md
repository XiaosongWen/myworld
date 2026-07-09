# Tracing and Logging Implementation Plan

Here is a step-by-step plan to add comprehensive tracing and logging for all API responses in your FastAPI backend. This plan ensures we log every request/response, generate trace IDs for easier debugging, and capture detailed error logs with exact line numbers when exceptions occur.

> **⚠️ Important:** This plan must coordinate with the API response refactoring ([`refactor-api-response.md`](refactor-api-response.md)). The response refactoring introduces a `request_id` in every API response envelope and defines `SingleResponse`, `ListResponse`, and `ErrorResponse` Pydantic schemas in `backend/schemas/response.py`. **The `request_id` and the logging `trace_id` should be the same UUID value** — one ID used for both tracing and the response envelope. The middleware below handles both concerns in one place.

## Step 1: Install Logging Library

We will use **Loguru**. It is highly recommended for FastAPI because it requires minimal configuration, supports structured logging, and has excellent out-of-the-box formatting that highlights exactly where errors occur (with detailed tracebacks).

**Action:** Add `loguru` to your `backend/requirements.txt` and install it.

## Step 2: Configure Global Logger

We'll set up a central logging configuration to ensure all logs have a consistent format.

**Action:** Create a new file at `backend/core/logger.py` to initialize Loguru. We'll configure it to log to the console with trace IDs and context.

```python
# backend/core/logger.py
import sys
from loguru import logger

def setup_logging():
    logger.remove()
    # Add a custom format that includes trace_id (same value as the response request_id)
    logger.add(
        sys.stdout, 
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - [Request ID: {extra[request_id]}] - <level>{message}</level>",
        enqueue=True,
    )
```

## Step 3: Implement Unified Logging and Tracing Middleware

We will add a single FastAPI middleware that:
- Generates a unique `request_id` (UUID) for every request
- Stores it on `request.state.request_id` (consumed by the response schemas)
- Sets it as the Loguru context variable
- Logs the incoming request and outgoing response with timing

**Action:** Create `backend/middlewares/logging_middleware.py`.

```python
# backend/middlewares/logging_middleware.py
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate a unique request ID — same value used for both tracing and the response envelope
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Bind the request ID to the logger context
        with logger.contextualize(request_id=request_id):
            logger.info(f"Incoming request: {request.method} {request.url.path}")
            
            start_time = time.time()
            try:
                response = await call_next(request)
                process_time = time.time() - start_time
                logger.info(f"Response status: {response.status_code} | Process Time: {process_time:.4f}s")
                
                # Attach request_id to response headers for client debugging
                response.headers["X-Request-ID"] = request_id
                return response
            except Exception as e:
                process_time = time.time() - start_time
                # We do not handle the exception here, we just log the time it took before the failure
                logger.error(f"Request failed | Process Time: {process_time:.4f}s")
                raise e
```

## Step 4: Add Global Exception Handlers (Compatible with Response Schemas)

To catch all unhandled errors with full tracebacks and format them using the standardized `ErrorResponse` envelope.

**Action:** Add exception handling in `backend/main.py`.

```python
from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger
from schemas.response import ErrorResponse

# In main.py — register after app creation
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    logger.warning(f"Validation error: {exc.errors()} | Request ID: {request_id}")
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(msg="validation_error", request_id=request_id).model_dump(),
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} | Request ID: {request_id}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(msg=str(exc.detail), request_id=request_id).model_dump(),
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "UNKNOWN")
    # Log the exception with a full traceback
    logger.exception(f"Unhandled error during {request.method} {request.url.path} | Request ID: {request_id}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(msg="server_error", request_id=request_id).model_dump(),
    )
```

> **Note:** The middleware runs before exception handlers, so `request.state.request_id` is always set by the time an exception handler fires (unless the error happens in the middleware itself).

## Step 5: Integrate Everything in `main.py`

Hook the middleware and the logger initialization into the FastAPI app lifecycle.

**Action:** Update `backend/main.py`.

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.logger import setup_logging
from middlewares.logging_middleware import LoggingMiddleware
from routers.habit import router as habit_router
from routers.health import router as health_router
from routers.user import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    yield


app = FastAPI(title="MyWorld API", version="0.1.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware, ...)
app.add_middleware(LoggingMiddleware)   # <— added here

app.include_router(health_router)
app.include_router(habit_router)
app.include_router(user_router)

# Register exception handlers AFTER app creation
@app.exception_handler(RequestValidationError) ...
@app.exception_handler(StarletteHTTPException) ...
@app.exception_handler(Exception) ...
```

## Summary of Benefits
1. **Unified traceability:** Every request receives one UUID that serves as both the `request_id` in the API response envelope and the ID in every log line — no duplication, no mismatches.
2. **Error Localization:** `logger.exception` automatically extracts and prints the full stack trace, pointing exactly to the file and line number where the error occurred.
3. **Performance Metrics:** The middleware records exactly how long each request takes to process.
4. **Consistent error format:** Exception handlers return the standardized `ErrorResponse` schema instead of ad-hoc `{"detail": ...}` structures.
5. **Client debuggability:** The `X-Request-ID` header is attached to every response so clients can correlate failures to server logs.

## Files that will be created or modified
- `backend/core/__init__.py` — create (empty)
- `backend/core/logger.py` — create
- `backend/middlewares/__init__.py` — create (empty)
- `backend/middlewares/logging_middleware.py` — create
- `backend/requirements.txt` — add `loguru`
- `backend/main.py` — add middleware registration, exception handlers, lifespan logger setup
