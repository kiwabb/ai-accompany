import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.exc import ProgrammingError
from sqlalchemy import text
from backend.models import Base

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://myuser:mypassword@localhost:5432/mydatabase"
)


async def nuke_and_rebuild():
    # Connect to the maintenance database 'postgres' to drop the target database
    db_url_parts = DATABASE_URL.split("/")
    db_name = db_url_parts[-1]
    maintenance_db_url = "/".join(db_url_parts[:-1]) + "/postgres"

    engine = create_async_engine(maintenance_db_url, isolation_level="AUTOCOMMIT")
    async with engine.connect() as conn:
        print(f"Attempting to drop database '{db_name}'...")
        try:
            # Terminate all connections to the target database
            await conn.execute(
                text(
                    f"SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '{db_name}' AND pid <> pg_backend_pid();"
                )
            )
            await conn.execute(text(f'DROP DATABASE "{db_name}"'))
            print(f"Database '{db_name}' dropped successfully.")
        except ProgrammingError as e:
            if "does not exist" in str(e):
                print(f"Database '{db_name}' does not exist, skipping drop.")
            else:
                raise

        print(f"Creating database '{db_name}'...")
        await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
        print(f"Database '{db_name}' created.")

    await engine.dispose()

    # Connect to the newly created database to create tables
    new_engine = create_async_engine(DATABASE_URL)
    async with new_engine.begin() as conn:
        print("Creating all tables from metadata...")
        await conn.run_sync(Base.metadata.create_all)

    await new_engine.dispose()
    print("Database has been completely nuked and rebuilt.")


if __name__ == "__main__":
    asyncio.run(nuke_and_rebuild())
