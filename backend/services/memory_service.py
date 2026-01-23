import os
import json
import logging
import asyncio
from typing import Optional, Dict, Any, List
from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .. import models

logger = logging.getLogger(__name__)


class MemoryService:
    def __init__(self):
        self._client = None
        self.extraction_model_name = "gemini-2.0-flash"
        self.embedding_model_name = "text-embedding-004"

    @property
    def client(self) -> genai.Client:
        """Lazy initialization of the GenAI client."""
        if self._client is None:
            # The SDK picks up GOOGLE_API_KEY from the environment automatically.
            # If missing, it will raise a ValueError when first accessed.
            self._client = genai.Client()
        return self._client

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
        Runs extraction and embedding in parallel for better performance.
        """
        extraction_task = self._extract_memory(user_msg, ai_msg)
        embedding_task = self.generate_embedding(user_msg)

        extracted_data, embedding = await asyncio.gather(
            extraction_task, embedding_task
        )

        if extracted_data:
            await self._update_user_profile(user_id, extracted_data, db)

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
You are an expert in memory extraction for an AI life companion. 
Distill the following exchange into structured memory fragments.

CATEGORIES:
1. "facts": Long-term information about the user (e.g., career, location, goals).
2. "preferences": Specific likes, dislikes, or habits.
3. "emotional_state": The user's current mood or emotional tone.

Exchange:
User: {user_msg}
AI: {ai_msg}

Output MUST be a strictly valid JSON object.
"""
        try:
            response = await self.client.aio.models.generate_content(
                model=self.extraction_model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            return json.loads(response.text)
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

        # Merge facts and preferences with basic deduplication
        for key in ["facts", "preferences"]:
            if key in extracted_data and isinstance(extracted_data[key], list):
                existing = current_data.get(key, [])
                for item in extracted_data[key]:
                    if item not in existing:
                        existing.append(item)
                current_data[key] = existing

        if "emotional_state" in extracted_data:
            current_data["last_emotional_state"] = extracted_data["emotional_state"]

        profile.data = current_data
        db.add(profile)

    async def generate_embedding(self, text: str) -> List[float]:
        try:
            response = await self.client.aio.models.embed_content(
                model=self.embedding_model_name,
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            embedding = response.embeddings[0].values

            # Normalize to 1536 dimensions as required by the database schema
            if len(embedding) < 1536:
                embedding = embedding + [0.0] * (1536 - len(embedding))
            elif len(embedding) > 1536:
                embedding = embedding[:1536]

            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 1536

    async def search_memory(
        self, user_id: str, query_text: str, db: AsyncSession, limit: int = 5
    ) -> List[models.MemoryFragment]:
        query_embedding = await self.generate_embedding(query_text)
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
        result = await db.execute(
            select(models.UserProfile).where(models.UserProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()


memory_service = MemoryService()
