from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, schemas
from typing import List, Optional


async def get_topics(db: AsyncSession, user_id: str) -> List[models.Topic]:
    result = await db.execute(
        select(models.Topic).where(models.Topic.user_id == user_id)
    )
    topics = list(result.scalars().all())
    
    if not topics:
        default_topic = models.Topic(
            name="默认分类",
            description="自动创建的默认分类",
            user_id=user_id,
            is_active=True
        )
        db.add(default_topic)
        await db.commit()
        await db.refresh(default_topic)
        topics = [default_topic]
        
    return topics


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
