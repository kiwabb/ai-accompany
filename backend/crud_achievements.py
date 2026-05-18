from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from . import models
from datetime import datetime
from typing import List, Optional


# 成就目录种子：启动时若表为空则一次性写入
ACHIEVEMENT_CATALOG = [
    # 里程碑：累计场次
    {"key": "first_session", "name": "First Step", "description": "Complete your first focus session", "category": "milestone", "target_type": "session_count", "target_value": 1, "is_hidden": False},
    {"key": "session_10", "name": "Getting Warmed Up", "description": "Complete 10 focus sessions", "category": "milestone", "target_type": "session_count", "target_value": 10, "is_hidden": False},
    {"key": "session_50", "name": "Half Century", "description": "Complete 50 focus sessions", "category": "milestone", "target_type": "session_count", "target_value": 50, "is_hidden": False},
    {"key": "session_100", "name": "Centurion", "description": "Complete 100 focus sessions", "category": "milestone", "target_type": "session_count", "target_value": 100, "is_hidden": False},

    # 专注挑战：累计时长（秒）
    {"key": "focus_10h", "name": "Focus Apprentice", "description": "Accumulate 10 hours of focus time", "category": "focus", "target_type": "total_focus_time", "target_value": 10 * 3600, "is_hidden": False},
    {"key": "focus_25h", "name": "Deep Worker", "description": "Accumulate 25 hours of focus time", "category": "focus", "target_type": "total_focus_time", "target_value": 25 * 3600, "is_hidden": False},
    {"key": "focus_100h", "name": "Focus Master", "description": "Accumulate 100 hours of focus time", "category": "focus", "target_type": "total_focus_time", "target_value": 100 * 3600, "is_hidden": False},

    # 连续打卡
    {"key": "streak_3d", "name": "Three in a Row", "description": "Keep a 3-day focus streak", "category": "streak", "target_type": "streak_days", "target_value": 3, "is_hidden": False},
    {"key": "streak_7d", "name": "Persistence Wins", "description": "Keep a 7-day focus streak", "category": "streak", "target_type": "streak_days", "target_value": 7, "is_hidden": False},
    {"key": "streak_14d", "name": "Habit Formed", "description": "Keep a 14-day focus streak", "category": "streak", "target_type": "streak_days", "target_value": 14, "is_hidden": False},
    {"key": "streak_30d", "name": "Iron Will", "description": "Keep a 30-day focus streak", "category": "streak", "target_type": "streak_days", "target_value": 30, "is_hidden": False},

    # 隐藏成就
    {"key": "night_owl", "name": "Night Owl", "description": "Complete a focus session between 0:00 - 4:00", "category": "hidden", "target_type": "night_session", "target_value": 1, "is_hidden": True},
]


async def seed_achievements_if_empty(db: AsyncSession) -> int:
    """若 achievements 表为空则种入目录；返回插入条数。"""
    existing = await db.execute(select(models.Achievement.id).limit(1))
    if existing.scalar_one_or_none() is not None:
        return 0
    for item in ACHIEVEMENT_CATALOG:
        db.add(models.Achievement(**item))
    await db.commit()
    return len(ACHIEVEMENT_CATALOG)


async def get_achievements(db: AsyncSession) -> List[models.Achievement]:
    result = await db.execute(select(models.Achievement))
    return list(result.scalars().all())


async def get_user_achievements(db: AsyncSession, user_id: str) -> List[models.UserAchievement]:
    result = await db.execute(
        select(models.UserAchievement)
        .where(models.UserAchievement.user_id == user_id)
        .options(selectinload(models.UserAchievement.achievement))
    )
    return list(result.scalars().all())


async def get_user_achievement(db: AsyncSession, user_id: str, achievement_id: int) -> Optional[models.UserAchievement]:
    result = await db.execute(
        select(models.UserAchievement)
        .where(
            models.UserAchievement.user_id == user_id,
            models.UserAchievement.achievement_id == achievement_id
        )
    )
    return result.scalar_one_or_none()


async def create_user_achievement(db: AsyncSession, user_id: str, achievement_id: int) -> models.UserAchievement:
    db_ua = models.UserAchievement(user_id=user_id, achievement_id=achievement_id)
    db.add(db_ua)
    await db.commit()
    await db.refresh(db_ua)
    return db_ua


async def update_user_achievement(db: AsyncSession, ua_id: int, update_data: dict) -> Optional[models.UserAchievement]:
    stmt = (
        update(models.UserAchievement)
        .where(models.UserAchievement.id == ua_id)
        .values(**update_data)
    )
    await db.execute(stmt)
    await db.commit()
    result = await db.execute(select(models.UserAchievement).where(models.UserAchievement.id == ua_id))
    return result.scalar_one_or_none()


async def get_latest_unlocked_achievements(db: AsyncSession, user_id: str, since: datetime) -> List[models.UserAchievement]:
    result = await db.execute(
        select(models.UserAchievement)
        .where(
            models.UserAchievement.user_id == user_id,
            models.UserAchievement.status == "unlocked",
            models.UserAchievement.unlocked_at >= since
        )
        .options(selectinload(models.UserAchievement.achievement))
    )
    return list(result.scalars().all())
