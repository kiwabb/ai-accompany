# backend/tests/test_crud.py
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, LearningSession
from backend.schemas import SessionCreate
from backend.crud import create_session  # Assuming update_session will be added

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)


@pytest.fixture(name="db_session")
async def db_session_fixture():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_create_and_update_session_ai_settings(db_session: AsyncSession):
    # Create
    session_data = SessionCreate(
        theme_name="test_theme",
        duration_seconds=1500,
        phase_type="focus",
        status="completed",
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc) + timedelta(minutes=25),
        ai_persona="gentle_encourager",
        ai_proactivity=True,
        ai_actionable=False,
    )
    created_session = await create_session(
        db_session, session_data, user_id="test_user"
    )
    assert created_session.ai_persona == "gentle_encourager"
    assert created_session.ai_proactivity is True

    # Update (This part will fail until update_session is implemented and imported)
    from backend.crud import update_session

    update_data = {"ai_persona": "hardcore_motivator", "ai_proactivity": False}
    updated_session = await update_session(db_session, created_session.id, update_data)

    assert updated_session.ai_persona == "hardcore_motivator"
    assert updated_session.ai_proactivity is False
    assert updated_session.theme_name == "test_theme"  # Ensure original fields remain
