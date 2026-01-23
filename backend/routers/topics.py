from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database import get_db
from .. import crud, schemas
from .users import get_current_user_id

router = APIRouter(tags=["topics"])


@router.get("", response_model=List[schemas.TopicResponse])
async def get_topics(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_topics(db, current_user_id)


@router.post("", response_model=schemas.TopicResponse, status_code=201)
async def create_topic(
    topic_in: schemas.TopicCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_topic(db, current_user_id, topic_in)


@router.get("/{topic_id}", response_model=schemas.TopicResponse)
async def get_topic(
    topic_id: int,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    topic = await crud.get_topic(db, topic_id, current_user_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.put("/{topic_id}", response_model=schemas.TopicResponse)
async def update_topic(
    topic_id: int,
    topic_in: schemas.TopicCreate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    topic = await crud.update_topic(db, topic_id, current_user_id, topic_in)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.delete("/{topic_id}")
async def delete_topic(
    topic_id: int,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    success = await crud.delete_topic(db, topic_id, current_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"message": "Topic deleted"}
