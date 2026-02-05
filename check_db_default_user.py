import asyncio
from backend.database import AsyncSessionLocal
from backend.models import UserSettings
from sqlalchemy import select

async def check_settings():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UserSettings).where(UserSettings.user_id == "default_user"))
        settings = result.scalar_one_or_none()
        if settings:
            print(f"User: {settings.user_id}")
            print(f"Provider: {settings.ai_provider}")
            print(f"Zhipu Key: {'***' if settings.zhipu_api_key else 'None'}")
        else:
            print("No settings found for default_user")

if __name__ == "__main__":
    asyncio.run(check_settings())
