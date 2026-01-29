from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/api", tags=["users"])


# Placeholder for actual user authentication dependency
# In a real app, this would decode a JWT or similar to get the current user's ID
async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    # For now, we'll just return a dummy user ID or extract from a simple header
    # In a real application, you'd integrate with your authentication system
    # and retrieve the actual user ID from the token.
    if authorization and authorization.startswith("Bearer "):
        # This is a placeholder. Replace with actual token validation and user ID extraction.
        token = authorization.split(" ")[1]
        # Example: if token is "user-123", return "user-123"
        print(f"--- DEBUG: Extracting user_id: {token} from header ---")
        return token
    print(f"--- DEBUG: No valid Bearer token found, falling back to default_user (Header: {authorization}) ---")
    # Default user for development/testing if no header is provided
    return "default_user"


@router.get("/settings", response_model=schemas.UserSettingsResponse)
async def get_user_settings(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    settings = await crud.get_user_settings(db, current_user_id)
    if settings is None:
        raise HTTPException(status_code=404, detail="User settings not found")
    return settings


@router.put("/settings", response_model=schemas.UserSettingsResponse)
async def upsert_user_settings(
    settings_in: schemas.UserSettingsBase,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    settings = await crud.upsert_user_settings(db, current_user_id, settings_in)
    return settings


@router.get("/themes", response_model=list[schemas.ThemeResponse])
async def get_user_themes(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_user_themes(db, current_user_id)


@router.post("/themes", response_model=schemas.ThemeResponse)
async def create_user_theme(
    theme_in: schemas.ThemeCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_user_theme(db, current_user_id, theme_in)


@router.delete("/themes/{theme_id}")
async def delete_user_theme(
    theme_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    success = await crud.delete_user_theme(db, current_user_id, theme_id)
    if not success:
        raise HTTPException(status_code=404, detail="Theme not found")
    return {"message": "Theme deleted"}
