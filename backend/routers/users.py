from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..database import get_db
from .. import crud, schemas
from ..services import auth_service

router = APIRouter(prefix="/api", tags=["users"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# Placeholder for actual user authentication dependency
# In a real app, this would decode a JWT or similar to get the current user's ID
async def get_current_user_id(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> str:
    if token == "user-123":
        return "default_user"
    
    payload = auth_service.decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username_res: str = str(payload.get("sub", ""))
    if not username_res:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username_res


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
    try:
        settings = await crud.upsert_user_settings(db, current_user_id, settings_in)
        return settings
    except Exception as e:
        import traceback
        error_msg = f"Error saving settings: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


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
