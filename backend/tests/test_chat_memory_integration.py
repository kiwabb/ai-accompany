import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from backend.services.chat_service import chat_service
from backend.services.memory_service import memory_service
from backend import models, schemas
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.database import get_db

# Use a file-based SQLite database for testing to ensure shared state between fixtures
DATABASE_URL = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(DATABASE_URL, echo=True)
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


app.dependency_overrides[get_db] = override_get_db

# Also override AsyncSessionLocal in the router to use the test engine
import backend.routers.sessions

backend.routers.sessions.AsyncSessionLocal = AsyncTestingSessionLocal


@pytest.mark.asyncio
async def test_chat_service_memory_injection(db_session: AsyncSession):
    # 1. Setup mock memory data
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
    # We need to mock the embedding for the fragment
    fragment = models.MemoryFragment(
        user_id=user_id,
        content="The user previously mentioned they are working on a project named 'CozyPal'.",
        embedding=[0.1] * 1536,
        metadata_={"type": "past_mention"},
    )
    db_session.add(fragment)
    await db_session.commit()

    # 2. Mock memory service's search and embedding
    # We want to ensure search_memory returns our fragment
    with patch.object(
        memory_service, "search_memory", new_callable=AsyncMock
    ) as mock_search:
        mock_search.return_value = [fragment]

        # 3. Mock the AI provider to capture the system prompt
        provider = chat_service._providers["gemini"]
        with patch.object(
            provider, "stream_chat", new_callable=MagicMock
        ) as mock_stream:
            # mock_stream needs to return an async generator
            async def mock_gen(*args, **kwargs):
                yield "Response from AI"

            mock_stream.return_value = mock_gen()

            # 4. Execute stream_chat
            message = "Tell me about my project."
            system_prompt = "You are a helpful assistant."

            chunks = []
            async for chunk in chat_service.stream_chat(
                message, system_prompt, db=db_session, user_id=user_id
            ):
                chunks.append(chunk)

            # 5. Verify augmented system prompt
            call_args = mock_stream.call_args
            passed_system_prompt = call_args[0][1]  # Second positional argument

            assert "User is a Python developer" in passed_system_prompt
            assert "User likes dark mode" in passed_system_prompt
            assert "working on a project named 'CozyPal'" in passed_system_prompt
            assert "You are a helpful assistant." in passed_system_prompt


@pytest.mark.asyncio
async def test_router_memory_extraction_trigger(db_session: AsyncSession):
    # This test verifies that the router calls process_exchange
    # We'll use the AsyncClient to call the endpoint

    user_id = "router_test_user"
    message = "I just finished the integration test."

    # Mock AIChatService.stream_chat to avoid actual AI calls
    with patch("backend.routers.sessions.chat_service.stream_chat") as mock_chat:

        async def mock_gen(*args, **kwargs):
            yield "Great job!"

        mock_chat.return_value = mock_gen()

        # Mock memory_service.process_exchange
        with patch(
            "backend.routers.sessions.memory_service.process_exchange",
            new_callable=AsyncMock,
        ) as mock_process:
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as ac:
                chat_data = {"message": message, "user_id": user_id, "topic_id": 1}
                response = await ac.post("/api/chat/completions", json=chat_data)
                assert response.status_code == 200

                # Consume the stream to trigger the background task
                async for _ in response.aiter_text():
                    pass

                # Wait a bit for background tasks to potentially run
                # In FastAPI, background tasks run after the response is sent.
                # In tests with ASGITransport, they usually run before AsyncClient returns if it's not a real server,
                # but let's be safe.
                await asyncio.sleep(0.1)

                # Verify process_exchange was called
                mock_process.assert_called_once()
                args = mock_process.call_args.kwargs
                assert args["user_id"] == user_id
                assert args["user_msg"] == message
                assert args["ai_msg"] == "Great job!"
                assert args["topic_id"] == 1


import asyncio
