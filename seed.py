import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from backend.models import UserSettings, UserTheme, Topic, Achievement
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://myuser:mypassword@localhost:5432/mydatabase"
)


async def seed_data():
    engine = create_async_engine(DATABASE_URL)
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("Seeding initial data for default_user...")

            # 1. Default User Settings
            stmt = select(UserSettings).where(UserSettings.user_id == "default_user")
            result = await session.execute(stmt)
            default_settings = result.scalar_one_or_none()
            if not default_settings:
                print("Creating default user settings...")
                session.add(UserSettings(user_id="default_user"))

            # 2. Default Themes
            default_themes = [
                {
                    "theme_id": "english",
                    "name": "English Learning",
                    "focus_duration": 25,
                    "is_default": True,
                },
                {
                    "theme_id": "408",
                    "name": "Computer Science",
                    "focus_duration": 45,
                    "is_default": True,
                },
                {
                    "theme_id": "math",
                    "name": "Mathematics",
                    "focus_duration": 60,
                    "is_default": True,
                },
            ]
            for theme_data in default_themes:
                stmt = select(UserTheme).where(
                    UserTheme.user_id == "default_user",
                    UserTheme.theme_id == theme_data["theme_id"]
                )
                result = await session.execute(stmt)
                theme = result.scalar_one_or_none()
                if not theme:
                    print(f"Creating theme: {theme_data['name']}")
                    session.add(UserTheme(user_id="default_user", **theme_data))

            # 3. Default Topic
            default_topic = await session.get(Topic, 1)
            if not default_topic:
                print("Creating default topic...")
                session.add(
                    Topic(
                        user_id="default_user",
                        name="General",
                        description="Default topic for all conversations",
                    )
                )

            initial_achievements = [
                {
                    "key": "first_session",
                    "name": "第一步",
                    "description": "完成第一次专注会话",
                    "category": "milestone",
                    "target_type": "session_count",
                    "target_value": 1,
                },
                {
                    "key": "focus_10h",
                    "name": "专注学徒",
                    "description": "累计专注时长达到 10 小时",
                    "category": "milestone",
                    "target_type": "total_focus_time",
                    "target_value": 36000,
                },
                {
                    "key": "night_owl",
                    "name": "熬夜冠军",
                    "description": "在凌晨 0:00 到 4:00 之间完成一次专注",
                    "category": "challenge",
                    "target_type": "night_session",
                    "target_value": 1,
                    "is_hidden": True,
                },
                {
                    "key": "streak_7d",
                    "name": "坚持就是胜利",
                    "description": "连续 7 天保持专注记录",
                    "category": "milestone",
                    "target_type": "streak_days",
                    "target_value": 7,
                },
            ]

            for ach_data in initial_achievements:
                stmt = select(Achievement).where(Achievement.key == ach_data["key"])
                result = await session.execute(stmt)
                achievement = result.scalar_one_or_none()
                if not achievement:
                    print(f"Creating achievement: {ach_data['name']}")
                    session.add(Achievement(**ach_data))

        await session.commit()

    await engine.dispose()
    print("✅ Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed_data())
