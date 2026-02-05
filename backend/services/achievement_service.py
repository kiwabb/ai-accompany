from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, time
from typing import Optional
from .. import crud, models
import logging

logger = logging.getLogger(__name__)

class AchievementService:
    @staticmethod
    async def check_achievements(db: AsyncSession, user_id: str, event_type: str, context: Optional[dict] = None):
        """
        Check and update achievements for a user based on an event.
        event_type: 'session_complete', 'chat_message', etc.
        context: data related to the event (e.g., session duration).
        """
        if event_type == 'session_complete':
            await AchievementService._handle_session_complete(db, user_id, context)
        
        # Add more event handlers as needed

    @staticmethod
    async def _handle_session_complete(db: AsyncSession, user_id: str, context: dict):
        duration_seconds = context.get('duration_seconds', 0)
        start_time = context.get('start_time')
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))

        # Get all relevant achievements
        all_achievements = await crud.get_achievements(db)
        
        for ach in all_achievements:
            ach_id = int(ach.id)
            user_ach = await crud.get_user_achievement(db, user_id, ach_id)

            if user_ach is not None and user_ach.status == "unlocked":
                continue

            if user_ach is None:
                user_ach = await crud.create_user_achievement(db, user_id, ach_id)

            should_unlock = False
            new_progress = int(user_ach.current_progress)

            if ach.target_type == "session_count":
                new_progress += 1
                if new_progress >= int(ach.target_value):
                    should_unlock = True

            elif ach.target_type == "total_focus_time":
                new_progress += duration_seconds
                if new_progress >= int(ach.target_value):
                    should_unlock = True

            elif ach.target_type == "night_session":
                if start_time:
                    # Check if between 00:00 and 04:00
                    current_time = start_time.time()
                    if time(0, 0) <= current_time <= time(4, 0):
                        new_progress = 1
                        should_unlock = True

            # TODO: Add streak_days logic later as it requires more complex query

            update_data = {"current_progress": new_progress}
            if should_unlock:
                update_data["status"] = "unlocked"
                update_data["unlocked_at"] = datetime.utcnow()
                logger.info(f"Achievement unlocked for user {user_id}: {ach.name}")

            await crud.update_user_achievement(db, int(user_ach.id), update_data)

achievement_service = AchievementService()
