from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/sessions", response_model=schemas.SessionResponse, status_code=201)
async def create_learning_session(
    session_in: schemas.SessionCreate, db: AsyncSession = Depends(get_db)
):
    return await crud.create_session(db=db, session_in=session_in)


@router.get("/stats/daily", response_model=schemas.DailyStats)
async def get_daily_learning_stats(
    target_date: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
):
    stats = await crud.get_daily_stats(db=db, target_date=target_date)
    if not stats:  # 如果没有找到当天的统计数据，返回一个空/默认值对象
        return schemas.DailyStats(
            date=target_date.isoformat(),
            total_focus_minutes=0,
            total_sessions=0,
            sessions_by_theme={},
        )
    return stats


# 可以添加一个获取所有session的路由 (可选，用于调试或未来数据展示)
@router.get("/sessions", response_model=list[schemas.SessionResponse])
async def get_all_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=0),
    db: AsyncSession = Depends(get_db),
):
    # 这是一个简化版本，crud层应该有对应的实现
    # 为了快速实现，这里直接从db获取，但更推荐通过crud层封装
    from sqlalchemy import select
    from ..models import LearningSession

    result = await db.execute(select(LearningSession).offset(skip).limit(limit))
    sessions = result.scalars().all()
    return sessions
