import os
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, List
import logging
import google.generativeai as genai
from .. import schemas
from .memory_service import memory_service
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class AIServiceProvider(ABC):
    """
    Abstract base class for AI service providers.
    Allows for easy integration of multiple AI backends (Gemini, OpenAI, etc.)
    """

    @abstractmethod
    def stream_chat(
        self,
        message: str,
        system_prompt: str,
        chat_history: Optional[List[schemas.ChatMessage]] = None,
        api_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Abstract method to stream chat responses.
        Note: Subclasses should NOT use 'async def' if they return an AsyncGenerator directly,
        or they should use 'async for' to yield.
        """
        pass


class GeminiProvider(AIServiceProvider):
    """
    Google Gemini implementation of the AI Service Provider.
    """

    def __init__(self):
        self.default_api_key = os.getenv("GOOGLE_API_KEY")
        self.model_name = "gemini-2.0-flash"
        self._configured_key = None
        self.model = None

    def _get_model(self, api_key: str):
        # Only re-configure if the key has changed
        if self._configured_key != api_key:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(self.model_name)
                self._configured_key = api_key
            except Exception as e:
                logger.error(f"Failed to configure Gemini: {e}")
                self.model = None
        return self.model

    async def stream_chat(
        self,
        message: str,
        system_prompt: str,
        chat_history: Optional[List[schemas.ChatMessage]] = None,
        api_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        current_key = api_key or self.default_api_key

        if not current_key:
            yield "Error: No Google API Key provided. Please set it in Settings."
            return

        model = self._get_model(current_key)
        if not model:
            yield "Error: Failed to initialize Gemini model."
            return

        # Construct prompt with history
        history_context = ""
        if chat_history:
            history_context = "\nRecent History:\n" + "\n".join(
                [f"{msg.role}: {msg.content}" for msg in chat_history]
            )

        full_prompt = f"{system_prompt}\n{history_context}\n\nUser: {message}\nAI:"

        try:
            response = await model.generate_content_async(full_prompt, stream=True)
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            yield f"Error generating response from Gemini: {str(e)}"


class AIChatService:
    """
    Manager class to handle AI interactions across different providers.
    Provides a unified interface for the rest of the application.
    """

    def __init__(self):
        self._providers = {
            "gemini": GeminiProvider(),
            # Future expansion examples:
            # "openai": OpenAIProvider(),
            # "anthropic": ClaudeProvider(),
        }
        self.default_provider = "gemini"

    async def stream_chat(
        self,
        message: str,
        system_prompt: str,
        chat_history: Optional[List[schemas.ChatMessage]] = None,
        api_key: Optional[str] = None,
        provider: Optional[str] = None,
        db: Optional[AsyncSession] = None,
        user_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Unified method to route chat requests to the appropriate provider.
        Integrates long-term memory retrieval.
        """
        provider_name = provider or self.default_provider
        service = self._providers.get(provider_name)

        if not service:
            yield f"Error: AI Provider '{provider_name}' not supported."
            return

        # 1. Retrieve Long-Term Memory if db and user_id are provided
        memory_context = ""
        if db and user_id:
            try:
                # Get relevant fragments
                fragments = await memory_service.search_memory(
                    user_id, message, db, limit=3
                )
                if fragments:
                    memory_context += "\nRelevant Long-Term Memories:\n"
                    for f in fragments:
                        memory_context += f"- {f.content}\n"

                # Get user profile facts/preferences
                profile = await memory_service.get_user_profile(user_id, db)
                if profile and profile.data:
                    facts = profile.data.get("facts", [])
                    prefs = profile.data.get("preferences", [])
                    if facts or prefs:
                        memory_context += "\nKnown User Information:\n"
                        if facts:
                            memory_context += f"Facts: {', '.join(facts)}\n"
                        if prefs:
                            memory_context += f"Preferences: {', '.join(prefs)}\n"
            except Exception as e:
                logger.error(f"Error retrieving memory: {e}")

        # 2. Inject memory into system prompt
        augmented_system_prompt = system_prompt
        if memory_context:
            augmented_system_prompt = (
                f"{system_prompt}\n\n[LONG-TERM MEMORY CONTEXT]\n{memory_context}"
            )

        # Route the request to the specific implementation
        async for chunk in service.stream_chat(
            message, augmented_system_prompt, chat_history, api_key
        ):
            yield chunk


# Singleton instance for the application
chat_service = AIChatService()
