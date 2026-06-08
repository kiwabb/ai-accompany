import pytest
import os
import asyncio
from typing import AsyncGenerator
from fastapi import Header
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Set the test database before importing backend.database. That module creates
# its engine at import time, so this keeps pytest independent of asyncpg/Postgres.
DATABASE_URL = "sqlite+aiosqlite:///./test.db"
os.environ["DATABASE_URL"] = DATABASE_URL

from backend.database import Base, get_db as original_get_db
from backend.routers.users import get_current_user_id
from backend.models import (
    LearningSession,
    ChatHistory,
    UserSettings,
    UserTheme,
    Topic,
    UserProfile,
    MemoryFragment,
)
from backend.main import app
from httpx import AsyncClient, ASGITransport

# Use a file-based SQLite database for testing
test_engine = create_async_engine(DATABASE_URL, echo=False)
AsyncTestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session", autouse=True)
def mock_env_vars():
    os.environ["GOOGLE_API_KEY"] = "fake-test-key"
    yield


@pytest.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function", autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture(scope="function")
async def db_session(setup_database) -> AsyncGenerator[AsyncSession, None]:
    async with AsyncTestingSessionLocal() as session:
        yield session


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncTestingSessionLocal() as session:
        yield session


app.dependency_overrides[original_get_db] = override_get_db


async def override_get_current_user_id(authorization: str | None = Header(None)) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1]
    return "default_user"


app.dependency_overrides[get_current_user_id] = override_get_current_user_id

# Monkeypatch AsyncSessionLocal in routers and services to use the test engine
import backend.routers.sessions
import backend.services.memory_service

backend.routers.sessions.AsyncSessionLocal = AsyncTestingSessionLocal
# Add more as needed


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
