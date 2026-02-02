from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from . import models, schemas
from datetime import date
from typing import Dict, List, Optional


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
            func.sum(models.LearningSession.duration_seconds).label("total_seconds"),
        )
        .where(
            func.date(models.LearningSession.start_time) == target_date,
            models.LearningSession.phase_type == "focus",
        )
        .group_by(models.LearningSession.theme_name)
    )
    sessions_by_theme: Dict[str, int] = {
        row.theme_name: round(row.total_seconds / 60)
        for row in sessions_by_theme_result.all()
    }

    return schemas.DailyStats(
        date=target_date.isoformat(),
        total_focus_minutes=total_focus_minutes,
        total_sessions=total_sessions,
        sessions_by_theme=sessions_by_theme,
    )


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


async def get_user_settings(
    db: AsyncSession, user_id: str
) -> Optional[models.UserSettings]:
    result = await db.execute(
        select(models.UserSettings).where(models.UserSettings.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def upsert_user_settings(
    db: AsyncSession, user_id: str, settings_in: schemas.UserSettingsBase
) -> models.UserSettings:
    existing_settings = await get_user_settings(db, user_id)

    if existing_settings:
        update_data = settings_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing_settings, key, value)
        db.add(existing_settings)
        await db.commit()
        await db.refresh(existing_settings)
        return existing_settings
    else:
        new_settings = models.UserSettings(**settings_in.model_dump(), user_id=user_id)
        db.add(new_settings)
        await db.commit()
        await db.refresh(new_settings)
        return new_settings


async def get_user_themes(db: AsyncSession, user_id: str) -> List[models.UserTheme]:
    result = await db.execute(
        select(models.UserTheme).where(models.UserTheme.user_id == user_id)
    )
    return list(result.scalars().all())


async def create_user_theme(
    db: AsyncSession, user_id: str, theme_in: schemas.ThemeCreate
) -> models.UserTheme:
    db_theme = models.UserTheme(**theme_in.model_dump(), user_id=user_id)
    db.add(db_theme)
    await db.commit()
    await db.refresh(db_theme)
    return db_theme


async def delete_user_theme(db: AsyncSession, user_id: str, theme_id: str) -> bool:
    result = await db.execute(
        select(models.UserTheme).where(
            models.UserTheme.user_id == user_id, models.UserTheme.theme_id == theme_id
        )
    )
    db_theme = result.scalar_one_or_none()
    if db_theme:
        await db.delete(db_theme)
        await db.commit()
        return True
    return False


async def get_topics(db: AsyncSession, user_id: str) -> List[models.Topic]:
    result = await db.execute(
        select(models.Topic).where(models.Topic.user_id == user_id)
    )
    return list(result.scalars().all())


async def get_topic(
    db: AsyncSession, topic_id: int, user_id: str
) -> Optional[models.Topic]:
    result = await db.execute(
        select(models.Topic).where(
            models.Topic.id == topic_id, models.Topic.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_topic(
    db: AsyncSession, user_id: str, topic_in: schemas.TopicCreate
) -> models.Topic:
    db_topic = models.Topic(**topic_in.model_dump(), user_id=user_id)
    db.add(db_topic)
    await db.commit()
    await db.refresh(db_topic)
    return db_topic


async def update_topic(
    db: AsyncSession, topic_id: int, user_id: str, topic_in: schemas.TopicCreate
) -> Optional[models.Topic]:
    db_topic = await get_topic(db, topic_id, user_id)
    if not db_topic:
        return None

    update_data = topic_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_topic, key, value)

    db.add(db_topic)
    await db.commit()
    await db.refresh(db_topic)
    return db_topic


async def delete_topic(db: AsyncSession, topic_id: int, user_id: str) -> bool:
    db_topic = await get_topic(db, topic_id, user_id)
    if not db_topic:
        return False

    await db.delete(db_topic)
    await db.commit()
    return True


async def get_countdowns(db: AsyncSession, user_id: str) -> List[models.Countdown]:
    result = await db.execute(
        select(models.Countdown)
        .where(models.Countdown.user_id == user_id)
        .order_by(models.Countdown.target_date.asc())
    )
    return list(result.scalars().all())


async def create_countdown(
    db: AsyncSession, user_id: str, countdown_in: schemas.CountdownCreate
) -> models.Countdown:
    db_countdown = models.Countdown(**countdown_in.model_dump(), user_id=user_id)
    db.add(db_countdown)
    await db.commit()
    await db.refresh(db_countdown)
    return db_countdown


async def delete_countdown(db: AsyncSession, countdown_id: int, user_id: str) -> bool:
    result = await db.execute(
        select(models.Countdown).where(
            models.Countdown.id == countdown_id, models.Countdown.user_id == user_id
        )
    )
    db_countdown = result.scalar_one_or_none()
    if db_countdown:
        await db.delete(db_countdown)
        await db.commit()
        return True
    return False
