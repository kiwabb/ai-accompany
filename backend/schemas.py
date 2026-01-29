from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Dict, Optional


class UserSettingsBase(BaseModel):
    google_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    deepseek_api_key: Optional[str] = None
    zhipu_api_key: Optional[str] = None
    ai_provider: Optional[str] = "gemini"
    ai_model: Optional[str] = None
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
    """Schema for user settings response."""

    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ThemeBase(BaseModel):
    """Base schema for theme."""

    theme_id: str
    name: str
    focus_duration: int
    is_default: bool = False


class ThemeCreate(ThemeBase):
    """Schema for creating a theme."""

    pass


class ThemeResponse(ThemeBase):
    """Schema for theme response."""

    id: int
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


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
    """Schema for learning session response."""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyStats(BaseModel):
    """Schema for daily statistics."""

    date: str
    total_focus_minutes: int
    total_sessions: int
    sessions_by_theme: Dict[str, int]


class ChatContext(BaseModel):
    """Context information for chat requests."""

    theme_name: Optional[str] = "Focus"
    phase: Optional[str] = "focus"
    time_left: Optional[int] = 0
    language: Optional[str] = "en"
    ai_persona: Optional[str] = "gentle_encourager"
    daily_completed_pomodoros: Optional[int] = 0
    total_focus_minutes: Optional[int] = 0


class ChatRequest(BaseModel):
    """Schema for chat request."""

    message: str
    context: Optional[ChatContext] = None
    user_id: Optional[str] = "default_user"
    topic_id: Optional[int] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    document_id: Optional[int] = None
    document_title: Optional[str] = None
    document_content: Optional[str] = None


class ChatMessage(BaseModel):
    """Schema for a single chat message."""

    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatHistoryResponse(BaseModel):
    """Schema for chat history response."""

    messages: list[ChatMessage]


class TopicBase(BaseModel):
    """Base schema for topic."""

    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True


class TopicCreate(TopicBase):
    """Schema for creating a topic."""

    pass


class TopicResponse(TopicBase):
    """Schema for topic response."""

    id: int
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileBase(BaseModel):
    user_id: str
    data: Dict = {}


class UserProfileResponse(UserProfileBase):
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemoryFragmentBase(BaseModel):
    user_id: str
    topic_id: Optional[int] = None
    content: str
    metadata: Dict = Field(
        default={}, validation_alias="metadata_", serialization_alias="metadata"
    )


class MemoryFragmentCreate(MemoryFragmentBase):
    embedding: Optional[list[float]] = None


class MemoryFragmentResponse(MemoryFragmentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CountdownBase(BaseModel):
    title: str
    target_date: datetime


class CountdownCreate(CountdownBase):
    pass


class CountdownResponse(CountdownBase):
    id: int
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentBase(BaseModel):
    title: str
    filename: str
    file_type: str


class DocumentCreate(DocumentBase):
    content: str
    user_id: str


class DocumentResponse(DocumentBase):
    id: int
    user_id: str
    created_at: datetime
    # Content is excluded from list view by default in many designs, 
    # but strictly following schema inheritance here. 
    # Depending on select query, this might be partial or full.
    # For now, let's include it but use a separate schema for list if needed.
    
    model_config = ConfigDict(from_attributes=True)


class DocumentDetailResponse(DocumentResponse):
    content: str
