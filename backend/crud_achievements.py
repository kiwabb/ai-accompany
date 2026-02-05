from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from . import models
from datetime import datetime
from typing import List, Optional


async def get_achievements(db: AsyncSession) -> List[models.Achievement]:
    result = await db.execute(select(models.Achievement))
    return list(result.scalars().all())


async def get_user_achievements(db: AsyncSession, user_id: str) -> List[models.UserAchievement]:
    result = await db.execute(
        select(models.UserAchievement)
        .where(models.UserAchievement.user_id == user_id)
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
    )
    return list(result.scalars().all())
