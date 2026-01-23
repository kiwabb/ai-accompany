# backend/tests/test_models.py
import pytest
from datetime import datetime, timezone
from backend.models import Topic, LearningSession, ChatHistory
from sqlalchemy.future import select
from sqlalchemy import inspect


@pytest.mark.asyncio
async def test_learning_session_model_has_ai_fields(db_session):
    """
    Test that LearningSession model correctly stores and retrieves AI-related fields.
    """
    # Simulate data containing new AI fields
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
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)

    # Check if fields exist and have correct values
    mapper = inspect(LearningSession)
    assert "ai_persona" in mapper.columns
    assert "ai_proactivity" in mapper.columns
    assert "ai_actionable" in mapper.columns

    assert session.ai_persona == "gentle_encourager"
    assert session.ai_proactivity is True
    assert session.ai_actionable is False
