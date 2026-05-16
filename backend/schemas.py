from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Dict, Optional, List


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


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
    active_theme_id: Optional[str] = None


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
    icon_type: Optional[str] = None


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


class SessionUpdate(BaseModel):
    theme_name: Optional[str] = None
    duration_seconds: Optional[int] = None
    phase_type: Optional[str] = None
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    ai_persona: Optional[str] = None
    ai_proactivity: Optional[bool] = None
    ai_actionable: Optional[bool] = None


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
    topic_id: Optional[str] = None
    status: Optional[str] = "ready"


class DocumentCreate(DocumentBase):
    content: str
    user_id: str


class DocumentUploadRequest(BaseModel):
    filename: str
    content_type: str
    title: str
    topic_id: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    topic_id: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    document_id: int
    presigned_url: str
    storage_key: str


class DocumentResponse(DocumentBase):
    id: int
    user_id: str
    storage_key: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class DocumentDetailResponse(DocumentResponse):
    content: str


class ReaderBookmark(BaseModel):
    id: str
    page: int
    createdAt: str
    note: Optional[str] = None
    fullText: Optional[str] = None
    linkedHighlightId: Optional[str] = None


class ReaderHighlightRect(BaseModel):
    left: float
    top: float
    width: float
    height: float


class ReaderHighlight(BaseModel):
    id: str
    page: int
    rects: List[ReaderHighlightRect]
    createdAt: str
    text: Optional[str] = None
    linkedBookmarkId: Optional[str] = None


class DocumentReaderStateUpdate(BaseModel):
    bookmarks: List[ReaderBookmark] = []
    highlights: List[ReaderHighlight] = []


class DocumentReaderStateResponse(DocumentReaderStateUpdate):
    document_id: int


class DocumentNotebookUpdate(BaseModel):
    markdown: str = ""


class DocumentNotebookResponse(DocumentNotebookUpdate):
    document_id: int


class AchievementBase(BaseModel):
    key: str
    name: str
    description: str
    category: str
    target_type: str
    target_value: int
    is_hidden: bool = False


class AchievementResponse(AchievementBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserAchievementBase(BaseModel):
    achievement_id: int
    current_progress: int
    status: str
    unlocked_at: Optional[datetime] = None


class UserAchievementResponse(UserAchievementBase):
    id: int
    user_id: str
    updated_at: datetime
    achievement: AchievementResponse

    model_config = ConfigDict(from_attributes=True)


class StatsRangeResponse(BaseModel):
    total_focus_minutes: int
    total_sessions: int
    daily_stats: List[DailyStats]
    sessions_by_theme: Dict[str, int]
    sessions_details: List[SessionResponse]
