from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from . import models, schemas
from datetime import date
from typing import Dict, List, Optional


async def create_session(db: AsyncSession, session_in: schemas.SessionCreate):
    db_session = models.LearningSession(**session_in.model_dump())
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session


async def update_session(db: AsyncSession, session_id: int, session_data: dict):
    stmt = (
        update(models.LearningSession)
        .where(models.LearningSession.id == session_id)
        .values(**session_data)
    )
    await db.execute(stmt)
    await db.commit()
    result = await db.execute(
        select(models.LearningSession).where(models.LearningSession.id == session_id)
    )
    return result.scalar_one_or_none()


async def get_daily_stats(
    db: AsyncSession, target_date: date
) -> Optional[schemas.DailyStats]:
    # 计算总专注分钟数 (只计算 phase_type == 'focus' 的 session)
    total_focus_seconds_result = await db.execute(
        select(func.sum(models.LearningSession.duration_seconds)).where(
            func.date(models.LearningSession.start_time) == target_date,
            models.LearningSession.phase_type == "focus",
        )
    )
    total_focus_seconds = total_focus_seconds_result.scalar_one_or_none() or 0
    total_focus_minutes = round(total_focus_seconds / 60)

    # 计算总会话数 (所有类型的 session)
    total_sessions_result = await db.execute(
        select(func.count(models.LearningSession.id)).where(
            func.date(models.LearningSession.start_time) == target_date
        )
    )
    total_sessions = total_sessions_result.scalar_one_or_none() or 0

    # 按主题统计专注分钟数
    sessions_by_theme_result = await db.execute(
        select(
            models.LearningSession.theme_name,
            func.sum(models.LearningSession.duration_seconds),
        )
        .where(
            func.date(models.LearningSession.start_time) == target_date,
            models.LearningSession.phase_type == "focus",
        )
        .group_by(models.LearningSession.theme_name)
    )
    sessions_by_theme: Dict[str, int] = {
        row.theme_name: round(row.sum / 60) for row in sessions_by_theme_result.all()
    }


async def create_chat_message(
    db: AsyncSession, role: str, content: str, session_id: Optional[int] = None
):
    db_message = models.ChatHistory(role=role, content=content, session_id=session_id)
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message


async def get_recent_chat_history(db: AsyncSession, limit: int = 50):
    result = await db.execute(
        select(models.ChatHistory)
        .order_by(models.ChatHistory.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()[::-1]  # Return in chronological order
