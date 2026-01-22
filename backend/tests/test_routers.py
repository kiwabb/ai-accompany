# backend/tests/test_routers.py
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone, timedelta
from backend.main import app
from backend.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)


async def override_get_db():
    async with AsyncSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_create_and_update_session_via_api():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Create
        session_data = {
            "theme_name": "api_theme",
            "duration_seconds": 1500,
            "phase_type": "focus",
            "status": "completed",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "end_time": (
                datetime.now(timezone.utc) + timedelta(minutes=25)
            ).isoformat(),
            "ai_persona": "gentle_encourager",
            "ai_proactivity": True,
            "ai_actionable": False,
        }
        response = await ac.post("/api/sessions", json=session_data)
        assert response.status_code == 201
        created_session = response.json()
        assert created_session["ai_persona"] == "gentle_encourager"

        session_id = created_session["id"]

        # Patch (Update AI Settings)
        patch_data = {
            "theme_name": "api_theme",
            "duration_seconds": 1500,
            "phase_type": "focus",
            "status": "completed",
            "start_time": datetime.now(timezone.utc).isoformat(),
            "end_time": (
                datetime.now(timezone.utc) + timedelta(minutes=25)
            ).isoformat(),
            "ai_persona": "hardcore_motivator",
            "ai_proactivity": False,
        }
        response = await ac.patch(f"/api/sessions/{session_id}", json=patch_data)
        assert response.status_code == 200
        updated_session = response.json()
        assert updated_session["ai_persona"] == "hardcore_motivator"
        assert updated_session["ai_proactivity"] is False


@pytest.mark.asyncio
async def test_chat_completions_streaming():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        chat_data = {"message": "Hello AI"}
        response = await ac.post("/api/chat/completions", json=chat_data)
        assert response.status_code == 200

        # 验证流式响应
        content = ""
        async for chunk in response.aiter_text():
            content += chunk

        assert "Hello AI" in content
        assert "accompany" in content
