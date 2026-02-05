from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, schemas
from typing import List


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
