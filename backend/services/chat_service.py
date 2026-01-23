import os
import google.generativeai as genai
from typing import AsyncGenerator, Optional
from .. import schemas
import logging

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        self.default_api_key = os.getenv("GOOGLE_API_KEY")
        self.model = None
        if self.default_api_key:
            self._configure_model(self.default_api_key)
        else:
            logger.warning(
                "GOOGLE_API_KEY not set in env. Chat features will require a key per request."
            )

    def _configure_model(self, api_key: str):
        try:
            genai.configure(api_key=api_key)
            # Fallback to gemini-1.5-flash which is the latest stable.
            # If that fails, the list_models script would be needed to debug further.
            self.model = genai.GenerativeModel("gemini-2.0-flash")
        except Exception as e:
            logger.error(f"Failed to configure Gemini: {e}")
            self.model = None

    async def stream_chat(
        self,
        message: str,
        system_prompt: str,
        chat_history: Optional[list[schemas.ChatMessage]] = None,
        api_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        # Determine which key to use
        current_key = api_key or self.default_api_key

        if not current_key:
            yield "Error: No API Key provided. Please set it in Settings or backend/.env."
            return

        # If a specific key is provided (and different from default), reconfigure temporarily?
        # WARNING: genai.configure is global. Reconfiguring changes it for the process.
        # For a single-user local app, this is acceptable.
        # We reconfigure if the provided key is different from what might be currently active (simplification: always configure if passed)
        if api_key:
            self._configure_model(api_key)
        elif not self.model and self.default_api_key:
            self._configure_model(self.default_api_key)

        if not self.model:
            yield "Error: Failed to initialize AI model."
            return

        # Construct full prompt with history
        history_context = ""
        if chat_history:
            history_context = "\nRecent History:\n" + "\n".join(
                [f"{msg.role}: {msg.content}" for msg in chat_history]
            )

        full_prompt = f"{system_prompt}\n{history_context}\n\nUser: {message}\nAI:"

        try:
            # stream=True returns a generator
            response = await self.model.generate_content_async(full_prompt, stream=True)
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            yield f"Error generating response: {str(e)}"


# Singleton instance
chat_service = GeminiService()
