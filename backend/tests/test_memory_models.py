import pytest
from backend.models import UserProfile, MemoryFragment, Topic
from backend.schemas import MemoryFragmentResponse


@pytest.mark.asyncio
async def test_create_user_profile(db_session):
    user_id = "test_user_123"
    profile_data = {
        "preferences": {"theme": "dark"},
        "milestones": ["started_learning"],
        "habits": {"daily_goal": 30},
    }

    profile = UserProfile(user_id=user_id, data=profile_data)
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)

    assert profile.user_id == user_id
    assert profile.data["preferences"]["theme"] == "dark"
    assert profile.updated_at is not None


@pytest.mark.asyncio
async def test_create_memory_fragment(db_session):
    user_id = "test_user_123"
    content = "This is a test memory fragment."
    embedding = [0.1] * 1536
    metadata = {"source": "chat"}

    topic = Topic(user_id=user_id, name="Python")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    fragment = MemoryFragment(
        user_id=user_id,
        topic_id=topic.id,
        content=content,
        embedding=embedding,
        metadata_=metadata,
    )
    db_session.add(fragment)
    await db_session.commit()
    await db_session.refresh(fragment)

    assert fragment.id is not None
    assert fragment.user_id == user_id
    assert fragment.content == content
    assert len(fragment.embedding) == 1536
    assert fragment.metadata_["source"] == "chat"
    assert fragment.topic_id == topic.id


@pytest.mark.asyncio
async def test_memory_fragment_schema_mapping(db_session):
    user_id = "test_user_123"
    content = "Schema mapping test."
    metadata = {"source": "test"}

    fragment = MemoryFragment(user_id=user_id, content=content, metadata_=metadata)
    db_session.add(fragment)
    await db_session.commit()
    await db_session.refresh(fragment)

    # Test ORM to Schema mapping
    response = MemoryFragmentResponse.model_validate(fragment)
    assert response.metadata == metadata

    # Test JSON serialization
    json_data = response.model_dump(mode="json")
    assert "metadata" in json_data
    assert json_data["metadata"] == metadata
