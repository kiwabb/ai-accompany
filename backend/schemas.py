from pydantic import BaseModel
from datetime import datetime
from typing import Dict


class SessionBase(BaseModel):
    theme_name: str
    duration_seconds: int
    phase_type: str  # 'focus', 'shortBreak', 'longBreak'
    status: str  # 'completed', 'skipped', 'interrupted'
    start_time: datetime
    end_time: datetime


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
