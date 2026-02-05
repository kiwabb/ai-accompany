"""
System prompt builder for chat service.
"""
from typing import Optional
from .. import schemas


def construct_system_prompt(
    context: Optional[schemas.ChatContext],
    daily_focus: int,
    daily_sessions: int,
    language: str,
    user_message: str,
) -> str:
    """Build the system prompt for CozyPal based on context."""
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

    phase_desc = _get_phase_description(phase)
    persona_inst = _get_persona_instructions(ai_persona)
    proactive_context = _get_proactive_context(user_message)

    return (
        f"You are CozyPal. Respond in {language}. Persona: {ai_persona} ({persona_inst}). "
        f"User is {phase_desc} for '{task_name}' with {time_left // 60} mins left. "
        f"Progress: {daily_focus} mins, {daily_sessions} sessions. {proactive_context}"
        f"Task: Give a brief, encouraging response (1-2 sentences)."
    )


def _get_phase_description(phase: str) -> str:
    """Get the description for the current timer phase."""
    descriptions = {
        "focus": "working hard in a FOCUS session",
        "shortBreak": "taking a SHORT BREAK",
        "longBreak": "taking a LONG BREAK",
    }
    return descriptions.get(phase, "studying")


def _get_persona_instructions(persona: str) -> str:
    """Get the instructions for the AI persona."""
    instructions = {
        "gentle_encourager": "Be warm, empathetic...",
        "strict_coach": "Be firm, direct...",
        "logical_analyst": "Be objective, analytical...",
        "humorous_buddy": "Be playful, witty...",
    }
    return instructions.get(persona, instructions["gentle_encourager"])


def _get_proactive_context(user_message: str) -> str:
    """Extract proactive context from system trigger messages."""
    if not user_message.startswith("[SYSTEM_TRIGGER:"):
        return ""

    parts = user_message.split(":", 1)
    if len(parts) > 1:
        trigger_type = parts[1].rstrip("]")
        return f"Proactive trigger: {trigger_type}. "
    return ""
