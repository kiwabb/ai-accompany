"""
Memory context building utilities for chat service.
"""
from typing import Optional, List, Dict, Any


def build_user_profile_context(profile_data: Optional[Dict[str, Any]]) -> str:
    """
    Build the user profile context string for injection into system prompt.
    Returns empty string if no profile data.
    """
    if not profile_data:
        return ""

    facts = profile_data.get("facts", [])
    prefs = profile_data.get("preferences", [])

    if not facts and not prefs:
        return ""

    context = "\n[CORE USER PROFILE - ALWAYS ACTIVE]\n"
    context += "You are talking to a specific user. You MUST adapt your personality and responses to fit their profile:\n"

    if facts:
        context += f"FACTS: {', '.join(facts)}\n"
    if prefs:
        context += f"PREFERENCES: {', '.join(prefs)}\n"

    context += "(INSTRUCTION: You know these details about the user. 1. Use them to personalize every response. 2. If the user asks 'What do you know about me?' or 'What do I like?', LIST these facts explicitly.)\n"

    return context


def build_memory_fragments_context(fragments_data: List[Dict[str, Any]]) -> str:
    """
    Build the memory fragments context string for injection into system prompt.
    Returns empty string if no fragments.
    """
    if not fragments_data:
        return ""

    context = "\n[RELEVANT MEMORY FRAGMENTS]\n"
    context += "(Context from past conversations that might be relevant):\n"

    for fragment in fragments_data:
        content = (
            fragment.get("content")
            if isinstance(fragment, dict)
            else getattr(fragment, "content", "")
        )
        if content:
            context += f"- {content}\n"

    return context


def build_document_context(
    document_id: Optional[int],
    document_title: Optional[str],
    document_content: Optional[str]
) -> str:
    """
    Build document context string for injection into system prompt.
    Returns empty string if no document context.
    """
    if not document_id or not document_title:
        return ""

    context = "\n[DOCUMENT CONTEXT]\n"
    context += f"The user is currently reading a document titled: {document_title}\n"

    if document_content:
        content_preview = document_content[:1000]
        context += f"Document preview: {content_preview}...\n"

    context += "(INSTRUCTION: Use this document context to provide relevant responses to the user's questions about the document.)\n"

    return context


def augment_system_prompt(
    base_prompt: str,
    user_profile_context: str,
    memory_fragments_context: str,
    document_context: str = ""
) -> str:
    """
    Augment the base system prompt with memory and document contexts.
    """
    augmented = base_prompt

    if document_context:
        augmented += document_context

    if user_profile_context:
        augmented += f"\n{user_profile_context}"

    if memory_fragments_context:
        augmented += f"\n{memory_fragments_context}"

    return augmented
