# Long-term Memory (LTM) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the AI companion from a session-based assistant into a persistent "digital life companion" that remembers user preferences, progress, habits, and emotional states across different focus topics and time.

**Architecture:** A "Dual-Path" architecture with synchronous inference (retrieval + generation) and asynchronous evolution (background memory extraction). Memory is stored in a hybrid of structured JSONB profiles and unstructured PGVector fragments.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, PGVector, Google Gemini API.

---

### Task 1: Database Schema - Topics and Relationships

**Goal:** Create `Topic` model and link it to `LearningSession` and `ChatHistory`.

**Files:**
- Modify: `backend/models.py`
- Modify: `backend/schemas.py`
- Test: `backend/tests/test_models.py`

**Step 1: Update `backend/models.py`**
Add `Topic` class. Update `LearningSession` and `ChatHistory` with `topic_id`.

```python
class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    learning_sessions = relationship("LearningSession", back_populates="topic")
    chat_history_entries = relationship("ChatHistory", back_populates="topic")

# Update LearningSession:
# topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
# topic = relationship("Topic", back_populates="learning_sessions")

# Update ChatHistory:
# topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
# topic = relationship("Topic", back_populates="chat_history_entries")
```

**Step 2: Update `backend/schemas.py`**
Add `TopicBase`, `TopicCreate`, `TopicResponse`.

**Step 3: Run baseline tests**
Run existing tests to ensure no regressions.
Run: `pytest backend/tests -v`

**Step 4: Commit**
`git commit -m "feat(LTM): Add Topic model and update relationships"`

---

### Task 2: Database Schema - Memory Models (Profile & Fragments)

**Goal:** Implement `UserProfile` and `MemoryFragment` models.

**Files:**
- Modify: `backend/models.py`
- Modify: `backend/schemas.py`
- Create: `backend/tests/test_memory_models.py`

**Step 1: Add `UserProfile` and `MemoryFragment` to `models.py`**
Note: Need to handle `Vector` type for `pgvector`.

```python
from pgvector.sqlalchemy import Vector

class UserProfile(Base):
    __tablename__ = "user_profiles"
    user_id = Column(String, primary_key=True, index=True)
    data = Column(JSONB, default={}) # preferences, milestones, habits, emotional_trends
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class MemoryFragment(Base):
    __tablename__ = "memory_fragments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536)) # Assuming OpenAI/Gemini dimensions
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

**Step 2: Write tests for memory models**
Ensure vector storage works.

**Step 3: Commit**
`git commit -m "feat(LTM): Add UserProfile and MemoryFragment models"`

---

### Task 3: Memory Extractor Service

**Goal:** Create a service to distill conversations into structured memory.

**Files:**
- Create: `backend/services/memory_service.py`
- Test: `backend/tests/test_memory_service.py`

**Step 1: Implement `MemoryService.extract_and_update`**
Uses LLM to analyze dialogue and update `UserProfile` and `MemoryFragment`.

**Step 2: Commit**
`git commit -m "feat(LTM): Implement Memory Extractor Service"`

---

### Task 4: Context Injection in Chat Service

**Goal:** Refactor `chat_service.py` to retrieve memory before generating response.

**Files:**
- Modify: `backend/services/chat_service.py`

**Step 1: Add retrieval logic**
Query `user_profiles` and `memory_fragments` (vector search).
Inject into System Prompt.

**Step 2: Commit**
`git commit -m "feat(LTM): Add memory retrieval and injection to Chat Service"`

---

### Task 5: Topic Management API

**Goal:** Add CRUD endpoints for Topics.

**Files:**
- Modify: `backend/routers/topics.py` (New)
- Modify: `backend/main.py`

**Step 1: Implement Topic CRUD**

**Step 2: Commit**
`git commit -m "feat(LTM): Add Topic Management API"`

---

### Task 6: Frontend Topic UI

**Goal:** Allow users to create and switch between focus topics.

**Files:**
- Modify: `frontend/src/components/TopicSelector.tsx` (New)
- Modify: `frontend/src/components/CozyPal.tsx`

**Step 1: Implement Topic UI and integrate with CozyPal chat.**

**Step 2: Commit**
`git commit -m "feat(LTM): Add Frontend UI for Topic Management"`
