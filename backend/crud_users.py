from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models, schemas
from .services import auth_service

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(models.User).where(models.User.username == username))
    return result.scalars().first()

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(models.User).where(models.User.email == email))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: schemas.UserCreate):
    hashed_password = auth_service.get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    # Also initialize default settings for the new user
    from .crud_settings import upsert_user_settings
    await upsert_user_settings(db, user_in.username, schemas.UserSettingsBase())
    
    await db.commit()
    return db_user
