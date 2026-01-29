from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database import get_db
from .. import crud, schemas
from .users import get_current_user_id

router = APIRouter(prefix="/api/countdowns", tags=["countdowns"])


@router.get("", response_model=List[schemas.CountdownResponse])
async def get_countdowns(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_countdowns(db, current_user_id)


@router.post("", response_model=schemas.CountdownResponse, status_code=201)
async def create_countdown(
    countdown_in: schemas.CountdownCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_countdown(db, current_user_id, countdown_in)


@router.delete("/{countdown_id}")
async def delete_countdown(
    countdown_id: int,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    success = await crud.delete_countdown(db, countdown_id, current_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Countdown not found")
    return {"message": "Countdown deleted"}
