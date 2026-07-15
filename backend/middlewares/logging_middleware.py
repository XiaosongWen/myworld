import time
import uuid
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger
from schemas.response import ErrorResponse

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
                logger.exception(f"Unhandled error during {request.method} {request.url.path} | Process Time: {process_time:.4f}s")
                # Return the standardized error envelope directly, since
                # BaseHTTPMiddleware can prevent FastAPI's global exception
                # handler from catching exceptions raised inside call_next.
                return JSONResponse(
                    status_code=500,
                    content=ErrorResponse(msg="server_error", request_id=request_id).model_dump(),
                    headers={"X-Request-ID": request_id},
                )

