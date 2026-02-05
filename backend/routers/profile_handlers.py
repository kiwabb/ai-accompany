# backend/routers/profile_handlers.py
"""Shared handlers for profile modification operations."""
from typing import Any, Tuple
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..services.memory_service import memory_service


async def get_profile_data_for_modification(
    current_user_id: str,
    category: str,
    db: AsyncSession
) -> Tuple[Any, dict, list]:
    """
    Validate and retrieve profile data for modification.
    Returns (profile, current_data, items).
    Raises HTTPException on validation failure.
    """
    if category not in ["facts", "preferences"]:
        raise HTTPException(status_code=400, detail="Invalid category")

    profile = await memory_service.get_user_profile(current_user_id, db)
    if profile is None or profile.data is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    current_data = dict(profile.data) if isinstance(profile.data, dict) else {}
    items = list(current_data.get(category, []))
    return profile, current_data, items


async def save_profile_modification(
    profile: Any,
    current_data: dict,
    current_user_id: str,
    db: AsyncSession
) -> dict:
    """
    Save modified profile data and update diagnostics cache.
    Returns {"status": "success"}.
    """
    from sqlalchemy.orm.attributes import flag_modified

    profile.data = current_data
    flag_modified(profile, "data")
    await db.commit()

    last_diag = memory_service.get_diagnostics(current_user_id)
    if last_diag:
        last_diag["user_profile"] = current_data
        memory_service.store_diagnostics(current_user_id, last_diag)

    return {"status": "success"}
