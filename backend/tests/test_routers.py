# backend/tests/test_routers.py
import pytest
from datetime import datetime, timezone, timedelta


@pytest.mark.asyncio
async def test_create_and_update_session_via_api(async_client):
    """Test creating a learning session and updating it via the API."""
    # Create
    session_data = {
        "theme_name": "api_theme",
        "duration_seconds": 1500,
        "phase_type": "focus",
        "status": "completed",
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": (datetime.now(timezone.utc) + timedelta(minutes=25)).isoformat(),
        "ai_persona": "gentle_encourager",
        "ai_proactivity": True,
        "ai_actionable": False,
    }
    headers = {"Authorization": "Bearer test_user"}
    response = await async_client.post(
        "/api/sessions", json=session_data, headers=headers
    )
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
        "end_time": (datetime.now(timezone.utc) + timedelta(minutes=25)).isoformat(),
        "ai_persona": "hardcore_motivator",
        "ai_proactivity": False,
    }
    response = await async_client.patch(
        f"/api/sessions/{session_id}", json=patch_data, headers=headers
    )
    assert response.status_code == 200
    updated_session = response.json()
    assert updated_session["ai_persona"] == "hardcore_motivator"
    assert updated_session["ai_proactivity"] is False


@pytest.mark.asyncio
async def test_chat_completions_streaming(async_client):
    """Test streaming chat completions via the API."""
    # Mocking the AI response is usually preferred, but here we test the endpoint's streaming capability.
    # We expect a mock response if Google API Key is not set, which is handled in the service.
    chat_data = {"message": "Hello AI"}
    response = await async_client.post("/api/chat/completions", json=chat_data)
    assert response.status_code == 200

    # Verify streaming response
    content = ""
    async for chunk in response.aiter_text():
        content += chunk

    # Depending on whether an actual API call is made or a mock is triggered
    assert len(content) > 0
