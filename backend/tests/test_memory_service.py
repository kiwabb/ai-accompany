import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.services.memory_service import MemoryService
from backend import models


@pytest.mark.asyncio
async def test_process_exchange(db_session: AsyncSession):
    # Setup
    user_id = "test_user"
    topic_id = None
    user_msg = "I am learning Rust and I like concise explanations."
    ai_msg = "That's great! Rust is a powerful language."

    service = MemoryService()

    # Mock extraction response
    mock_response = MagicMock()
    mock_response.text = json.dumps(
        {
            "facts": ["User is learning Rust"],
            "preferences": ["User likes concise explanations"],
            "emotional_state": "Interested",
        }
    )

    # Mock the new SDK client.aio.models.generate_content
    with patch.object(
        service.client.aio.models, "generate_content", new_callable=AsyncMock
    ) as mock_gen:
        mock_gen.return_value = mock_response

        # Mock embedding call client.aio.models.embed_content
        with patch.object(
            service.client.aio.models, "embed_content", new_callable=AsyncMock
        ) as mock_embed:
            # New SDK returns a response with embeddings[0].values
            mock_embed_resp = MagicMock()
            mock_embed_resp.embeddings = [MagicMock(values=[0.1] * 1536)]
            mock_embed.return_value = mock_embed_resp

            # Execute
            fragment = await service.process_exchange(
                user_id, topic_id, user_msg, ai_msg, db_session
            )

            # Verify Fragment
            assert fragment.user_id == user_id
            assert "User: I am learning Rust" in fragment.content
            assert len(fragment.embedding) == 1536
            assert fragment.metadata_["extracted_facts"] == ["User is learning Rust"]
            assert fragment.metadata_["extracted_emotional_state"] == "Interested"

            # Verify UserProfile update
            result = await db_session.execute(
                select(models.UserProfile).where(models.UserProfile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
            assert profile is not None
            assert "User is learning Rust" in profile.data["facts"]
            assert "User likes concise explanations" in profile.data["preferences"]
            assert profile.data["last_emotional_state"] == "Interested"


@pytest.mark.asyncio
async def test_process_exchange_merge_data(db_session: AsyncSession):
    # Setup existing profile
    user_id = "test_user_2"
    existing_profile = models.UserProfile(
        user_id=user_id,
        data={
            "facts": ["User lives in Tokyo"],
            "preferences": ["User likes coffee"],
            "last_emotional_state": "Happy",
        },
    )
    db_session.add(existing_profile)
    await db_session.commit()

    user_msg = "I also like tea and I'm learning Python."
    ai_msg = "Python is great too!"

    service = MemoryService()

    mock_response = MagicMock()
    mock_response.text = json.dumps(
        {
            "facts": ["User is learning Python"],
            "preferences": ["User likes tea"],
            "emotional_state": "Excited",
        }
    )

    with patch.object(
        service.client.aio.models, "generate_content", new_callable=AsyncMock
    ) as mock_gen:
        mock_gen.return_value = mock_response
        with patch.object(
            service.client.aio.models, "embed_content", new_callable=AsyncMock
        ) as mock_embed:
            mock_embed_resp = MagicMock()
            mock_embed_resp.embeddings = [MagicMock(values=[0.2] * 1536)]
            mock_embed.return_value = mock_embed_resp

            await service.process_exchange(user_id, None, user_msg, ai_msg, db_session)

            # Verify merged data
            result = await db_session.execute(
                select(models.UserProfile).where(models.UserProfile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
            assert "User lives in Tokyo" in profile.data["facts"]
            assert "User is learning Python" in profile.data["facts"]
            assert "User likes coffee" in profile.data["preferences"]
            assert "User likes tea" in profile.data["preferences"]
            assert profile.data["last_emotional_state"] == "Excited"


@pytest.mark.asyncio
async def test_extract_memory_invalid_json():
    service = MemoryService()
    user_msg = "test"
    ai_msg = "test"

    mock_response = MagicMock()
    mock_response.text = "Invalid JSON"

    with patch.object(
        service.client.aio.models, "generate_content", new_callable=AsyncMock
    ) as mock_gen:
        mock_gen.return_value = mock_response

        # This should return {} and log an error
        result = await service._extract_memory(user_msg, ai_msg)
        assert result == {}


@pytest.mark.asyncio
async def test_extract_memory_api_error():
    service = MemoryService()

    with patch.object(
        service.client.aio.models,
        "generate_content",
        side_effect=Exception("API Error"),
    ):
        result = await service._extract_memory("test", "test")
        assert result == {}


@pytest.mark.asyncio
async def test_generate_embedding_api_error():
    service = MemoryService()

    with patch.object(
        service.client.aio.models,
        "embed_content",
        side_effect=Exception("Embedding Error"),
    ):
        embedding = await service.generate_embedding("test")
        assert len(embedding) == 1536
        assert all(v == 0.0 for v in embedding)


@pytest.mark.asyncio
async def test_extract_memory_missing_keys(db_session: AsyncSession):
    service = MemoryService()

    mock_response = MagicMock()
    # Missing 'emotional_state'
    mock_response.text = json.dumps({"facts": ["fact"], "preferences": ["pref"]})

    with patch.object(
        service.client.aio.models, "generate_content", new_callable=AsyncMock
    ) as mock_gen:
        mock_gen.return_value = mock_response

        with patch.object(
            service.client.aio.models, "embed_content", new_callable=AsyncMock
        ) as mock_embed:
            mock_embed_resp = MagicMock()
            mock_embed_resp.embeddings = [MagicMock(values=[0.1] * 1536)]
            mock_embed.return_value = mock_embed_resp

            fragment = await service.process_exchange(
                "user1", None, "hi", "hello", db_session
            )
            assert fragment.metadata_["extracted_facts"] == ["fact"]
            assert fragment.metadata_["extracted_emotional_state"] == ""
