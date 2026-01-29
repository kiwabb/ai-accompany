import os
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, List
import logging
import google.generativeai as genai
from openai import AsyncOpenAI
import json
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
        model: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Abstract method to stream chat responses.
        Note: Subclasses should NOT use 'async def' if they return an AsyncGenerator directly,
        or they should use 'async for' to yield.
        """
        pass

    @abstractmethod
    async def list_models(self, api_key: Optional[str] = None) -> List[str]:
        """
        Abstract method to list available models for the provider.
        """
        pass


class GeminiProvider(AIServiceProvider):
    """
    Google Gemini implementation of the AI Service Provider.
    """

    def __init__(self):
        self.default_model_name = "gemini-2.0-flash"
        self._configured_key = None
        self.model = None

    def _get_model_instance(self, api_key: str, model_name: str, system_instruction: Optional[str] = None):
        # Always re-instantiate if system_instruction is provided to ensure it's applied
        return genai.GenerativeModel(
            model_name, system_instruction=system_instruction
        )

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

        # Configure API key
        genai.configure(api_key=current_key)
        
        # Pass system_prompt directly to model instantiation for better adherence
        model_inst = self._get_model_instance(current_key, target_model, system_instruction=system_prompt)
        if not model_inst:
            yield "Error: Failed to initialize Gemini model."
            return

        # Construct structured contents list instead of raw string
        contents = []
        if chat_history:
            for msg in chat_history:
                role = "user" if msg.role == "user" else "model"
                contents.append({"role": role, "parts": [msg.content]})

        # Add current user message
        contents.append({"role": "user", "parts": [message]})

        try:
            # Use the contents list which preserves conversational structure
            response = await model_inst.generate_content_async(contents, stream=True)
            async for chunk in response:
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
            genai.configure(api_key=current_key)
            models = []
            for m in genai.list_models():
                if "generateContent" in m.supported_generation_methods:
                    models.append(m.name.replace("models/", ""))
            return sorted(models)
        except Exception as e:
            logger.error(f"Failed to list Gemini models: {e}")
            return []


class OpenAICompatibleProvider(AIServiceProvider):
    """
    Generic OpenAI-compatible implementation of the AI Service Provider.
    Works for OpenAI, DeepSeek, Zhipu, Ollama, etc.
    """

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

        # Special handling for Ollama which often doesn't need a key
        if not current_key and self.api_key_env_var != "OLLAMA_API_KEY":
            yield f"Error: No API Key provided for {self.api_key_env_var}. Please set it in Settings."
            return

        client = AsyncOpenAI(api_key=current_key or "ollama", base_url=self.base_url)

        # Zhipu AI doesn't support "system" role - convert to user message with meta-instructions
        is_zhipu = self.api_key_env_var == "ZHIPU_API_KEY"
        
        messages = []
        if is_zhipu:
            # For Zhipu: Add system prompt as first user message with meta-instruction
            messages.append({
                "role": "user",
                "content": f"[SYSTEM INSTRUCTIONS - Please follow these guidelines in all responses]\n{system_prompt}\n\n[END OF SYSTEM INSTRUCTIONS]"
            })
            # Add a brief assistant acknowledgment
            messages.append({
                "role": "assistant",
                "content": "我明白了，我会遵循这些指导原则。" if "zh" in system_prompt[:200].lower() else "Understood. I will follow these guidelines."
            })
        else:
            # Standard OpenAI format for other providers
            messages.append({"role": "system", "content": system_prompt})
        
        if chat_history:
            for msg in chat_history:
                # Normalize roles for Zhipu and other OpenAI-compatible providers
                # Database uses "ai" but OpenAI format expects "assistant"
                role = msg.role
                if is_zhipu or role == "ai":
                    role = "assistant" if role == "ai" else role
                messages.append({"role": role, "content": msg.content})

        messages.append({"role": "user", "content": message})

        try:
            stream = await client.chat.completions.create(
                model=target_model,
                messages=messages,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI compatible API error: {e}")
            yield f"Error generating response: {str(e)}"

    async def list_models(self, api_key: Optional[str] = None) -> List[str]:
        current_key = api_key or self.default_api_key
        # Special handling for Ollama 
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
    """
    Manager class to handle AI interactions across different providers.
    Provides a unified interface for the rest of the application.
    """

    def __init__(self):
        self._providers = {
            "gemini": GeminiProvider(),
            "gpt": OpenAICompatibleProvider(
                default_model="gpt-4o-mini", api_key_env_var="OPENAI_API_KEY"
            ),
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
        user_profile_context = ""
        memory_fragments_context = ""

        memory_fragments_for_diag = []
        user_profile_for_diag = {}

        if db and user_id:
            try:
                # A. Always get User Profile (CORE MEMORY) - Force Injection
                profile = await memory_service.get_user_profile(user_id, db)
                if profile and profile.data:
                    user_profile_for_diag = profile.data
                    facts = profile.data.get("facts", [])
                    prefs = profile.data.get("preferences", [])

                    if facts or prefs:
                        user_profile_context = "\n[CORE USER PROFILE - ALWAYS ACTIVE]\n"
                        user_profile_context += "You are talking to a specific user. You MUST adapt your personality and responses to fit their profile:\n"
                        if facts:
                            user_profile_context += f"FACTS: {', '.join(facts)}\n"
                        if prefs:
                            user_profile_context += f"PREFERENCES: {', '.join(prefs)}\n"
                        user_profile_context += "(INSTRUCTION: You know these details about the user. 1. Use them to personalize every response. 2. If the user asks 'What do you know about me?' or 'What do I like?', LIST these facts explicitly.)\n"

                # B. Get relevant fragments (CONTEXTUAL MEMORY)
                fragments_data = await memory_service.search_memory(
                    user_id, message, db, limit=3, include_scores=True
                )
                memory_fragments_for_diag = fragments_data

                if fragments_data:
                    memory_fragments_context += "\n[RELEVANT MEMORY FRAGMENTS]\n"
                    memory_fragments_context += (
                        "(Context from past conversations that might be relevant):\n"
                    )
                    for f in fragments_data:
                        memory_fragments_context += f"- {f['content']}\n"

            except Exception as e:
                logger.error(f"Error retrieving memory: {e}")

        # 2. Inject memory into system prompt with strict hierarchy
        augmented_system_prompt = system_prompt

        # Add document context if provided
        if document_id and document_title:
            document_context = f"\n[DOCUMENT CONTEXT]\n"
            document_context += f"The user is currently reading a document titled: {document_title}\n"
            if document_content:
                # Add a summary of the document content
                content_preview = document_content[:1000]  # Limit to first 1000 characters
                document_context += f"Document preview: {content_preview}...\n"
            document_context += "(INSTRUCTION: Use this document context to provide relevant responses to the user's questions about the document.)\n"
            augmented_system_prompt += document_context

        if user_profile_context:
            augmented_system_prompt += f"\n{user_profile_context}"

        if memory_fragments_context:
            augmented_system_prompt += f"\n{memory_fragments_context}"

        # 3. Store diagnostics
        if user_id:
            memory_service.store_diagnostics(
                user_id,
                {
                    "system_prompt": system_prompt,
                    "memory_fragments": memory_fragments_for_diag,
                    "user_profile": user_profile_for_diag,
                    "full_prompt": augmented_system_prompt,
                    "is_final": False,
                },
            )

        # Route the request to the specific implementation
        async for chunk in service.stream_chat(
            message, augmented_system_prompt, chat_history, api_key, model=model
        ):
            yield chunk

    async def list_models(self, provider: str, api_key: Optional[str] = None) -> List[str]:
        """
        List available models for a specific provider.
        """
        service = self._providers.get(provider)
        if not service:
            return []
        return await service.list_models(api_key=api_key)


chat_service = AIChatService()
