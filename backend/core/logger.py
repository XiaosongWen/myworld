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
