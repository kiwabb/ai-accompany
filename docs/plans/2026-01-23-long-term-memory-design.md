# Long-term Memory (LTM) System Design

## 1. Overview
The Long-term Memory (LTM) system aims to transform the AI companion from a session-based assistant into a persistent "digital life companion." It enables the AI to remember user preferences, progress, habits, and emotional states across different focus topics and time.

## 2. Core Requirements
- **Global Shared Memory**: Memory is shared across all focus topics.
- **Topic-based Interaction**: Users can manually create dedicated chat/focus windows for different themes (e.g., "Learning Rust", "Career Planning").
- **Hybrid Storage**: Combination of structured user profiles (JSONB) and unstructured semantic fragments (Vector/RAG).
- **Real-time Evolution**: Asynchronous memory extraction triggered after every conversation exchange.

## 3. Architecture
The system uses a "Dual-Path" architecture:
- **Inference Path (Synchronous)**:
    1. Retrieve structured profile from `user_profiles`.
    2. Perform vector search in `memory_fragments` using the current user query.
    3. Inject retrieved context into the System Prompt.
- **Evolution Path (Asynchronous)**:
    1. After AI response, trigger a FastAPI Background Task.
    2. Send current exchange to a `MemoryExtractor` LLM.
    3. Update `user_profiles` and insert new vectors into `memory_fragments`.

## 4. Database Schema

### `topics`
- `id` (Serial, PK)
- `user_id` (String, Index)
- `name` (String, e.g., "Rust Study")
- `description` (Text)
- `is_active` (Boolean, Default: True)
- `created_at` (Timestamp)

### `user_profiles`
- `user_id` (String, PK)
- `data` (JSONB): Contains `preferences`, `milestones`, `habits`, `emotional_trends`.
- `updated_at` (Timestamp)

### `memory_fragments`
- `id` (Serial, PK)
- `user_id` (String, Index)
- `topic_id` (Integer, ForeignKey: topics.id)
- `content` (Text): The raw dialogue slice.
- `embedding` (Vector(1536)): PGVector embedding.
- `metadata` (JSONB)
- `created_at` (Timestamp)

## 5. Implementation Strategy
1. **Database Migration**: Add `pgvector` support and create new tables.
2. **Memory Extractor Service**: Implement a specialized service to distill conversations into structured data.
3. **Context Injection Logic**: Refactor `chat_service.py` to include a retrieval step before calling the LLM.
4. **Topic Management API**: CRUD endpoints for focus topics.

## 6. Success Criteria
- AI can mention user preferences stated in a different topic window.
- AI can recall specific facts from conversations older than 24 hours.
- System latency for memory retrieval is < 200ms.
