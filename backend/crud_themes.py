from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, schemas
from typing import List

DEFAULT_THEMES = [
    {"id": "english", "name": "English", "duration": 25},
    {"id": "408", "name": "408", "duration": 45},
    {"id": "math", "name": "Math", "duration": 60},
    {"id": "momonga", "name": "Momonga Focus", "duration": 30},
    {"id": "kurimanju", "name": "Kurimanju Drink", "duration": 15},
]
DEFAULT_THEME_IDS = {d["id"] for d in DEFAULT_THEMES}


async def get_user_themes(db: AsyncSession, user_id: str) -> List[models.UserTheme]:
    result = await db.execute(
        select(models.UserTheme).where(models.UserTheme.user_id == user_id)
    )
    themes = list(result.scalars().all())

    if not themes:
        defaults = DEFAULT_THEMES
        
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


async def upsert_user_theme(
    db: AsyncSession, user_id: str, theme_id: str, theme_in: schemas.ThemeUpdate
) -> models.UserTheme:
    """更新已有主题；若不存在则按默认 list 兜底创建后再更新。"""
    result = await db.execute(
        select(models.UserTheme).where(
            models.UserTheme.user_id == user_id, models.UserTheme.theme_id == theme_id
        )
    )
    db_theme = result.scalar_one_or_none()

    update_data = theme_in.model_dump(exclude_unset=True)

    if db_theme is None:
        is_default = theme_id in DEFAULT_THEME_IDS
        default_seed = next((d for d in DEFAULT_THEMES if d["id"] == theme_id), None)
        db_theme = models.UserTheme(
            user_id=user_id,
            theme_id=theme_id,
            name=update_data.get("name") or (default_seed["name"] if default_seed else theme_id),
            focus_duration=update_data.get("focus_duration") or (default_seed["duration"] if default_seed else 25),
            is_default=is_default,
            icon_type=update_data.get("icon_type"),
        )
        db.add(db_theme)
    else:
        for key, value in update_data.items():
            if hasattr(db_theme, key):
                setattr(db_theme, key, value)

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
