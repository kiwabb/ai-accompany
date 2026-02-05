from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timedelta

from ..database import get_db
from .. import crud, schemas
from .users import get_current_user_id

router = APIRouter(prefix="/api/achievements", tags=["achievements"])

@router.get("", response_model=List[schemas.UserAchievementResponse])
async def list_user_achievements(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all achievements with the user's current progress."""
    # First, get all available achievements
    all_achievements = await crud.get_achievements(db)
    
    # Get user's progress for all achievements
    user_achievements = await crud.get_user_achievements(db, current_user_id)
    user_ach_map = {ua.achievement_id: ua for ua in user_achievements}
    
    result = []
    for ach in all_achievements:
        ua = user_ach_map.get(ach.id)
        if ua:
            result.append(ua)
        else:
            # If no progress yet, return a virtual "in_progress" record
            result.append(
                schemas.UserAchievementResponse(
                    id=0,  # Virtual ID
                    user_id=current_user_id,
                    achievement_id=ach.id,  # type: ignore
                    current_progress=0,
                    status="in_progress",
                    unlocked_at=None,
                    updated_at=ach.created_at,  # type: ignore
                    achievement=schemas.AchievementResponse.model_validate(ach),
                )
            )
            
    return result

@router.get("/latest-unlocks", response_model=List[schemas.UserAchievementResponse])
async def get_latest_unlocks(
    minutes: int = Query(5, description="Minutes to look back for unlocks"),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Polling endpoint to check for recently unlocked achievements."""
    since = datetime.utcnow() - timedelta(minutes=minutes)
    return await crud.get_latest_unlocked_achievements(db, current_user_id, since)
