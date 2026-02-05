import asyncio
from backend.database import AsyncSessionLocal
from backend.models import UserSettings
from sqlalchemy import select

async def check_settings():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UserSettings).where(UserSettings.user_id == "user-123"))
        settings = result.scalar_one_or_none()
        if settings:
            print(f"User: {settings.user_id}")
            print(f"Provider: {settings.ai_provider}")
            print(f"Gemini Key: {'***' if settings.google_api_key else 'None'}")
            print(f"OpenAI Key: {'***' if settings.openai_api_key else 'None'}")
            print(f"DeepSeek Key: {'***' if settings.deepseek_api_key else 'None'}")
            print(f"Zhipu Key: {'***' if settings.zhipu_api_key else 'None'}")
        else:
            print("No settings found for user-123")

if __name__ == "__main__":
    asyncio.run(check_settings())
