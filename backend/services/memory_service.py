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
        # Store for the last exchange metadata (per user, for debugging)
        self.last_exchanges: Dict[str, Any] = {}

    def store_diagnostics(self, user_id: str, data: Dict[str, Any]):
        """Simple memory-based store for the last exchange diagnostics."""
        from datetime import datetime

        data["timestamp"] = datetime.now().isoformat()
        self.last_exchanges[user_id] = data

    def get_diagnostics(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the last exchange diagnostics for a specific user."""
        return self.last_exchanges.get(user_id)

    def get_client(self, api_key: Optional[str] = None) -> genai.Client:
        if api_key:
            return genai.Client(api_key=api_key)
        if self._client is None:
            self._client = genai.Client()
        return self._client

    async def process_exchange(
        self,
        user_id: str,
        topic_id: Optional[int],
        user_msg: str,
        ai_msg: str,
        db: AsyncSession,
        api_key: Optional[str] = None,
        language: str = "en",
    ) -> models.MemoryFragment:
        client = self.get_client(api_key)
        extraction_task = self._extract_memory(
            client, user_id, user_msg, ai_msg, language
        )
        embedding_task = self.generate_embedding(user_msg, api_key)

        extracted_data_raw, embedding = await asyncio.gather(
            extraction_task, embedding_task
        )

        # Ensure extracted_data is a dictionary
        extracted_data = {}
        if isinstance(extracted_data_raw, dict):
            extracted_data = extracted_data_raw
        elif isinstance(extracted_data_raw, list) and len(extracted_data_raw) > 0:
            if isinstance(extracted_data_raw[0], dict):
                extracted_data = extracted_data_raw[0]

        if extracted_data:
            await self._update_user_profile(user_id, extracted_data, db)

            # Update diagnostics store with the RESULT of the extraction
            # This ensures frontend's polling sees the new data immediately
            current_diag = self.get_diagnostics(user_id)
            if current_diag:
                current_diag["user_profile"] = (
                    extracted_data  # Overwrite with the latest state or just extraction?
                )
                # Actually, better to fetch the full profile to be consistent
                profile = await self.get_user_profile(user_id, db)
                if profile and profile.data:
                    current_diag["user_profile"] = profile.data

                current_diag["is_final"] = True
                self.store_diagnostics(user_id, current_diag)

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

        current_diag = self.get_diagnostics(user_id)
        if current_diag:
            if "memory_fragments" not in current_diag:
                current_diag["memory_fragments"] = []

            new_frag_diag = {
                "id": fragment.id,
                "content": fragment.content,
                "score": 1.0,
            }
            current_diag["memory_fragments"].append(new_frag_diag)
            self.store_diagnostics(user_id, current_diag)

        return fragment

    async def _extract_memory(
        self,
        client: genai.Client,
        user_id: str,
        user_msg: str,
        ai_msg: str,
        language: str = "en",
    ) -> Dict[str, Any]:
        prompt = f"""You are a hyper-attentive AI assistant. Your SOLE and EXCLUSIVE task is to analyze the User's message and extract any new, permanent facts or preferences about them.

**CRITICAL RULES:**
1.  **ONLY ANALYZE THE USER'S INPUT.** Ignore the AI's response completely. Any information in the AI's response is irrelevant and MUST NOT be extracted.
2.  **FOCUS ON PERMANENT TRAITS.** Distinguish between a temporary activity (e.g., "I'm learning English now") and a permanent fact or preference (e.g., "I love the English language"). Do NOT extract temporary activities.
3.  **BE PRECISE AND CONCISE.** Extract the fact or preference as a short, clear statement.
4.  **OUTPUT JSON ONLY.** The output must be a single, valid JSON object with the keys "facts", "preferences", and "emotional_state". If nothing new is learned, return empty lists.
5.  **LANGUAGE MATCH.** The extraction MUST be in the same language as the user's message.

**Example 1: Clear extraction**
[CONVERSATION]
User: "I'm a coder living in Zhejiang, and I love jazz music."
AI: "That's great! As a coder in Zhejiang, you must be very skilled. Jazz is wonderful."
[END CONVERSATION]

Your JSON Output:
```json
{{
  "facts": ["Is a coder", "Lives in Zhejiang"],
  "preferences": ["Loves jazz music"],
  "emotional_state": ""
}}
```

**Example 2: Ignoring AI response (CRITICAL)**
[CONVERSATION]
User: "Hi there."
AI: "Hello! As a coder, you must be having a busy day!"
[END CONVERSATION]

Your JSON Output:
```json
{{
  "facts": [],
  "preferences": [],
  "emotional_state": ""
}}
```
Now, analyze the following new conversation and provide your JSON output.
[CONVERSATION]
User: "{user_msg}"
AI: "{ai_msg}"
[END CONVERSATION]

Your JSON Output:
"""
        try:
            response = await client.aio.models.generate_content(
                model=self.extraction_model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            if response and response.text:
                text = str(response.text).strip()
                # Clean up markdown JSON
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]

                logger.info(f"Extracted raw text for {user_id}: {text}")
                extracted = json.loads(text)
                logger.info(f"Extracted structured data for {user_id}: {extracted}")
                return extracted
            return {{}}
        except Exception as e:
            logger.error(f"Error extracting memory for {user_id}: {e}")
            return {{}}

    async def _update_user_profile(
        self, user_id: str, extracted_data: Dict[str, Any], db: AsyncSession
    ):
        from sqlalchemy.orm.attributes import flag_modified

        result = await db.execute(
            select(models.UserProfile).where(models.UserProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            profile = models.UserProfile(user_id=user_id, data={})
            db.add(profile)

        # Work with a shallow copy to ensure we don't just mutate the existing ref
        current_data = dict(profile.data) if isinstance(profile.data, dict) else {}

        for key in ["facts", "preferences"]:
            if key in extracted_data and isinstance(extracted_data[key], list):
                existing = list(current_data.get(key, []))
                for item in extracted_data[key]:
                    if item and item not in existing:
                        existing.append(item)
                current_data[key] = existing

        if "emotional_state" in extracted_data and extracted_data["emotional_state"]:
            current_data["last_emotional_state"] = extracted_data["emotional_state"]

        profile.data = current_data
        flag_modified(profile, "data")
        db.add(profile)
        # The commit happens in process_exchange

    async def generate_embedding(
        self, text: str, api_key: Optional[str] = None
    ) -> List[float]:
        try:
            client = self.get_client(api_key)
            response = await client.aio.models.embed_content(
                model=self.embedding_model_name,
                contents=text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            if not response or not response.embeddings:
                return [0.0] * 1536

            embedding_values = response.embeddings[0].values
            if embedding_values is None:
                return [0.0] * 1536

            embedding = list(embedding_values)

            if len(embedding) < 1536:
                embedding = embedding + [0.0] * (1536 - len(embedding))
            elif len(embedding) > 1536:
                embedding = embedding[:1536]

            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 1536

    async def search_memory(
        self,
        user_id: str,
        query_text: str,
        db: AsyncSession,
        limit: int = 5,
        api_key: Optional[str] = None,
        include_scores: bool = False,
    ) -> List[Any]:
        query_embedding = await self.generate_embedding(query_text, api_key)
        # We use a more explicit query to get scores if requested
        if include_scores:
            from sqlalchemy import text

            # pgvector cosine distance: <=> operator
            # Using raw SQL for simplicity in getting the distance/score alongside the model
            stmt = text("""
                SELECT id, content, embedding <=> :emb as distance 
                FROM memory_fragments 
                WHERE user_id = :uid 
                ORDER BY distance ASC 
                LIMIT :limit
            """)
            result = await db.execute(
                stmt, {"emb": str(query_embedding), "uid": user_id, "limit": limit}
            )
            # Return as list of dicts for diagnostics
            items = []
            for row in result:
                # Handle possible NaN or invalid distances
                score = 0.0
                try:
                    import math

                    distance = float(row.distance)
                    if not math.isnan(distance) and not math.isinf(distance):
                        score = 1.0 - distance
                except (ValueError, TypeError):
                    pass

                items.append(
                    {
                        "id": row.id,
                        "content": row.content,
                        "score": max(0.0, min(1.0, score)),
                    }
                )
            return items

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
