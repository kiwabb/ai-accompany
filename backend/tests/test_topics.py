# backend/tests/test_topics.py
import pytest
from datetime import datetime, timezone
from backend.models import Topic, LearningSession, ChatHistory
from sqlalchemy.future import select


@pytest.mark.asyncio
async def test_create_topic_model(db_session):
    """
    Test the creation of a Topic model and its persistence in the database.
    """
    user_id = "test_user_topic_1"
    topic_name = "Test Topic 1"
    description = "A topic for testing purposes."

    new_topic = Topic(user_id=user_id, name=topic_name, description=description)
    db_session.add(new_topic)
    await db_session.commit()
    await db_session.refresh(new_topic)

    # Verify creation
    assert new_topic.id is not None
    assert new_topic.user_id == user_id
    assert new_topic.name == topic_name
    assert new_topic.description == description
    assert new_topic.is_active is True
    assert new_topic.created_at is not None

    # Fetch and verify
    stmt = select(Topic).where(Topic.user_id == user_id, Topic.name == topic_name)
    result = await db_session.execute(stmt)
    fetched_topic = result.scalar_one_or_none()

    assert fetched_topic is not None
    assert fetched_topic.name == topic_name
    assert fetched_topic.description == description


from sqlalchemy.orm import selectinload


@pytest.mark.asyncio
async def test_topic_relationships(db_session):
    """
    Test the relationships between Topic, LearningSession, and ChatHistory.
    """
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

    # Fetch topic with relationships and verify
    stmt = (
        select(Topic)
        .where(Topic.id == new_topic.id)
        .options(
            selectinload(Topic.learning_sessions),
            selectinload(Topic.chat_history_entries),
        )
    )
    result = await db_session.execute(stmt)
    fetched_topic = result.scalar()

    assert fetched_topic.learning_sessions[0].id == learning_session.id
    assert fetched_topic.chat_history_entries[0].id == chat_entry.id

    # Verify relationships from the other side
    stmt_session = (
        select(LearningSession)
        .where(LearningSession.id == learning_session.id)
        .options(selectinload(LearningSession.topic))
    )
    result_session = await db_session.execute(stmt_session)
    fetched_session = result_session.scalar()
    assert fetched_session.topic.id == new_topic.id

    stmt_chat = (
        select(ChatHistory)
        .where(ChatHistory.id == chat_entry.id)
        .options(selectinload(ChatHistory.topic))
    )
    result_chat = await db_session.execute(stmt_chat)
    fetched_chat = result_chat.scalar()
    assert fetched_chat.topic.id == new_topic.id
