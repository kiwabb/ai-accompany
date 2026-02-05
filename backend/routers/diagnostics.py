from fastapi import APIRouter, Depends, HTTPException, Body
from ..services.memory_service import memory_service
from .users import get_current_user_id
from ..database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from .. import models, schemas
from typing import Any, Dict
from .profile_handlers import get_profile_data_for_modification, save_profile_modification

router = APIRouter(prefix="/api/diagnostics", tags=["diagnostics"])


@router.get("/last-exchange")
async def get_last_exchange(current_user_id: str = Depends(get_current_user_id)):
    """获取最后一次对话的诊断信息。"""
    last = memory_service.get_diagnostics(current_user_id)
    if not last:
        return {
            "system_prompt": "",
            "memory_fragments": [],
            "user_profile": {},
            "full_prompt": "No diagnostic data available. Please send a message first.",
            "timestamp": None,
        }
    return last


@router.get("/memory/fragments", response_model=list[schemas.MemoryFragmentResponse])
async def get_all_memory_fragments(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    limit: int = 50,
):
    """获取用户产生了实际记忆（Facts/Preferences）的对话碎片，按时间倒序排列。"""
    stmt = (
        select(models.MemoryFragment)
        .where(models.MemoryFragment.user_id == current_user_id)
        .where(
            or_(
                func.jsonb_array_length(
                    models.MemoryFragment.metadata_["extracted_facts"]
                )
                > 0,
                func.jsonb_array_length(
                    models.MemoryFragment.metadata_["extracted_preferences"]
                )
                > 0,
            )
        )
        .order_by(models.MemoryFragment.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/memory/fragments/{fragment_id}")
async def update_memory_fragment(
    fragment_id: int,
    content: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """更新特定的记忆碎片内容。"""
    result = await db.execute(
        select(models.MemoryFragment).where(models.MemoryFragment.id == fragment_id)
    )
    fragment = result.scalar_one_or_none()

    if not fragment or fragment.user_id != current_user_id:
        raise HTTPException(status_code=404, detail="Memory fragment not found")

    fragment.content = content
    db.add(fragment)
    await db.commit()
    return {"status": "success"}


@router.delete("/memory/fragments/{fragment_id}")
async def delete_memory_fragment(
    fragment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """删除特定的记忆碎片。"""
    result = await db.execute(
        select(models.MemoryFragment).where(models.MemoryFragment.id == fragment_id)
    )
    fragment = result.scalar_one_or_none()

    if not fragment or fragment.user_id != current_user_id:
        raise HTTPException(status_code=404, detail="Memory fragment not found")

    await db.delete(fragment)
    await db.commit()
    return {"status": "success"}


@router.delete("/profile/{category}")
async def delete_profile_item(
    category: str,
    value: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """从用户画像中删除指定的事实或偏好。"""
    profile, current_data, items = await get_profile_data_for_modification(
        current_user_id, category, db
    )

    if value not in items:
        raise HTTPException(status_code=404, detail="Item not found in profile")

    items.remove(value)
    current_data[category] = items
    return await save_profile_modification(profile, current_data, current_user_id, db)


@router.patch("/profile/{category}")
async def update_profile_item(
    category: str,
    old_value: str = Body(...),
    new_value: str = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """修正用户画像中的某个事实或偏好。"""
    profile, current_data, items = await get_profile_data_for_modification(
        current_user_id, category, db
    )

    if old_value not in items:
        raise HTTPException(status_code=404, detail="Original item not found")

    idx = items.index(old_value)
    items[idx] = new_value
    current_data[category] = items
    return await save_profile_modification(profile, current_data, current_user_id, db)


@router.get("/latest-memory-update")
async def get_latest_memory_update(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Check if there was a recent memory update for the user."""
    # We check the memory service's diagnostic cache first, as it's updated in real-time
    # during the background task.
    # In a real production system, this should probably query a 'notifications' table
    # or a Redis queue, but for now, we infer it from the last processed exchange.

    last_diag = memory_service.get_diagnostics(current_user_id)

    if not last_diag:
        return {"has_update": False}

    # Check if this update happened very recently (e.g. within last 10 seconds)
    # Since we don't strictly track 'update time' vs 'creation time' in the diag object easily
    # without adding more fields, we'll use a simple heuristic for now:
    # return the latest facts/preferences and let frontend decide if it's 'new'
    # based on comparing with its local state.

    return {
        "has_update": True,
        "facts": last_diag.get("user_profile", {}).get("facts", []),
        "preferences": last_diag.get("user_profile", {}).get("preferences", []),
        "timestamp": last_diag.get("timestamp"),
    }


@router.post("/reset")
async def reset_memory(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    """彻底重置用户画像和记忆缓存。"""
    profile = await memory_service.get_user_profile(current_user_id, db)
    if profile:
        profile.data = {"facts": [], "preferences": []}
        from sqlalchemy.orm.attributes import flag_modified

        flag_modified(profile, "data")
        db.add(profile)

    from sqlalchemy import delete

    await db.execute(
        delete(models.MemoryFragment).where(
            models.MemoryFragment.user_id == current_user_id
        )
    )

    if current_user_id in memory_service.last_exchanges:
        del memory_service.last_exchanges[current_user_id]

    await db.commit()
    return {"status": "success"}
