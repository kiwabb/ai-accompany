import json
import logging
import asyncio
from typing import Optional, Dict, Any, List
from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .. import models
from .memory_prompts import build_extraction_prompt
from .profile_updater import update_user_profile
from .embedding_utils import generate_embedding as gen_embedding, format_memory_result

logger = logging.getLogger(__name__)


class MemoryService:
    def __init__(self):
        self.client = None
        self.extraction_model_name = "gemini-2.0-flash"
        self.embedding_model_name = "text-embedding-004"
        self.last_exchanges: Dict[str, Any] = {}

    def store_diagnostics(self, user_id: str, data: Dict[str, Any]):
        from datetime import datetime
        data["timestamp"] = datetime.now().isoformat()
        self.last_exchanges[user_id] = data

    def get_diagnostics(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.last_exchanges.get(user_id)

    def get_client(self, api_key: Optional[str] = None) -> genai.Client:
        if api_key:
            return genai.Client(api_key=api_key)
        if self.client is None:
            self.client = genai.Client()
        return self.client

    async def generate_embedding(self, text: str, api_key: Optional[str] = None) -> List[float]:
        client = self.get_client(api_key)
        return await gen_embedding(client, text, self.embedding_model_name)

    async def process_exchange(
        self, user_id: str, topic_id: Optional[int], user_msg: str, ai_msg: str,
        db: AsyncSession, api_key: Optional[str] = None, language: str = "en",
    ) -> models.MemoryFragment:
        client = self.get_client(api_key)
        extraction_task = self._extract_memory(client, user_id, user_msg, ai_msg, language)
        embedding_task = self.generate_embedding(user_msg, api_key)
        extracted_data_raw, embedding = await asyncio.gather(extraction_task, embedding_task)

        extracted_data = self._normalize_extracted_data(extracted_data_raw)

        if extracted_data:
            await update_user_profile(user_id, extracted_data, db)
            await self._update_diagnostics_after_extraction(user_id, db)

        fragment = await self._create_fragment(user_id, topic_id, user_msg, ai_msg, embedding, extracted_data, db)
        self._update_diagnostics_with_fragment(user_id, fragment)
        return fragment

    def _normalize_extracted_data(self, data_raw) -> Dict[str, Any]:
        if isinstance(data_raw, dict):
            return data_raw
        if isinstance(data_raw, list) and len(data_raw) > 0 and isinstance(data_raw[0], dict):
            return data_raw[0]
        return {}

    async def _update_diagnostics_after_extraction(self, user_id: str, db: AsyncSession):
        current_diag = self.get_diagnostics(user_id)
        if current_diag:
            profile = await self.get_user_profile(user_id, db)
            if profile and profile.data:
                current_diag["user_profile"] = profile.data
            current_diag["is_final"] = True
            self.store_diagnostics(user_id, current_diag)

    async def _create_fragment(
        self, user_id: str, topic_id: Optional[int], user_msg: str, ai_msg: str,
        embedding: List[float], extracted_data: Dict, db: AsyncSession
    ) -> models.MemoryFragment:
        fragment = models.MemoryFragment(
            user_id=user_id, topic_id=topic_id, content=f"User: {user_msg}\nAI: {ai_msg}",
            embedding=embedding, metadata_={
                "extracted_facts": extracted_data.get("facts", []),
                "extracted_preferences": extracted_data.get("preferences", []),
                "extracted_emotional_state": extracted_data.get("emotional_state", ""),
            },
        )
        db.add(fragment)
        await db.commit()
        await db.refresh(fragment)
        return fragment

    def _update_diagnostics_with_fragment(self, user_id: str, fragment: models.MemoryFragment):
        current_diag = self.get_diagnostics(user_id)
        if current_diag:
            if "memory_fragments" not in current_diag:
                current_diag["memory_fragments"] = []
            current_diag["memory_fragments"].append({"id": fragment.id, "content": fragment.content, "score": 1.0})
            self.store_diagnostics(user_id, current_diag)

    async def _extract_memory(self, client: genai.Client, user_id: str, user_msg: str, ai_msg: str, language: str) -> Dict:
        prompt = build_extraction_prompt(user_msg, ai_msg, language)
        try:
            response = await client.aio.models.generate_content(
                model=self.extraction_model_name, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            if response and response.text:
                text = str(response.text).strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                logger.info(f"Extracted data for {user_id}: {text}")
                return json.loads(text)
            return {}
        except Exception as e:
            logger.error(f"Error extracting memory for {user_id}: {e}")
            return {}

    async def search_memory(
        self, user_id: str, query_text: str, db: AsyncSession,
        limit: int = 5, api_key: Optional[str] = None, include_scores: bool = False,
    ) -> List[Any]:
        query_embedding = await self.generate_embedding(query_text, api_key)
        if include_scores:
            from sqlalchemy import text
            stmt = text("SELECT id, content, embedding <=> :emb as distance FROM memory_fragments WHERE user_id = :uid ORDER BY distance ASC LIMIT :limit")
            result = await db.execute(stmt, {"emb": str(query_embedding), "uid": user_id, "limit": limit})
            return [format_memory_result(row) for row in result]

        stmt = select(models.MemoryFragment).where(models.MemoryFragment.user_id == user_id).order_by(
            models.MemoryFragment.embedding.cosine_distance(query_embedding)).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_user_profile(self, user_id: str, db: AsyncSession) -> Optional[models.UserProfile]:
        result = await db.execute(select(models.UserProfile).where(models.UserProfile.user_id == user_id))
        return result.scalar_one_or_none()


memory_service = MemoryService()
