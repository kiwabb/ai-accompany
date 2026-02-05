import asyncio
from datetime import datetime, timedelta
from backend.database import AsyncSessionLocal
from backend.models import LearningSession

async def add_record():
    async with AsyncSessionLocal() as db:
        session = LearningSession(
            user_id="user-123",
            theme_name="408",
            duration_seconds=2700, # 45 mins
            phase_type="focus",
            status="completed",
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(minutes=45),
            ai_persona="gentle_encourager",
            ai_proactivity=True,
            ai_actionable=False
        )
        db.add(session)
        await db.commit()
        print("Successfully added a 45-minute '408' focus session for today.")

if __name__ == "__main__":
    asyncio.run(add_record())
