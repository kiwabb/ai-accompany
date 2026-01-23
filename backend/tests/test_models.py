# backend/tests/test_models.py
import pytest
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import selectinload
from backend.models import Base, Topic, LearningSession, ChatHistory
from sqlalchemy.future import select
from sqlalchemy import inspect

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
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
async def test_learning_session_model_has_ai_fields():
    # 模拟包含新 AI 字段的数据
    session_data = {
        "theme_name": "test_theme",
        "duration_seconds": 1500,
        "phase_type": "focus",
        "status": "completed",
        "start_time": datetime.now(timezone.utc),
        "end_time": datetime.now(timezone.utc),
        "ai_persona": "gentle_encourager",
        "ai_proactivity": True,
        "ai_actionable": False,
    }

    session = LearningSession(**session_data)

    # 检查字段是否存在
    mapper = inspect(LearningSession)
    assert "ai_persona" in mapper.columns
    assert "ai_proactivity" in mapper.columns
    assert "ai_actionable" in mapper.columns

    assert session.ai_persona == "gentle_encourager"
    assert session.ai_proactivity is True
    assert session.ai_actionable is False


@pytest.mark.asyncio
async def test_create_topic_model():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)  # Ensure tables are created

    async with AsyncSessionLocal() as session:
        user_id = "test_user_topic_1"
        topic_name = "Test Topic 1"
        description = "A topic for testing purposes."

        new_topic = Topic(user_id=user_id, name=topic_name, description=description)
        session.add(new_topic)
        await session.commit()
        await session.refresh(new_topic)

        # Verify creation
        assert new_topic.id is not None
        assert new_topic.user_id == user_id
        assert new_topic.name == topic_name
        assert new_topic.description == description
        assert new_topic.is_active is True
        assert new_topic.created_at is not None

        # Fetch and verify
        stmt = select(Topic).where(Topic.user_id == user_id, Topic.name == topic_name)
        result = await session.execute(stmt)
        fetched_topic = result.scalar_one_or_none()

        assert fetched_topic is not None
        assert fetched_topic.name == topic_name
        assert fetched_topic.description == description


@pytest.mark.asyncio
async def test_topic_relationships(db_session):
    user_id = "test_user_topic_rel"
    topic_name = "Relationship Topic"
    description = "Testing topic relationships."

    new_topic = Topic(user_id=user_id, name=topic_name, description=description)
    db_session.add(new_topic)
    await db_session.commit()
    await db_session.refresh(new_topic)

    # Create a LearningSession linked to the topic
    learning_session = LearningSession(
        theme_name="Learning Theme",
        duration_seconds=1500,
        phase_type="focus",
        status="completed",
        start_time=datetime.now(timezone.utc),
        end_time=datetime.now(timezone.utc),
        ai_persona="test_persona",
        ai_proactivity=True,
        ai_actionable=False,
        topic_id=new_topic.id,  # Link to topic
    )
    db_session.add(learning_session)
    await db_session.commit()
    await db_session.refresh(learning_session)

    # Create a ChatHistory entry linked to the topic
    chat_entry = ChatHistory(
        session_id=learning_session.id,
        role="user",
        content="Hello in a topic!",
        topic_id=new_topic.id,  # Link to topic
    )
    db_session.add(chat_entry)
    await db_session.commit()
    await db_session.refresh(chat_entry)

    # Fetch topic and verify relationships
    stmt = (
        select(Topic)
        .where(Topic.id == new_topic.id)
        .options(
            selectinload(Topic.learning_sessions),
            selectinload(Topic.chat_history_entries),
        )
    )
    result = await db_session.execute(stmt)
    fetched_topic = result.scalar_one()

    assert fetched_topic.learning_sessions[0].id == learning_session.id
    assert fetched_topic.chat_history_entries[0].id == chat_entry.id

    # Verify relationships from the other side
    fetched_session = await db_session.get(
        LearningSession,
        learning_session.id,
        options=[selectinload(LearningSession.topic)],
    )
    assert fetched_session.topic.id == new_topic.id

    fetched_chat = await db_session.get(
        ChatHistory, chat_entry.id, options=[selectinload(ChatHistory.topic)]
    )
    assert fetched_chat.topic.id == new_topic.id
