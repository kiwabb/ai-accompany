from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    func,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"
    user_id = Column(String, primary_key=True, index=True)
    data = Column(JSONB().with_variant(JSON, "sqlite"), default={})
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class MemoryFragment(Base):
    __tablename__ = "memory_fragments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536))
    metadata_ = Column("metadata", JSONB().with_variant(JSON, "sqlite"), default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        String, unique=True, index=True, nullable=False
    )  # Assuming user_id is a string from an auth provider
    google_api_key = Column(String, nullable=True)
    ai_persona = Column(String, default="gentle_encourager")
    focus_duration = Column(Integer, default=25)
    short_break_duration = Column(Integer, default=5)
    long_break_duration = Column(Integer, default=15)
    long_break_interval = Column(Integer, default=4)
    ai_proactivity = Column(Boolean, default=True)
    ai_actionable = Column(Boolean, default=False)
    auto_start_next = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now()
    )


class UserTheme(Base):
    __tablename__ = "user_themes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    theme_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    focus_duration = Column(Integer, default=25)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Topic(Base):
    """
    Represents a learning topic that user-defined learning sessions and chat history
    can be categorized under.
    """

    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    learning_sessions = relationship("LearningSession", back_populates="topic")
    chat_history_entries = relationship("ChatHistory", back_populates="topic")


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
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    topic = relationship("Topic", back_populates="learning_sessions")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    # session_id can be null if chat happens outside a specific learning session (e.g. idle chat)
    session_id = Column(Integer, ForeignKey("learning_sessions.id"), nullable=True)
    role = Column(String, nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    topic = relationship("Topic", back_populates="chat_history_entries")
