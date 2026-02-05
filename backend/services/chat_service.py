import os
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, List
import logging
from google import genai
from google.genai import types
from openai import AsyncOpenAI
from .. import schemas
from .memory_service import memory_service
from .memory_context_builder import (
    build_user_profile_context,
    build_memory_fragments_context,
    build_document_context,
    augment_system_prompt,
)
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class AIServiceProvider(ABC):
    """Abstract base class for AI service providers."""

    @abstractmethod
    def stream_chat(
        self,
        message: str,
        system_prompt: str,
        chat_history: Optional[List[schemas.ChatMessage]] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        pass

    @abstractmethod
    async def list_models(self, api_key: Optional[str] = None) -> List[str]:
        pass


class GeminiProvider(AIServiceProvider):
    """Google Gemini implementation of the AI Service Provider."""

    def __init__(self):
        self.default_model_name = "gemini-2.0-flash"

    def _get_client(self, api_key: str) -> genai.Client:
        return genai.Client(api_key=api_key)

    async def stream_chat(
        self,
        message: str,
        system_prompt: str,
        chat_history: Optional[List[schemas.ChatMessage]] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        current_key = api_key or os.getenv("GOOGLE_API_KEY")
        target_model = model or self.default_model_name

        if not current_key:
            yield "Error: No Google API Key provided. Please set it in Settings."
            return

        try:
            client = self._get_client(current_key)
            contents = []

            if chat_history:
                for msg in chat_history:
                    role = "user" if msg.role == "user" else "model"
                    contents.append(
                        types.Content(role=role, parts=[types.Part(text=msg.content)])
                    )

            contents.append(
                types.Content(role="user", parts=[types.Part(text=message)])
            )

            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
            )

            async for chunk in await client.aio.models.generate_content_stream(
                model=target_model, contents=contents, config=config
            ):
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            yield f"Error generating response from Gemini: {str(e)}"

    async def list_models(self, api_key: Optional[str] = None) -> List[str]:
        current_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not current_key:
            return []
        try:
            client = self._get_client(current_key)
            models = []
            for m in client.models.list():
                if m.name and m.supported_actions and "generateContent" in m.supported_actions:
                    name = m.name
                    if name.startswith("models/"):
                        name = name.split("/", 1)[1]
                    models.append(name)
            return sorted(models)
        except Exception as e:
            logger.error(f"Failed to list Gemini models: {e}")
            return []


class OpenAICompatibleProvider(AIServiceProvider):
    """Generic OpenAI-compatible implementation (OpenAI, DeepSeek, Zhipu, Ollama)."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: str = "gpt-4o-mini",
        api_key_env_var: Optional[str] = None,
    ):
        self.base_url = base_url
        self.default_model = default_model
        self.api_key_env_var = api_key_env_var
        self.default_api_key = os.getenv(api_key_env_var) if api_key_env_var else None

    async def stream_chat(
        self,
        message: str,
        system_prompt: str,
        chat_history: Optional[List[schemas.ChatMessage]] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        current_key = api_key or self.default_api_key
        target_model = model or self.default_model

        if not current_key and self.api_key_env_var != "OLLAMA_API_KEY":
            yield f"Error: No API Key provided for {self.api_key_env_var}. Please set it in Settings."
            return

        client = AsyncOpenAI(api_key=current_key or "ollama", base_url=self.base_url)
        is_zhipu = self.api_key_env_var == "ZHIPU_API_KEY"

        messages = self._build_messages(system_prompt, chat_history, message, is_zhipu)

        try:
            stream = await client.chat.completions.create(
                model=target_model, messages=messages, stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI compatible API error: {e}")
            yield f"Error generating response: {str(e)}"

    def _build_messages(
        self,
        system_prompt: str,
        chat_history: Optional[List[schemas.ChatMessage]],
        message: str,
        is_zhipu: bool
    ) -> list:
        messages = []

        if is_zhipu:
            messages.append({
                "role": "user",
                "content": f"[SYSTEM INSTRUCTIONS - Please follow these guidelines in all responses]\n{system_prompt}\n\n[END OF SYSTEM INSTRUCTIONS]",
            })
            messages.append({
                "role": "assistant",
                "content": "我明白了，我会遵循这些指导原则。" if "zh" in system_prompt[:200].lower()
                else "Understood. I will follow these guidelines.",
            })
        else:
            messages.append({"role": "system", "content": system_prompt})

        if chat_history:
            for msg in chat_history:
                role = "assistant" if msg.role == "ai" else msg.role
                messages.append({"role": role, "content": msg.content})

        messages.append({"role": "user", "content": message})
        return messages

    async def list_models(self, api_key: Optional[str] = None) -> List[str]:
        current_key = api_key or self.default_api_key
        if not current_key and self.api_key_env_var != "OLLAMA_API_KEY":
            return []
        try:
            client = AsyncOpenAI(api_key=current_key or "ollama", base_url=self.base_url)
            models_resp = await client.models.list()
            return sorted([m.id for m in models_resp.data])
        except Exception as e:
            logger.error(f"Failed to list models for {self.api_key_env_var}: {e}")
            return []


class AIChatService:
    """Manager class to handle AI interactions across different providers."""

    def __init__(self):
        self._providers = {
            "gemini": GeminiProvider(),
            "gpt": OpenAICompatibleProvider(default_model="gpt-4o-mini", api_key_env_var="OPENAI_API_KEY"),
            "deepseek": OpenAICompatibleProvider(
                base_url="https://api.deepseek.com/v1",
                default_model="deepseek-chat",
                api_key_env_var="DEEPSEEK_API_KEY",
            ),
            "zhipu": OpenAICompatibleProvider(
                base_url="https://open.bigmodel.cn/api/paas/v4/",
                default_model="glm-4",
                api_key_env_var="ZHIPU_API_KEY",
            ),
            "ollama": OpenAICompatibleProvider(
                base_url="http://localhost:11434/v1",
                default_model="llama3",
                api_key_env_var="OLLAMA_API_KEY",
            ),
        }
        self.default_provider = os.getenv("DEFAULT_AI_PROVIDER", "gemini")

    async def stream_chat(
        self,
        message: str,
        system_prompt: str,
        chat_history: Optional[List[schemas.ChatMessage]] = None,
        api_key: Optional[str] = None,
        provider: Optional[str] = None,
        db: Optional[AsyncSession] = None,
        user_id: Optional[str] = None,
        model: Optional[str] = None,
        document_id: Optional[int] = None,
        document_title: Optional[str] = None,
        document_content: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        provider_name = provider or self.default_provider
        service = self._providers.get(provider_name)

        if not service:
            yield f"Error: AI Provider '{provider_name}' not supported."
            return

        # Retrieve memory and build augmented prompt
        memory_data = await self._retrieve_memory_context(db, user_id, message)
        augmented_prompt = augment_system_prompt(
            system_prompt,
            memory_data["user_profile_context"],
            memory_data["memory_fragments_context"],
            build_document_context(document_id, document_title, document_content),
        )

        # Store diagnostics
        if user_id:
            memory_service.store_diagnostics(user_id, {
                "system_prompt": system_prompt,
                "memory_fragments": memory_data["fragments_for_diag"],
                "user_profile": memory_data["profile_for_diag"],
                "full_prompt": augmented_prompt,
                "is_final": False,
            })

        async for chunk in service.stream_chat(message, augmented_prompt, chat_history, api_key, model):
            yield chunk

    async def _retrieve_memory_context(
        self, db: Optional[AsyncSession], user_id: Optional[str], message: str
    ) -> dict:
        """Retrieve user profile and memory fragments for context."""
        result = {
            "user_profile_context": "",
            "memory_fragments_context": "",
            "fragments_for_diag": [],
            "profile_for_diag": {},
        }

        if not db or not user_id:
            return result

        try:
            profile = await memory_service.get_user_profile(user_id, db)
            if profile and profile.data:
                result["profile_for_diag"] = profile.data
                result["user_profile_context"] = build_user_profile_context(profile.data)

            fragments = await memory_service.search_memory(user_id, message, db, limit=3, include_scores=True)
            result["fragments_for_diag"] = fragments
            result["memory_fragments_context"] = build_memory_fragments_context(fragments)
        except Exception as e:
            logger.error(f"Error retrieving memory: {e}")

        return result

    async def list_models(self, provider: str, api_key: Optional[str] = None) -> List[str]:
        service = self._providers.get(provider)
        if not service:
            return []
        return await service.list_models(api_key=api_key)


chat_service = AIChatService()
