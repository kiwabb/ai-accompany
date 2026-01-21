from sqlalchemy import Column, Integer, String, DateTime, func
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
