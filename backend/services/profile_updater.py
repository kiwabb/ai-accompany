"""User profile update utilities for MemoryService."""

from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
from .. import models


async def update_user_profile(
    user_id: str, extracted_data: Dict[str, Any], db: AsyncSession
) -> models.UserProfile:
    """
    Update or create user profile with extracted facts and preferences.

    Args:
        user_id: The user's identifier
        extracted_data: Dictionary containing 'facts', 'preferences',
                       and optionally 'emotional_state'
        db: Async database session

    Returns:
        The updated or created UserProfile model instance

    Note:
        This function does NOT commit the transaction. The caller is
        responsible for committing.
    """
    result = await db.execute(
        select(models.UserProfile).where(models.UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = models.UserProfile(user_id=user_id, data={})
        db.add(profile)

    # Work with a shallow copy to ensure we don't just mutate the existing ref
    current_data = dict(profile.data) if isinstance(profile.data, dict) else {}

    for key in ["facts", "preferences"]:
        if key in extracted_data and isinstance(extracted_data[key], list):
            existing = list(current_data.get(key, []))
            for item in extracted_data[key]:
                if item and item not in existing:
                    existing.append(item)
            current_data[key] = existing

    if "emotional_state" in extracted_data and extracted_data["emotional_state"]:
        current_data["last_emotional_state"] = extracted_data["emotional_state"]

    profile.data = current_data
    flag_modified(profile, "data")
    db.add(profile)

    return profile
