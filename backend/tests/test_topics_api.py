# backend/tests/test_topics_api.py
import pytest
from httpx import AsyncClient, ASGITransport
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
async def test_topic_crud():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        headers = {"Authorization": "Bearer test-user-123"}

        # 1. Create Topic
        topic_data = {
            "name": "Learning Rust",
            "description": "Mastering the Rust programming language.",
            "is_active": True,
        }
        response = await ac.post("/api/topics", json=topic_data, headers=headers)
        assert response.status_code == 201
        created_topic = response.json()
        assert created_topic["name"] == "Learning Rust"
        assert created_topic["user_id"] == "test-user-123"
        topic_id = created_topic["id"]

        # 2. Get Topics List
        response = await ac.get("/api/topics", headers=headers)
        assert response.status_code == 200
        topics = response.json()
        assert len(topics) >= 1
        assert any(t["id"] == topic_id for t in topics)

        # 3. Get Topic Detail
        response = await ac.get(f"/api/topics/{topic_id}", headers=headers)
        assert response.status_code == 200
        topic = response.json()
        assert topic["name"] == "Learning Rust"

        # 4. Update Topic
        update_data = {
            "name": "Learning Rust Advanced",
            "description": "Deep dive into Rust.",
            "is_active": False,
        }
        response = await ac.put(
            f"/api/topics/{topic_id}", json=update_data, headers=headers
        )
        assert response.status_code == 200
        updated_topic = response.json()
        assert updated_topic["name"] == "Learning Rust Advanced"
        assert updated_topic["is_active"] is False

        # 5. Delete Topic
        response = await ac.delete(f"/api/topics/{topic_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Topic deleted"

        # 6. Verify Deletion
        response = await ac.get(f"/api/topics/{topic_id}", headers=headers)
        assert response.status_code == 404
