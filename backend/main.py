from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.logger import setup_logging
from core.setup import AppSetup
from routers.habit import router as habit_router
from routers.health import router as health_router
from routers.user import router as user_router
from routers.test import router as test_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    yield


app = FastAPI(title="MyWorld API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AppSetup.init_app(app)

app.include_router(health_router)
app.include_router(habit_router)
app.include_router(user_router)
app.include_router(test_router)
