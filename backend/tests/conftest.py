import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.database import Base, get_db
from backend.models import (
    LearningSession,
    ChatHistory,
    UserSettings,
    UserTheme,
    Topic,
)  # Import all models
import asyncio

# Use a file-based SQLite database for testing to ensure shared state between fixtures
DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function", autouse=True)
async def setup_database():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncTestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with AsyncTestingSessionLocal() as session:
            yield session

    # You might need to patch get_db in your main application if you're running FastAPI tests
    # For standalone model tests, this fixture alone is enough to provide a session

    yield  # This will run tests

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def db_session(setup_database):
    engine = create_async_engine(DATABASE_URL)
    AsyncTestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with AsyncTestingSessionLocal() as session:
        yield session
        # Clean up data after each test
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()
