from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Dict, Optional


class UserSettingsBase(BaseModel):
    google_api_key: Optional[str] = None
    ai_persona: Optional[str] = "gentle_encourager"
    focus_duration: Optional[int] = 25
    short_break_duration: Optional[int] = 5
    long_break_duration: Optional[int] = 15
    long_break_interval: Optional[int] = 4
    ai_proactivity: Optional[bool] = True
    ai_actionable: Optional[bool] = False
    auto_start_next: Optional[bool] = False


class UserSettingsCreate(UserSettingsBase):
    user_id: str


class UserSettingsResponse(UserSettingsBase):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ThemeBase(BaseModel):
    theme_id: str
    name: str
    focus_duration: int
    is_default: bool = False


class ThemeCreate(ThemeBase):
    pass


class ThemeResponse(ThemeBase):
    id: int
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


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


class ChatContext(BaseModel):
    theme_name: Optional[str] = "Focus"
    phase: Optional[str] = "focus"
    time_left: Optional[int] = 0
    language: Optional[str] = "en"
    ai_persona: Optional[str] = "gentle_encourager"
    daily_completed_pomodoros: Optional[int] = 0
    total_focus_minutes: Optional[int] = 0


class ChatRequest(BaseModel):
    message: str
    context: Optional[ChatContext] = None


class ChatMessage(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessage]


class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True


class TopicCreate(TopicBase):
    pass


class TopicResponse(TopicBase):
    id: int
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
