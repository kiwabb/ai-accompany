from fastapi import APIRouter, Depends, Query, HTTPException, Header, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List, Optional

from ..database import get_db, AsyncSessionLocal
from .. import crud, schemas, crud_stats
from ..services.chat_service import chat_service
from ..services.memory_service import memory_service
from ..services.achievement_service import achievement_service
from ..services.prompt_builder import construct_system_prompt
from .api_key_resolver import resolve_api_key
from .users import get_current_user_id

router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/sessions", response_model=schemas.SessionResponse, status_code=201)
async def create_learning_session(
    session_in: schemas.SessionCreate,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    session = await crud.create_session(db, session_in, current_user_id)

    if session.phase_type == "focus" and session.status == "completed":
        background_tasks.add_task(
            achievement_service.check_achievements,
            db=AsyncSessionLocal(),
            user_id=current_user_id,
            event_type="session_complete",
            context={
                "duration_seconds": session.duration_seconds,
                "start_time": session.start_time.isoformat()
            }
        )

    return session


@router.patch("/sessions/{session_id}", response_model=schemas.SessionResponse)
async def update_learning_session(
    session_id: int,
    session_data: schemas.SessionUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    updated = await crud.update_session(db, session_id, session_data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


async def _response_generator_with_save(
    message: str,
    system_prompt: str,
    chat_history: List[schemas.ChatMessage],
    api_key: Optional[str],
    db_session: AsyncSession,
    user_id: str,
    topic_id: Optional[int],
    background_tasks: BackgroundTasks,
    language: str,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    document_id: Optional[int] = None,
    document_title: Optional[str] = None,
    document_content: Optional[str] = None,
):
    """Generator that streams chat response and saves to database."""
    full_response = ""

    async for chunk in chat_service.stream_chat(
        message, system_prompt, chat_history=chat_history, api_key=api_key,
        db=db_session, user_id=user_id, provider=provider, model=model,
        document_id=document_id, document_title=document_title, document_content=document_content,
    ):
        full_response += chunk
        yield chunk

    if full_response:
        async with AsyncSessionLocal() as session:
            await crud.create_chat_message(session, role="ai", content=full_response, user_id=user_id, topic_id=topic_id)

            async def process_memory_task(api_key, lang):
                async with AsyncSessionLocal() as mem_session:
                    await memory_service.process_exchange(
                        user_id=user_id, topic_id=topic_id, user_msg=message,
                        ai_msg=full_response, db=mem_session, api_key=api_key, language=lang,
                    )

            background_tasks.add_task(process_memory_task, api_key=api_key, lang=language)


@router.post("/chat/completions")
async def chat_completions(
    request: schemas.ChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_google_api_key: Optional[str] = Header(None),
    current_user_id: str = Depends(get_current_user_id),
):
    daily_stats = await crud_stats.get_daily_stats(db, date.today(), current_user_id)
    daily_focus = daily_stats.total_focus_minutes if daily_stats else 0
    daily_sessions = daily_stats.total_sessions if daily_stats else 0

    raw_history = await crud.get_recent_chat_history(db, user_id=current_user_id, limit=10, topic_id=request.topic_id)
    chat_history = [schemas.ChatMessage.model_validate(msg) for msg in raw_history]

    language = _detect_language(request)
    user_settings = await crud.get_user_settings(db, current_user_id)
    effective_provider = request.provider or (user_settings.ai_provider if user_settings else "gemini")
    api_key = resolve_api_key(x_google_api_key, user_settings, effective_provider)

    system_prompt = construct_system_prompt(request.context, daily_focus, daily_sessions, language, request.message)

    if not request.message.startswith("[SYSTEM_TRIGGER:"):
        await crud.create_chat_message(db, role="user", content=request.message, user_id=current_user_id, topic_id=request.topic_id)

    return StreamingResponse(
        _response_generator_with_save(
            request.message, system_prompt, chat_history, api_key, db, current_user_id,
            request.topic_id, background_tasks, language, request.provider, request.model,
            request.document_id, request.document_title, request.document_content,
        ),
        media_type="text/plain",
    )


@router.get("/chat/history")
async def chat_history(
    limit: int = Query(10, ge=1, le=100),
    topic_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    raw_history = await crud.get_recent_chat_history(
        db,
        user_id=current_user_id,
        limit=limit,
        topic_id=topic_id,
    )
    messages = [schemas.ChatMessage.model_validate(msg) for msg in raw_history]
    return {"messages": messages}


def _detect_language(request: schemas.ChatRequest) -> str:
    """Detect language from context or message content."""
    language = "en"
    if request.context:
        language = request.context.language or "en"
        if language == "en" and any("\u4e00" <= c <= "\u9fff" for c in request.message):
            language = "zh"
    return language


@router.get("/chat/models/{provider}")
async def get_provider_models(
    provider: str,
    api_key: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List available models for a specific AI provider."""
    if not api_key:
        settings = await crud.get_user_settings(db, current_user_id)
        api_key = resolve_api_key(None, settings, provider)

    models = await chat_service.list_models(provider, api_key=api_key)
    return {"provider": provider, "models": models}


@router.get("/stats/daily", response_model=schemas.DailyStats)
async def get_daily_learning_stats(
    target_date: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
):
    stats = await crud_stats.get_daily_stats(db=db, target_date=target_date, user_id=current_user_id)
    if not stats:
        return schemas.DailyStats(date=target_date.isoformat(), total_focus_minutes=0, total_sessions=0, sessions_by_theme={})
    return stats


@router.get("/stats/range", response_model=schemas.StatsRangeResponse)
async def get_learning_stats_range(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_stats_range(db=db, user_id=current_user_id, start_date=start_date, end_date=end_date)
