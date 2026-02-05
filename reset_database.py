import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from backend.models import Base  # Import your Base from models

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://myuser:mypassword@localhost:5432/mydatabase"
)


async def reset_db():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("Database has been reset.")


if __name__ == "__main__":
    asyncio.run(reset_db())
