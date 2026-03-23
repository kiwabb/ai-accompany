from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, schemas
from typing import List


async def get_user_themes(db: AsyncSession, user_id: str) -> List[models.UserTheme]:
    result = await db.execute(
        select(models.UserTheme).where(models.UserTheme.user_id == user_id)
    )
    themes = list(result.scalars().all())
    
    if not themes:
        defaults = [
            {"id": "english", "name": "English", "duration": 25},
            {"id": "408", "name": "408", "duration": 45},
            {"id": "math", "name": "Math", "duration": 60},
            {"id": "momonga", "name": "Momonga Focus", "duration": 30},
            {"id": "kurimanju", "name": "Kurimanju Drink", "duration": 15},
        ]
        
        created_themes = []
        for d in defaults:
            new_theme = models.UserTheme(
                user_id=user_id,
                theme_id=d["id"],
                name=d["name"],
                focus_duration=d["duration"],
                is_default=True
            )
            db.add(new_theme)
            created_themes.append(new_theme)
        
        await db.commit()
        for t in created_themes:
            await db.refresh(t)
        return created_themes
        
    return themes


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
