# backend/tests/test_schemas.py
import pytest
from datetime import datetime, timezone
from backend.schemas import SessionCreate, SessionResponse


def test_session_create_with_ai_settings():
    session_data = {
        "theme_name": "test_theme",
        "duration_seconds": 1500,
        "phase_type": "focus",
        "status": "completed",
        "start_time": datetime.now(timezone.utc),
        "end_time": datetime.now(timezone.utc),
        "ai_persona": "hardcore_motivator",
        "ai_proactivity": False,
        "ai_actionable": True,
    }
    session_create = SessionCreate(**session_data)
    assert session_create.ai_persona == "hardcore_motivator"
    assert session_create.ai_proactivity is False
    assert session_create.ai_actionable is True


def test_session_response_with_ai_settings():
    session_data = {
        "id": 1,
        "theme_name": "test_theme",
        "duration_seconds": 1500,
        "phase_type": "focus",
        "status": "completed",
        "start_time": datetime.now(timezone.utc),
        "end_time": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
        "ai_persona": "gentle_encourager",
        "ai_proactivity": True,
        "ai_actionable": False,
    }
    session_response = SessionResponse(**session_data)
    assert session_response.ai_persona == "gentle_encourager"
    assert session_response.ai_proactivity is True
    assert session_response.ai_actionable is False
