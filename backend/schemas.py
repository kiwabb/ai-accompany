from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Optional


class SessionBase(BaseModel):
    theme_name: str
    duration_seconds: int
    phase_type: str  # 'focus', 'shortBreak', 'longBreak'
    status: str  # 'completed', 'skipped', 'interrupted'
    start_time: datetime
    end_time: datetime

    # AI 聊天伴侣设置
    ai_persona: Optional[str] = "gentle_encourager"
    ai_proactivity: Optional[bool] = True
    ai_actionable: Optional[bool] = False


class SessionCreate(SessionBase):
    pass


class SessionResponse(SessionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2


class DailyStats(BaseModel):
    date: str
    total_focus_minutes: int
    total_sessions: int
    sessions_by_theme: Dict[str, int]
