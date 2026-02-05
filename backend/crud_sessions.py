from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from . import models, schemas
from typing import Optional


async def create_session(
    db: AsyncSession, session_in: schemas.SessionCreate, user_id: str
):
    db_session = models.LearningSession(**session_in.model_dump(), user_id=user_id)
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


async def create_chat_message(
    db: AsyncSession,
    role: str,
    content: str,
    user_id: str,
    session_id: Optional[int] = None,
    topic_id: Optional[int] = None,
):
    db_message = models.ChatHistory(
        role=role,
        content=content,
        user_id=user_id,
        session_id=session_id,
        topic_id=topic_id,
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message


async def get_recent_chat_history(
    db: AsyncSession, user_id: str, limit: int = 50, topic_id: Optional[int] = None
):
    stmt = (
        select(models.ChatHistory)
        .where(models.ChatHistory.user_id == user_id)
        .order_by(models.ChatHistory.created_at.desc())
    )
    if topic_id is not None:
        stmt = stmt.where(models.ChatHistory.topic_id == topic_id)

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()[::-1]  # Return in chronological order
