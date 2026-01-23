# backend/tests/conftest.py
import pytest
import os
from datetime import datetime, timezone
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from backend.database import Base, get_db as original_get_db
from backend.models import (
    UserSettings,
    UserTheme,
    LearningSession,
    ChatHistory,
    Topic,
    UserProfile,
    MemoryFragment,
)
from backend.main import app
from fastapi import Depends
from httpx import AsyncClient, ASGITransport

# Use an in-memory SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=False)
TestAsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(autouse=True)
async def setup_db() -> AsyncGenerator[None, None]:
    """
    Sets up an in-memory SQLite database for each test, creating and dropping tables.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)  # Create tables

    yield  # Run the tests

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)  # Drop tables


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides an independent, rollback-enabled session per test.
    """
    async with TestAsyncSessionLocal() as session:
        yield session
        await session.rollback()  # Ensure tests are isolated


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Overrides the application's get_db dependency to use the test database.
    """
    async with TestAsyncSessionLocal() as session:
        yield session


app.dependency_overrides[original_get_db] = override_get_db


@pytest.fixture(scope="module")
async def async_client():
    """
    Provides an AsyncClient for testing FastAPI endpoints.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
