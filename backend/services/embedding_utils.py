"""Embedding utilities for MemoryService."""

import math
import logging
from typing import List, Optional, Dict, Any
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Target embedding dimension for pgvector
EMBEDDING_DIM = 1536


async def generate_embedding(
    client: genai.Client,
    text: str,
    model_name: str = "text-embedding-004",
) -> List[float]:
    """
    Generate text embedding using the Gemini embedding model.

    Args:
        client: Initialized genai.Client instance
        text: Text to generate embedding for
        model_name: Name of the embedding model to use

    Returns:
        List of floats representing the embedding vector,
        padded/truncated to EMBEDDING_DIM
    """
    try:
        response = await client.aio.models.embed_content(
            model=model_name,
            contents=text,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        )
        if not response or not response.embeddings:
            return [0.0] * EMBEDDING_DIM

        embedding_values = response.embeddings[0].values
        if embedding_values is None:
            return [0.0] * EMBEDDING_DIM

        embedding = list(embedding_values)

        # Normalize to target dimension
        if len(embedding) < EMBEDDING_DIM:
            embedding = embedding + [0.0] * (EMBEDDING_DIM - len(embedding))
        elif len(embedding) > EMBEDDING_DIM:
            embedding = embedding[:EMBEDDING_DIM]

        return embedding
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return [0.0] * EMBEDDING_DIM


def calculate_similarity_score(distance: float) -> float:
    """
    Convert cosine distance to similarity score.

    Args:
        distance: Cosine distance from pgvector (0 = identical, 2 = opposite)

    Returns:
        Similarity score between 0.0 and 1.0
    """
    try:
        if math.isnan(distance) or math.isinf(distance):
            return 0.0
        score = 1.0 - distance
        return max(0.0, min(1.0, score))
    except (ValueError, TypeError):
        return 0.0


def format_memory_result(row: Any) -> Dict[str, Any]:
    """
    Format a database row into a memory result dictionary.

    Args:
        row: Database row with id, content, and distance attributes

    Returns:
        Dictionary with id, content, and calculated score
    """
    return {
        "id": row.id,
        "content": row.content,
        "score": calculate_similarity_score(float(row.distance)),
    }
