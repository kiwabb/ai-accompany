import os
import json
import logging
import asyncio
from typing import Optional, Dict, Any, List
import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .. import models

logger = logging.getLogger(__name__)


class MemoryService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)

        # gemini-2.0-flash is used for extraction
        self.extraction_model_name = "gemini-2.0-flash"
        # models/embedding-001 is used for embeddings (Note: defaults to 768 dims in some docs, but we need 1536)
        self.embedding_model_name = "models/embedding-001"
        self._extraction_model = None

    @property
    def extraction_model(self):
        if not self._extraction_model:
            self._extraction_model = genai.GenerativeModel(self.extraction_model_name)
        return self._extraction_model

    async def process_exchange(
        self,
        user_id: str,
        topic_id: Optional[int],
        user_msg: str,
        ai_msg: str,
        db: AsyncSession,
    ) -> models.MemoryFragment:
        """
        Processes a chat exchange to extract memory and update user profile.
        """
        # 1. Extract memory using LLM
        extracted_data = await self._extract_memory(user_msg, ai_msg)

        # 2. Update UserProfile
        if extracted_data:
            await self._update_user_profile(user_id, extracted_data, db)

        # 3. Generate embedding and create MemoryFragment
        # Using the user message for embedding as it often contains the core intent
        embedding = await self.generate_embedding(user_msg)

        combined_content = f"User: {user_msg}\nAI: {ai_msg}"

        fragment = models.MemoryFragment(
            user_id=user_id,
            topic_id=topic_id,
            content=combined_content,
            embedding=embedding,
            metadata_={
                "extracted_facts": extracted_data.get("facts", []),
                "extracted_preferences": extracted_data.get("preferences", []),
                "extracted_emotional_state": extracted_data.get("emotional_state", ""),
            },
        )
        db.add(fragment)
        await db.commit()
        await db.refresh(fragment)
        return fragment

    async def _extract_memory(self, user_msg: str, ai_msg: str) -> Dict[str, Any]:
        prompt = f"""
Extract factual information, user preferences/habits, and emotional state from the following exchange.
Format the output as a strictly valid JSON object with keys: "facts", "preferences", "emotional_state".
"facts" and "preferences" should be lists of strings. "emotional_state" should be a string.

Exchange:
User: {user_msg}
AI: {ai_msg}

JSON Output:
"""
        response = None
        try:
            response = await self.extraction_model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json"
                ),
            )
            return json.loads(response.text)
        except json.JSONDecodeError as e:
            logger.error(
                f"Invalid JSON from LLM: {e}. Content: {getattr(response, 'text', 'N/A')}"
            )
            return {}
        except Exception as e:
            logger.error(f"Error extracting memory: {e}")
            return {}

    async def _update_user_profile(
        self, user_id: str, extracted_data: Dict[str, Any], db: AsyncSession
    ):
        result = await db.execute(
            select(models.UserProfile).where(models.UserProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            profile = models.UserProfile(user_id=user_id, data={})
            db.add(profile)

        current_data = dict(profile.data) if profile.data else {}

        # Merge facts
        if "facts" in extracted_data and isinstance(extracted_data["facts"], list):
            existing_facts = current_data.get("facts", [])
            for fact in extracted_data["facts"]:
                if fact not in existing_facts:
                    existing_facts.append(fact)
            current_data["facts"] = existing_facts

        # Merge preferences
        if "preferences" in extracted_data and isinstance(
            extracted_data["preferences"], list
        ):
            existing_prefs = current_data.get("preferences", [])
            for pref in extracted_data["preferences"]:
                if pref not in existing_prefs:
                    existing_prefs.append(pref)
            current_data["preferences"] = existing_prefs

        # Update emotional state
        if "emotional_state" in extracted_data:
            current_data["last_emotional_state"] = extracted_data["emotional_state"]

        profile.data = current_data
        db.add(profile)

    async def generate_embedding(self, text: str) -> List[float]:
        try:
            # Using genai.embed_content. Note: In a production async environment,
            # this might need to be run in a thread pool if it's blocking.
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: genai.embed_content(
                    model=self.embedding_model_name,
                    content=text,
                    task_type="retrieval_document",
                ),
            )
            embedding = result["embedding"]

            # If the dimension is not 1536, we might need to pad it to satisfy DB constraints
            # if the instructions specifically mentioned 1536 for this model.
            if len(embedding) < 1536:
                embedding = embedding + [0.0] * (1536 - len(embedding))
            elif len(embedding) > 1536:
                embedding = embedding[:1536]

            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 1536  # Fallback

    async def search_memory(
        self, user_id: str, query_text: str, db: AsyncSession, limit: int = 5
    ) -> List[models.MemoryFragment]:
        """
        Performs a vector search to find relevant memory fragments.
        """
        query_embedding = await self.generate_embedding(query_text)

        # Vector similarity search using pgvector
        # Note: cosine_distance is <-> in pgvector, but sqlalchemy integration uses .cosine_distance()
        stmt = (
            select(models.MemoryFragment)
            .where(models.MemoryFragment.user_id == user_id)
            .order_by(models.MemoryFragment.embedding.cosine_distance(query_embedding))
            .limit(limit)
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_user_profile(
        self, user_id: str, db: AsyncSession
    ) -> Optional[models.UserProfile]:
        """
        Retrieves the user profile.
        """
        result = await db.execute(
            select(models.UserProfile).where(models.UserProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()


memory_service = MemoryService()
