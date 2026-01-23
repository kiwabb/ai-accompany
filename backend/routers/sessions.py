from fastapi import APIRouter, Depends, Query, HTTPException, Header, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
import asyncio
import json
from typing import List, Optional

from ..database import get_db, AsyncSessionLocal
from .. import crud, schemas
from ..services.chat_service import chat_service
from ..services.memory_service import memory_service


router = APIRouter(prefix="/api", tags=["sessions"])


# Helper for streaming and saving - Defined outside the route
async def response_generator_with_save(
    message: str,
    system_prompt: str,
    chat_history: List[schemas.ChatMessage],
    api_key: Optional[str],
    db_session: AsyncSession,
    user_id: Optional[str] = "default_user",
    topic_id: Optional[int] = None,
    background_tasks: Optional[BackgroundTasks] = None,
):
    actual_user_id = user_id or "default_user"
    full_response = ""
    async for chunk in chat_service.stream_chat(
        message,
        system_prompt,
        chat_history=chat_history,
        api_key=api_key,
        db=db_session,
        user_id=actual_user_id,
    ):
        full_response += chunk
        yield chunk

    if full_response:
        async with AsyncSessionLocal() as session:
            # 1. Save to regular chat history
            await crud.create_chat_message(
                session, role="ai", content=full_response, topic_id=topic_id
            )

            # 2. Trigger memory extraction in background if background_tasks provided
            if background_tasks:

                async def process_memory():
                    async with AsyncSessionLocal() as mem_session:
                        await memory_service.process_exchange(
                            user_id=actual_user_id,
                            topic_id=topic_id,
                            user_msg=message,
                            ai_msg=full_response,
                            db=mem_session,
                        )

                background_tasks.add_task(process_memory)


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
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_google_api_key: Optional[str] = Header(None),
):
    """
    AI 聊天伴侣的对话接口，集成 Gemini Pro。
    """
    # 1. Fetch historical context (Daily Stats)
    daily_stats = await crud.get_daily_stats(db, date.today())
    daily_focus = daily_stats.total_focus_minutes if daily_stats else 0
    daily_sessions = daily_stats.total_sessions if daily_stats else 0

    # 2. Fetch Recent Chat History
    raw_chat_history = await crud.get_recent_chat_history(db, limit=10)
    chat_history_for_llm = [
        schemas.ChatMessage(
            role=str(msg.role),
            content=str(msg.content),
            created_at=msg.created_at.isoformat(),
        )
        for msg in raw_chat_history
    ]

    # 3. Extract real-time context from request
    context = request.context
    if context:
        ai_persona = context.ai_persona or "gentle_encourager"
        task_name = context.theme_name or "Focus"
        phase = context.phase or "focus"
        time_left = context.time_left or 0
        language = context.language or "en"
        # Use frontend provided stats if available, otherwise fallback to DB stats
        daily_focus = (
            context.total_focus_minutes
            if context.total_focus_minutes is not None
            else daily_focus
        )
        daily_sessions = (
            context.daily_completed_pomodoros
            if context.daily_completed_pomodoros is not None
            else daily_sessions
        )
    else:
        ai_persona = "gentle_encourager"
        task_name = "Focus"
        phase = "focus"
        time_left = 0
        language = "en"

    # 4. Construct System Prompt
    phase_descriptions = {
        "focus": "working hard in a FOCUS session",
        "shortBreak": "taking a SHORT BREAK",
        "longBreak": "taking a LONG BREAK",
    }
    phase_desc = phase_descriptions.get(phase, "studying")

    persona_instructions = {
        "gentle_encourager": "Be warm, empathetic, and use supportive language. Focus on the user's emotional well-being.",
        "strict_coach": "Be firm, direct, and focus on discipline. Push the user to stay committed and avoid excuses.",
        "logical_analyst": "Be objective, analytical, and provide structured advice. Focus on efficiency and productivity techniques.",
        "humorous_buddy": "Be playful, witty, and use light humor. Help the user relax and enjoy the process.",
    }
    persona_inst = persona_instructions.get(
        ai_persona, persona_instructions["gentle_encourager"]
    )

    is_proactive = request.message.startswith("[SYSTEM_TRIGGER:")
    proactive_context = ""
    if is_proactive:
        trigger_type = request.message.split(":")[1].rstrip("]")
        proactive_context = f"IMPORTANT: This is a proactive message triggered by a state change: {trigger_type}. "
        if trigger_type == "focus_start":
            proactive_context += (
                "The user just started a focus session. Give them a quick boost!"
            )
        elif trigger_type == "break_start":
            proactive_context += "The user just started a break. Remind them to rest."
        elif trigger_type == "focus_near_end":
            proactive_context += "The focus session is almost over (1 minute left). Give them a final push!"
        elif trigger_type == "focus_completed":
            proactive_context += "The user just successfully finished a focus session! Celebrate their accomplishment."
        elif trigger_type == "break_near_end":
            proactive_context += (
                "The break is almost over. Gently prepare them to get back to focus."
            )

    system_prompt = (
        f"You are CozyPal, a supportive AI study companion. "
        f"Current Persona: {ai_persona}. Style: {persona_inst} "
        f"User State: The user is currently {phase_desc} for the topic '{task_name}'. "
        f"Timer: There are approximately {time_left // 60} minutes left in this period. "
        f"Today's Progress: User has already completed {daily_focus} minutes of deep focus across {daily_sessions} sessions today. "
        f"{proactive_context} "
        f"Your Task: Provide a very brief, encouraging response (1-2 sentences) matching your persona's style. "
        f"If the user is focusing, keep them on track. If they are on a break, remind them to recharge. "
        f"Always respond in {language}."
    )

    if not is_proactive:
        await crud.create_chat_message(
            db, role="user", content=request.message, topic_id=request.topic_id
        )

    return StreamingResponse(
        response_generator_with_save(
            request.message,
            system_prompt,
            chat_history_for_llm,
            x_google_api_key,
            db,
            user_id=request.user_id,
            topic_id=request.topic_id,
            background_tasks=background_tasks,
        ),
        media_type="text/plain",
    )


@router.get("/chat/history", response_model=schemas.ChatHistoryResponse)
async def get_chat_history(
    limit: int = Query(50, ge=1, le=100), db: AsyncSession = Depends(get_db)
):
    messages = await crud.get_recent_chat_history(db, limit=limit)
    formatted_messages = [
        schemas.ChatMessage(
            role=str(msg.role),
            content=str(msg.content),
            created_at=msg.created_at.isoformat(),
        )
        for msg in messages
    ]
    return schemas.ChatHistoryResponse(messages=formatted_messages)


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
@router.get("/sessions", response_model=List[schemas.SessionResponse])
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
