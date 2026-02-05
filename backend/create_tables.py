import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from backend.database import Base
from backend.models import Achievement, UserAchievement

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://myuser:mypassword@localhost:5432/mydatabase"
)

async def create_tables():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        print("Creating new tables if they don't exist...")
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(create_tables())
