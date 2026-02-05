from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, schemas
from typing import Optional


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
