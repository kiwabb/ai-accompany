from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    func,
    ForeignKey,
    Text,
)
from .database import Base


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    theme_name = Column(String, index=True, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    phase_type = Column(String, nullable=False)  # 'focus', 'shortBreak', 'longBreak'
    status = Column(String, nullable=False)  # 'completed', 'skipped', 'interrupted'
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # AI 聊天伴侣设置
    ai_persona = Column(String, default="gentle_encourager")
    ai_proactivity = Column(Boolean, default=True)
    ai_actionable = Column(Boolean, default=False)


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    # session_id can be null if chat happens outside a specific learning session (e.g. idle chat)
    session_id = Column(Integer, ForeignKey("learning_sessions.id"), nullable=True)
    role = Column(String, nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
