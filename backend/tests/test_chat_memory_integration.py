# backend/tests/test_chat_memory_integration.py
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.chat_service import chat_service
from backend.services.memory_service import memory_service
from backend import models


@pytest.mark.asyncio
async def test_chat_service_memory_injection(db_session: AsyncSession):
    """Test that chat service correctly retrieves and injects memory into the prompt."""
    user_id = "test_user_memory"

    # Create a user profile
    profile = models.UserProfile(
        user_id=user_id,
        data={
            "facts": ["User is a Python developer"],
            "preferences": ["User likes dark mode"],
        },
    )
    db_session.add(profile)

    # Create a memory fragment
    fragment = models.MemoryFragment(
        user_id=user_id,
        content="The user previously mentioned they are working on a project named 'CozyPal'.",
        embedding=[0.1] * 1536,
        metadata_={"type": "past_mention"},
    )
    db_session.add(fragment)
    await db_session.commit()

    # Mock memory service's search and embedding
    with patch.object(
        memory_service, "search_memory", new_callable=AsyncMock
    ) as mock_search:
        mock_search.return_value = [fragment]

        # Mock the AI provider to capture the system prompt
        provider = chat_service._providers["gemini"]
        with patch.object(
            provider, "stream_chat", new_callable=MagicMock
        ) as mock_stream:

            async def mock_gen(*args, **kwargs):
                yield "Response from AI"

            mock_stream.return_value = mock_gen()

            message = "Tell me about my project."
            system_prompt = "You are a helpful assistant."

            chunks = []
            async for chunk in chat_service.stream_chat(
                message, system_prompt, db=db_session, user_id=user_id
            ):
                chunks.append(chunk)

            # Verify augmented system prompt
            call_args = mock_stream.call_args
            passed_system_prompt = call_args[0][1]

            assert "User is a Python developer" in passed_system_prompt
            assert "User likes dark mode" in passed_system_prompt
            assert "working on a project named 'CozyPal'" in passed_system_prompt
            assert "You are a helpful assistant." in passed_system_prompt


@pytest.mark.asyncio
async def test_router_memory_extraction_trigger(async_client):
    """Test that the chat router triggers memory extraction as a background task."""
    user_id = "router_test_user"
    message = "I just finished the integration test."

    # Mock AIChatService.stream_chat
    with patch("backend.routers.sessions.chat_service.stream_chat") as mock_chat:

        async def mock_gen(*args, **kwargs):
            yield "Great job!"

        mock_chat.return_value = mock_gen()

        # Mock memory_service.process_exchange
        with patch(
            "backend.routers.sessions.memory_service.process_exchange",
            new_callable=AsyncMock,
        ) as mock_process:
            chat_data = {"message": message, "user_id": user_id, "topic_id": 1}
            headers = {"Authorization": f"Bearer {user_id}"}
            response = await async_client.post(
                "/api/chat/completions", json=chat_data, headers=headers
            )
            assert response.status_code == 200

            # Consume the stream
            async for _ in response.aiter_text():
                pass

            await asyncio.sleep(0.1)

            # Verify process_exchange was called
            mock_process.assert_called_once()
            args = mock_process.call_args.kwargs
            assert args["user_id"] == user_id
            assert args["user_msg"] == message
            assert args["ai_msg"] == "Great job!"
            assert args["topic_id"] == 1
