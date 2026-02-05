from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, time, date, timedelta
from typing import Optional, List, Any
from .. import crud, models
import logging

logger = logging.getLogger(__name__)

class AchievementService:
    @staticmethod
    async def check_achievements(db: AsyncSession, user_id: str, event_type: str, context: Optional[dict] = None):
        if event_type == 'session_complete':
            await AchievementService._handle_session_complete(db, user_id, context or {})

    @staticmethod
    async def _handle_session_complete(db: AsyncSession, user_id: str, context: dict):
        duration_seconds = context.get('duration_seconds', 0)
        start_time_raw = context.get('start_time')
        
        start_dt: Optional[datetime] = None
        if isinstance(start_time_raw, str):
            start_dt = datetime.fromisoformat(start_time_raw.replace('Z', '+00:00'))

        all_achievements = await crud.get_achievements(db)
        
        for ach in all_achievements:
            ach_id: Any = ach.id
            ua = await crud.get_user_achievement(db, user_id, ach_id)

            if ua and getattr(ua, "status") == "unlocked":
                continue

            if ua is None:
                ua = await crud.create_user_achievement(db, user_id, ach_id)

            should_unlock = False
            new_progress = int(getattr(ua, "current_progress") or 0)

            target_type = str(getattr(ach, "target_type"))
            target_value = int(getattr(ach, "target_value") or 0)

            if target_type == "session_count":
                new_progress += 1
                if new_progress >= target_value:
                    should_unlock = True

            elif target_type == "total_focus_time":
                new_progress += int(duration_seconds)
                if new_progress >= target_value:
                    should_unlock = True

            elif target_type == "night_session":
                if start_dt:
                    current_time = start_dt.time()
                    if time(0, 0) <= current_time <= time(4, 0):
                        new_progress = 1
                        should_unlock = True
            
            elif target_type == "streak_days":
                streak = await AchievementService._get_current_streak(db, user_id)
                new_progress = streak
                if streak >= target_value:
                    should_unlock = True

            update_data: dict[str, Any] = {"current_progress": new_progress}
            if should_unlock:
                update_data["status"] = "unlocked"
                update_data["unlocked_at"] = datetime.utcnow()
                logger.info(f"Achievement unlocked for user {user_id}: {getattr(ach, 'name')}")

            ua_id: Any = getattr(ua, "id")
            await crud.update_user_achievement(db, ua_id, update_data)

    @staticmethod
    async def _get_current_streak(db: AsyncSession, user_id: str) -> int:
        stmt = select(func.date(models.LearningSession.start_time)).where(
            models.LearningSession.user_id == user_id,
            models.LearningSession.phase_type == "focus",
            models.LearningSession.status == "completed"
        ).distinct().order_by(func.date(models.LearningSession.start_time).desc())
        
        result = await db.execute(stmt)
        dates: List[date] = [r[0] for r in result.all()]
        
        if not dates:
            return 0
            
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        if dates[0] != today and dates[0] != yesterday:
            return 0
            
        streak = 1
        for i in range(len(dates) - 1):
            if dates[i] - dates[i+1] == timedelta(days=1):
                streak += 1
            else:
                break
        return streak

achievement_service = AchievementService()
