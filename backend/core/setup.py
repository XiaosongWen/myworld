from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger
from schemas.response import ErrorResponse
from middlewares.logging_middleware import LoggingMiddleware
from core.logger import setup_logging

class AppSetup:
    @staticmethod
    def setup_logging():
        setup_logging()

    @staticmethod
    def init_app(app: FastAPI):
        app.add_middleware(LoggingMiddleware)
        AppSetup._setup_exception_handlers(app)

    @staticmethod
    def _setup_exception_handlers(app: FastAPI):
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
