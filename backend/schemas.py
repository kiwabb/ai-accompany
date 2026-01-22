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


class TimerContext(BaseModel):
    theme_name: Optional[str] = "Focus"
    phase: Optional[str] = "focus"
    time_left: Optional[int] = 0
    language: Optional[str] = "en"
    ai_persona: Optional[str] = "gentle_encourager"


class ChatRequest(BaseModel):
    message: str
    context: Optional[TimerContext] = None


class ChatMessage(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessage]
