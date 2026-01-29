from fastapi import APIRouter, Depends, Query, HTTPException, Header, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List, Optional

from ..database import get_db, AsyncSessionLocal
from .. import crud, schemas
from ..services.chat_service import chat_service
from ..services.memory_service import memory_service
from .users import get_current_user_id

router = APIRouter(prefix="/api", tags=["sessions"])

# ... (other routes remain the same)


def construct_system_prompt_here(
    context: Optional[schemas.ChatContext],
    daily_focus: int,
    daily_sessions: int,
    language: str,
    user_message: str,
) -> str:
    if context:
        ai_persona = context.ai_persona or "gentle_encourager"
        task_name = context.theme_name or "Focus"
        phase = context.phase or "focus"
        time_left = context.time_left or 0
    else:
        ai_persona = "gentle_encourager"
        task_name = "Focus"
        phase = "focus"
        time_left = 0

    phase_descriptions = {
        "focus": "working hard in a FOCUS session",
        "shortBreak": "taking a SHORT BREAK",
        "longBreak": "taking a LONG BREAK",
    }
    phase_desc = phase_descriptions.get(phase, "studying")

    persona_instructions = {
        "gentle_encourager": "Be warm, empathetic...",
        "strict_coach": "Be firm, direct...",
        "logical_analyst": "Be objective, analytical...",
        "humorous_buddy": "Be playful, witty...",
    }
    persona_inst = persona_instructions.get(
        ai_persona, persona_instructions["gentle_encourager"]
    )

    is_proactive = user_message.startswith("[SYSTEM_TRIGGER:")
    proactive_context = ""
    if is_proactive:
        parts = user_message.split(":", 1)
        if len(parts) > 1:
            trigger_type = parts[1].rstrip("]")
            proactive_context = f"Proactive trigger: {trigger_type}. "

    system_prompt = (
        f"You are CozyPal. Respond in {language}. Persona: {ai_persona} ({persona_inst}). "
        f"User is {phase_desc} for '{task_name}' with {time_left // 60} mins left. "
        f"Progress: {daily_focus} mins, {daily_sessions} sessions. {proactive_context}"
        f"Task: Give a brief, encouraging response (1-2 sentences)."
    )
    return system_prompt


async def response_generator_with_save(
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
    full_response = ""
    async for chunk in chat_service.stream_chat(
        message,
        system_prompt,
        chat_history=chat_history,
        api_key=api_key,
        db=db_session,
        user_id=user_id,
        provider=provider,
        model=model,
        document_id=document_id,
        document_title=document_title,
        document_content=document_content,
    ):
        full_response += chunk
        yield chunk

    if full_response:
        async with AsyncSessionLocal() as session:
            await crud.create_chat_message(
                session,
                role="ai",
                content=full_response,
                user_id=user_id,
                topic_id=topic_id,
            )

            async def process_memory_task(api_key, lang):
                async with AsyncSessionLocal() as mem_session:
                    await memory_service.process_exchange(
                        user_id=user_id,
                        topic_id=topic_id,
                        user_msg=message,
                        ai_msg=full_response,
                        db=mem_session,
                        api_key=api_key,
                        language=lang,
                    )

            background_tasks.add_task(
                process_memory_task, api_key=api_key, lang=language
            )


@router.post("/chat/completions")
async def chat_completions(
    request: schemas.ChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_google_api_key: Optional[str] = Header(None),
    current_user_id: str = Depends(get_current_user_id),
):
    daily_stats = await crud.get_daily_stats(db, date.today())
    daily_focus = daily_stats.total_focus_minutes if daily_stats else 0
    daily_sessions = daily_stats.total_sessions if daily_stats else 0

    raw_chat_history = await crud.get_recent_chat_history(
        db, user_id=current_user_id, limit=10, topic_id=request.topic_id
    )
    chat_history_for_llm = [
        schemas.ChatMessage.model_validate(msg) for msg in raw_chat_history
    ]

    context = request.context
    language = "en"
    if context:
        language = context.language or "en"
        if language == "en" and any("\u4e00" <= c <= "\u9fff" for c in request.message):
            language = "zh"

    # Get user settings to find the correct API key and default provider
    user_settings = await crud.get_user_settings(db, current_user_id)
    effective_provider = request.provider or (user_settings.ai_provider if user_settings else "gemini")
    
    # Determine the API key to use
    api_key_to_use = x_google_api_key
    if not api_key_to_use and user_settings:
        if effective_provider == "gemini":
            api_key_to_use = user_settings.google_api_key
        elif effective_provider == "gpt":
            api_key_to_use = user_settings.openai_api_key
        elif effective_provider == "deepseek":
            api_key_to_use = user_settings.deepseek_api_key
        elif effective_provider == "zhipu":
            api_key_to_use = user_settings.zhipu_api_key


    system_prompt = construct_system_prompt_here(
        context, daily_focus, daily_sessions, language, request.message
    )

    if not request.message.startswith("[SYSTEM_TRIGGER:"):
        await crud.create_chat_message(
            db,
            role="user",
            content=request.message,
            user_id=current_user_id,
            topic_id=request.topic_id,
        )

    return StreamingResponse(
        response_generator_with_save(
            request.message,
            system_prompt,
            chat_history_for_llm,
            api_key_to_use,
            db,
            current_user_id,
            request.topic_id,
            background_tasks,
            language,
            request.provider,
            request.model,
            request.document_id,
            request.document_title,
            request.document_content,
        ),
        media_type="text/plain",
    )


@router.get("/chat/models/{provider}")
async def get_provider_models(
    provider: str,
    api_key: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List available models for a specific AI provider."""
    # If no API key is provided, try to fetch it from user settings
    if not api_key:
        from .. import crud
        settings = await crud.get_user_settings(db, current_user_id)
        if settings:
            if provider == "gemini":
                api_key = settings.google_api_key
            elif provider == "gpt":
                api_key = settings.openai_api_key
            elif provider == "deepseek":
                api_key = settings.deepseek_api_key
            elif provider == "zhipu":
                api_key = settings.zhipu_api_key
    
    models = await chat_service.list_models(provider, api_key=api_key)
    return {"provider": provider, "models": models}


@router.get("/stats/daily", response_model=schemas.DailyStats)
async def get_daily_learning_stats(
    target_date: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
):
    stats = await crud.get_daily_stats(db=db, target_date=target_date)
    if not stats:
        return schemas.DailyStats(
            date=target_date.isoformat(),
            total_focus_minutes=0,
            total_sessions=0,
            sessions_by_theme={},
        )
    return stats
