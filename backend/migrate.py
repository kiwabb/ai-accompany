import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://myuser:mypassword@localhost:5432/mydatabase"
)

async def migrate():
    engine = create_async_engine(DATABASE_URL)
    
    async def run_sql(sql):
        async with engine.begin() as conn:
            try:
                await conn.execute(text(sql))
                print(f"Success: {sql}")
                return True
            except Exception as e:
                print(f"Failed: {sql} - {e}")
                return False

    # Drop existing FK if it exists to allow type change
    await run_sql("ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_topic_id_fkey;")
    
    # Try to change type
    await run_sql("ALTER TABLE documents ALTER COLUMN topic_id TYPE TEXT;")
    
    # Standard columns
    await run_sql("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path TEXT;")
    await run_sql("ALTER TABLE documents ADD COLUMN IF NOT EXISTS topic_id TEXT;")
    await run_sql("ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_key TEXT;")
    await run_sql("ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready';")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
