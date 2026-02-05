import asyncio
from backend.database import engine, Base
from backend.models import UserSettings, UserTheme, LearningSession, Topic, ChatHistory, UserProfile, MemoryFragment

async def reset_db():
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("Done.")

if __name__ == "__main__":
    asyncio.run(reset_db())
