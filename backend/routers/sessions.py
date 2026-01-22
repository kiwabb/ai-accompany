from fastapi import APIRouter, Depends, Query, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
import asyncio
import json

from ..database import get_db
from .. import crud, schemas
from ..services.chat_service import chat_service

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
async def chat_completions(
    request: schemas.ChatRequest,
    db: AsyncSession = Depends(get_db),
    x_google_api_key: str = Header(None),
):
    """
    AI 聊天伴侣的对话接口，集成 Gemini Pro。
    """
    # 1. Fetch historical context (Daily Stats)
    daily_stats = await crud.get_daily_stats(db, date.today())
    daily_focus = daily_stats.total_focus_minutes if daily_stats else 0
    daily_sessions = daily_stats.total_sessions if daily_stats else 0

    # 2. Fetch Recent Chat History
    chat_history = await crud.get_recent_chat_history(db, limit=10)

    # 3. Extract real-time context from request
    context = request.context or {}
    ai_persona = context.get("ai_persona", "gentle_encourager")
    task_name = context.get("theme_name", "Focus")
    phase = context.get("phase", "focus")
    time_left = context.get("time_left", 0)  # seconds

    # 4. Construct System Prompt
    system_prompt = (
        f"You are CozyPal, a supportive AI study companion. "
        f"Persona: {ai_persona}. "
        f"User Context: Currently in '{phase}' phase (Theme: {task_name}). "
        f"Time Remaining: ~{time_left // 60} minutes. "
        f"Today's Progress: {daily_focus} mins focused ({daily_sessions} sessions). "
        f"Instructions: Be concise (1-3 sentences). Match the persona. Encourage the user."
    )

    # 5. Save User Message
    await crud.create_chat_message(db, role="user", content=request.message)

    # 6. Stream Response & Save AI Message
    async def response_generator():
        full_response = ""
        async for chunk in chat_service.stream_chat(
            request.message,
            system_prompt,
            chat_history=chat_history,
            api_key=x_google_api_key,
        ):
            full_response += chunk
            yield chunk

    return StreamingResponse(
        response_generator_with_save(
            request.message,
            system_prompt,
            chat_history,
            x_google_api_key,
            db,
        ),
        media_type="text/plain",
    )


# Helper for streaming and saving
async def response_generator_with_save(
    message, system_prompt, chat_history, api_key, db_session
):
    full_response = ""
    # Create a new session for saving to avoid 'session is closed' errors if main request finishes
    # Actually, we can't easily create a new session here without the sessionmaker.
    # Let's import the sessionmaker
    from ..database import AsyncSessionLocal

    async for chunk in chat_service.stream_chat(
        message, system_prompt, chat_history=chat_history, api_key=api_key
    ):
        full_response += chunk
        yield chunk

    if full_response:
        async with AsyncSessionLocal() as session:
            await crud.create_chat_message(session, role="ai", content=full_response)


@router.get("/chat/history", response_model=schemas.ChatHistoryResponse)
async def get_chat_history(
    limit: int = Query(50, ge=1, le=100), db: AsyncSession = Depends(get_db)
):
    messages = await crud.get_recent_chat_history(db, limit=limit)
    return schemas.ChatHistoryResponse(messages=messages)


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
