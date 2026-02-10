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
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserSettings(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    google_api_key = Column(String, nullable=True)
    openai_api_key = Column(String, nullable=True)
    deepseek_api_key = Column(String, nullable=True)
    zhipu_api_key = Column(String, nullable=True)
    ai_provider = Column(String, default="gemini")
    ai_model = Column(String, nullable=True)
    ai_persona = Column(String, default="gentle_encourager")
    focus_duration = Column(Integer, default=25)
    short_break_duration = Column(Integer, default=5)
    long_break_duration = Column(Integer, default=15)
    long_break_interval = Column(Integer, default=4)
    ai_proactivity = Column(Boolean, default=True)
    ai_actionable = Column(Boolean, default=False)
    auto_start_next = Column(Boolean, default=False)
    active_theme_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class UserTheme(Base):
    __tablename__ = "user_themes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    theme_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    focus_duration = Column(Integer, nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LearningSession(Base):
    __tablename__ = "learning_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)  # ADDED
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)  # ADDED
    theme_name = Column(String, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    phase_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    ai_persona = Column(String)
    ai_proactivity = Column(Boolean)
    ai_actionable = Column(Boolean)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    topic = relationship("Topic", back_populates="learning_sessions")


class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    chat_history_entries = relationship("ChatHistory", back_populates="topic")
    learning_sessions = relationship("LearningSession", back_populates="topic")


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    session_id = Column(Integer, ForeignKey("learning_sessions.id"), nullable=True)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    topic = relationship("Topic", back_populates="chat_history_entries")


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
    user_id = Column(String, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)
    metadata_ = Column("metadata", JSONB().with_variant(JSON, "sqlite"), default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Countdown(Base):
    __tablename__ = "countdowns"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    target_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    topic_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    file_type = Column(String, nullable=False)
    file_path = Column(String, nullable=True)
    storage_key = Column(String, nullable=True)
    status = Column(String, default="ready")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DocumentReaderState(Base):
    __tablename__ = "document_reader_states"
    __table_args__ = (UniqueConstraint("user_id", "document_id", name="uq_user_document_reader_state"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    bookmarks = Column(JSONB().with_variant(JSON, "sqlite"), default=[])
    highlights = Column(JSONB().with_variant(JSON, "sqlite"), default=[])
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DocumentNotebook(Base):
    __tablename__ = "document_notebooks"
    __table_args__ = (UniqueConstraint("user_id", "document_id", name="uq_user_document_notebook"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    markdown = Column(Text, default="")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)  # 'milestone', 'challenge'
    target_type = Column(String, nullable=False)  # 'session_count', 'total_focus_time', etc.
    target_value = Column(Integer, nullable=False)
    is_hidden = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    current_progress = Column(Integer, default=0)
    status = Column(String, default="in_progress")  # 'in_progress', 'unlocked'
    unlocked_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    achievement = relationship("Achievement")
