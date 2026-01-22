# backend/tests/test_models.py
import pytest
from datetime import datetime, timezone
from backend.models import LearningSession
from sqlalchemy import inspect


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
