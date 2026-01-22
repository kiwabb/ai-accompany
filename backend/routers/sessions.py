from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
import asyncio
import json

from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/sessions", response_model=schemas.SessionResponse, status_code=201)
async def create_learning_session(
    session_in: schemas.SessionCreate, db: AsyncSession = Depends(get_db)
):
    return await crud.create_session(db=db, session_in=session_in)


@router.patch("/sessions/{session_id}", response_model=schemas.SessionResponse)
async def update_learning_session(
    session_id: int,
    session_update: schemas.SessionCreate,
    db: AsyncSession = Depends(get_db),
):
    updated_session = await crud.update_session(
        db, session_id, session_update.model_dump(exclude_unset=True)
    )
    if not updated_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated_session


@router.post("/chat/completions")
async def chat_completions(request: schemas.ChatRequest):
    """
    AI 聊天伴侣的对话接口，目前返回 Mock 的流式数据。
    未来将集成真实的 LLM (如 Gemini/OpenAI)。
    """

    async def event_generator():
        # 模拟 AI 思考过程和打字感
        full_response = f"I heard you say: '{request.message}'. I'm here to accompany you on your learning journey! Keep up the great work. ✨"

        # 模拟流式输出
        for char in full_response:
            yield char
            await asyncio.sleep(0.03)

    return StreamingResponse(event_generator(), media_type="text/plain")


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
