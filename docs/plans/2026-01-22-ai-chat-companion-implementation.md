# AI Chat Companion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a full-stack AI chat companion in the Pomodoro application, including UI, backend API, context injection, and configurable settings.

**Architecture:** A new React component for the chat UI, integrated with existing i18n and Framer Motion. A FastAPI backend will handle LLM interactions, context injection from PostgreSQL, and streaming responses. User settings for AI persona and privacy will be stored in PostgreSQL.

**Tech Stack:** React (TS), Vite, Tailwind CSS, Framer Motion, i18next (Frontend); FastAPI (Python), SQLAlchemy, PostgreSQL (Backend); LLM API (Gemini/OpenAI).

### Task 1: Backend - Extend LearningSession Model for Context & Settings

**Goal:** Add fields to the `LearningSession` model to store AI-related settings and enable context injection.

**Files:**
- Modify: `backend/models.py`
- Test: `backend/tests/test_models.py` (create if doesn't exist)

**Step 1: Write a failing test for `LearningSession` model extension**

Create `backend/tests/test_models.py` if it doesn't exist. Add a test that attempts to create a `LearningSession` with new AI-related fields and asserts their presence.

```python
# backend/tests/test_models.py
import pytest
from datetime import datetime
from backend.models import LearningSession
from backend.schemas import LearningSessionCreate # Assuming this exists or will be created

# Assuming a fixture for db_session is available or mocked
@pytest.mark.asyncio
async def test_create_learning_session_with_ai_settings():
    # Mock data including new AI fields
    session_data = {
        "start_time": datetime.now(),
        "end_time": datetime.now(),
        "duration_minutes": 25,
        "session_type": "focus",
        "task_name": "Test Task",
        "ai_persona": "gentle_encourager", # New field
        "ai_proactivity": True,            # New field
        "ai_actionable": False,            # New field
    }
    session = LearningSession(**session_data)
    assert session.ai_persona == "gentle_encourager"
    assert session.ai_proactivity is True
    assert session.ai_actionable is False
```

**Step 2: Run test to verify it fails**

Run: `cd .worktrees/feature-ai-chat-companion/backend && source venv/bin/activate && pytest tests/test_models.py::test_create_learning_session_with_ai_settings`
Expected: FAIL with `AttributeError` or `KeyError` due to missing columns.

**Step 3: Add `ai_persona`, `ai_proactivity`, `ai_actionable` fields to `LearningSession` model**

```python
# backend/models.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, index=True)
    end_time = Column(DateTime)
    duration_minutes = Column(Integer)
    session_type = Column(String)  # e.g., 'focus', 'break'
    task_name = Column(String)

    # New AI-related fields
    ai_persona = Column(String, default="gentle_encourager")
    ai_proactivity = Column(Boolean, default=True)
    ai_actionable = Column(Boolean, default=False)
```

**Step 4: Run test to verify it passes**

Run: `cd .worktrees/feature-ai-chat-companion/backend && source venv/bin/activate && pytest tests/test_models.py::test_create_learning_session_with_ai_settings`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/models.py backend/tests/test_models.py
git commit -m "feat(backend): add AI related fields to LearningSession model"
```

---

### Task 2: Backend - Update Schemas for AI Settings

**Goal:** Update Pydantic schemas to include the new AI-related fields for API request/response validation.

**Files:**
- Modify: `backend/schemas.py`
- Test: `backend/tests/test_schemas.py` (create if doesn't exist)

**Step 1: Write a failing test for schema updates**

Create `backend/tests/test_schemas.py` if it doesn't exist. Add a test that attempts to create `LearningSessionCreate` and `LearningSessionResponse` instances with the new AI fields and asserts their presence and types.

```python
# backend/tests/test_schemas.py
import pytest
from datetime import datetime
from backend.schemas import LearningSessionCreate, LearningSessionResponse

def test_learning_session_create_with_ai_settings():
    session_data = {
        "start_time": datetime.now(),
        "end_time": datetime.now(),
        "duration_minutes": 25,
        "session_type": "focus",
        "task_name": "Test Task",
        "ai_persona": "hardcore_motivator",
        "ai_proactivity": False,
        "ai_actionable": True,
    }
    session_create = LearningSessionCreate(**session_data)
    assert session_create.ai_persona == "hardcore_motivator"
    assert session_create.ai_proactivity is False
    assert session_create.ai_actionable is True

def test_learning_session_response_with_ai_settings():
    session_data = {
        "id": 1,
        "start_time": datetime.now(),
        "end_time": datetime.now(),
        "duration_minutes": 30,
        "session_type": "break",
        "task_name": "Relax",
        "ai_persona": "gentle_encourager",
        "ai_proactivity": True,
        "ai_actionable": False,
    }
    session_response = LearningSessionResponse(**session_data)
    assert session_response.ai_persona == "gentle_encourager"
    assert session_response.ai_proactivity is True
    assert session_response.ai_actionable is False
```

**Step 2: Run test to verify it fails**

Run: `cd .worktrees/feature-ai-chat-companion/backend && source venv/bin/activate && pytest tests/test_schemas.py::test_learning_session_create_with_ai_settings`
Expected: FAIL with `ValidationError` due to missing fields in schemas.

**Step 3: Add `ai_persona`, `ai_proactivity`, `ai_actionable` fields to `LearningSessionBase`, `LearningSessionCreate`, and `LearningSessionResponse` schemas**

```python
# backend/schemas.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class LearningSessionBase(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    session_type: str
    task_name: Optional[str] = None

    # New AI-related fields
    ai_persona: Optional[str] = "gentle_encourager"
    ai_proactivity: Optional[bool] = True
    ai_actionable: Optional[bool] = False

class LearningSessionCreate(LearningSessionBase):
    pass

class LearningSessionResponse(LearningSessionBase):
    id: int

    class Config:
        orm_mode = True
```

**Step 4: Run test to verify it passes**

Run: `cd .worktrees/feature-ai-chat-companion/backend && source venv/bin/activate && pytest tests/test_schemas.py::test_learning_session_create_with_ai_settings`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/schemas.py backend/tests/test_schemas.py
git commit -m "feat(backend): update schemas with AI related fields"
```

---

### Task 3: Backend - Implement CRUD Operations for AI Settings

**Goal:** Ensure the CRUD operations (`create`, `get`, `update`, `delete`) in `crud.py` and `routers/sessions.py` correctly handle the new AI-related fields.

**Files:**
- Modify: `backend/crud.py`
- Modify: `backend/routers/sessions.py`
- Test: `backend/tests/test_crud.py` (create if doesn't exist)
- Test: `backend/tests/test_routers.py` (create if doesn't exist)

**Step 1: Write a failing test for CRUD operations on AI settings**

Create `backend/tests/test_crud.py` and `backend/tests/test_routers.py` if they don't exist. Add tests that cover creating, reading, and updating `LearningSession` objects with AI-related fields via the CRUD functions and API endpoints.

```python
# backend/tests/test_crud.py
import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, LearningSession
from backend.schemas import LearningSessionCreate
from backend.crud import create_learning_session, get_learning_session, update_learning_session

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

@pytest.fixture(name="db_session")
async def db_session_fixture():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_crud_learning_session_with_ai_settings(db_session: AsyncSession):
    # Create
    session_create_data = LearningSessionCreate(
        start_time=datetime.now(),
        end_time=datetime.now() + timedelta(minutes=25),
        duration_minutes=25,
        session_type="focus",
        task_name="Coding with AI",
        ai_persona="gentle_encourager",
        ai_proactivity=True,
        ai_actionable=False,
    )
    created_session = await create_learning_session(db_session, session_create_data)
    assert created_session.task_name == "Coding with AI"
    assert created_session.ai_persona == "gentle_encourager"
    assert created_session.ai_proactivity is True

    # Read
    fetched_session = await get_learning_session(db_session, created_session.id)
    assert fetched_session.id == created_session.id
    assert fetched_session.ai_actionable is False

    # Update
    updated_session_data = {
        "ai_persona": "hardcore_motivator",
        "ai_proactivity": False,
        "ai_actionable": True,
    }
    updated_session = await update_learning_session(
        db_session, created_session.id, updated_session_data
    )
    assert updated_session.ai_persona == "hardcore_motivator"
    assert updated_session.ai_proactivity is False
    assert updated_session.ai_actionable is True

    # Check that other fields are unchanged
    assert updated_session.task_name == "Coding with AI"
```

```python
# backend/tests/test_routers.py
import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta
from backend.main import app # Assuming main.py defines the FastAPI app

# Setup a test client for FastAPI
@pytest.fixture(name="test_client")
async def test_client_fixture():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_create_read_update_learning_session_with_ai_settings_via_api(test_client: AsyncClient):
    # Create via API
    session_data = {
        "start_time": datetime.now().isoformat(),
        "end_time": (datetime.now() + timedelta(minutes=25)).isoformat(),
        "duration_minutes": 25,
        "session_type": "focus",
        "task_name": "API Test with AI",
        "ai_persona": "gentle_encourager",
        "ai_proactivity": True,
        "ai_actionable": False,
    }
    response = await test_client.post("/sessions/", json=session_data)
    assert response.status_code == 200
    created_session = response.json()
    assert created_session["task_name"] == "API Test with AI"
    assert created_session["ai_persona"] == "gentle_encourager"
    assert created_session["ai_proactivity"] is True

    session_id = created_session["id"]

    # Read via API
    response = await test_client.get(f"/sessions/{session_id}")
    assert response.status_code == 200
    fetched_session = response.json()
    assert fetched_session["id"] == session_id
    assert fetched_session["ai_actionable"] is False

    # Update via API
    update_data = {
        "ai_persona": "humorous_joker",
        "ai_proactivity": False,
        "ai_actionable": True,
    }
    response = await test_client.patch(f"/sessions/{session_id}", json=update_data)
    assert response.status_code == 200
    updated_session = response.json()
    assert updated_session["ai_persona"] == "humorous_joker"
    assert updated_session["ai_proactivity"] is False
    assert updated_session["ai_actionable"] is True
    assert updated_session["task_name"] == "API Test with AI" # Ensure other fields unchanged
```

**Step 2: Run tests to verify they fail**

Run:
`cd .worktrees/feature-ai-chat-companion/backend && source venv/bin/activate && pytest tests/test_crud.py tests/test_routers.py`
Expected: FAIL due to `AttributeError` or `KeyError` when accessing/updating new fields in CRUD or router functions.

**Step 3: Update `crud.py` to handle new AI fields**

Modify `create_learning_session` and `update_learning_session` functions to accept and persist the new `ai_persona`, `ai_proactivity`, and `ai_actionable` fields.

```python
# backend/crud.py (modifications within existing functions)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.models import LearningSession
from backend.schemas import LearningSessionCreate # Assuming this exists

async def create_learning_session(db: AsyncSession, session: LearningSessionCreate):
    db_session = LearningSession(**session.model_dump()) # model_dump includes all fields
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

async def get_learning_session(db: AsyncSession, session_id: int):
    result = await db.execute(select(LearningSession).filter(LearningSession.id == session_id))
    return result.scalar_one_or_none()

async def update_learning_session(db: AsyncSession, session_id: int, session_data: dict):
    # Ensure session_data can include new AI fields
    stmt = update(LearningSession).where(LearningSession.id == session_id).values(**session_data)
    await db.execute(stmt)
    await db.commit()
    # Fetch the updated session to return
    result = await db.execute(select(LearningSession).filter(LearningSession.id == session_id))
    return result.scalar_one_or_none()
```

**Step 4: Update `routers/sessions.py` to handle new AI fields**

Modify the `/sessions/` POST endpoint and `/sessions/{session_id}` PATCH endpoint to accept and return the new AI-related fields using the updated schemas.

```python
# backend/routers/sessions.py (modifications within existing functions)
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend import crud, schemas
from backend.database import get_db

router = APIRouter()

@router.post("/sessions/", response_model=schemas.LearningSessionResponse)
async def create_new_learning_session(
    session: schemas.LearningSessionCreate, db: AsyncSession = Depends(get_db)
):
    return await crud.create_learning_session(db=db, session=session)

@router.get("/sessions/{session_id}", response_model=schemas.LearningSessionResponse)
async def read_learning_session(session_id: int, db: AsyncSession = Depends(get_db)):
    db_session = await crud.get_learning_session(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session

@router.patch("/sessions/{session_id}", response_model=schemas.LearningSessionResponse)
async def update_existing_learning_session(
    session_id: int,
    session_update: schemas.LearningSessionCreate, # Using LearningSessionCreate for partial update
    db: AsyncSession = Depends(get_db),
):
    updated_session = await crud.update_learning_session(
        db, session_id, session_update.model_dump(exclude_unset=True)
    )
    if updated_session is None:
        raise HTTPException(status_code=404, detail="Session not found or no changes applied")
    return updated_session

# Example of a GET endpoint for stats - ensure it does not break
@router.get("/sessions/stats/daily", response_model=List[schemas.DailyFocusStats])
async def get_daily_focus_stats(db: AsyncSession = Depends(get_db)):
    # Existing logic for stats, should not be affected by new AI fields
    return await crud.get_daily_focus_stats(db)
```

**Step 5: Run tests to verify they pass**

Run:
`cd .worktrees/feature-ai-chat-companion/backend && source venv/bin/activate && pytest tests/test_crud.py tests/test_routers.py`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/crud.py backend/routers/sessions.py backend/tests/test_crud.py backend/tests/test_routers.py
git commit -m "feat(backend): update CRUD and router to support AI settings"
```

---

### Task 4: Frontend - Create AI Chat Companion UI Component

**Goal:** Develop the `CozyPal` React component for the floating AI avatar and chat interface.

**Files:**
- Create: `frontend/src/components/CozyPal.tsx`
- Modify: `frontend/src/App.tsx` (to integrate CozyPal)
- Modify: `frontend/src/i18n/locales/en/translation.json`
- Modify: `frontend/src/i18n/locales/zh/translation.json`
- Test: `frontend/src/components/__tests__/CozyPal.test.tsx` (create)

**Step 1: Write a failing test for `CozyPal` component**

Create `frontend/src/components/__tests__/CozyPal.test.tsx`. Add tests to check for rendering of the avatar, toggling of the chat window, and basic message display.

```typescript jsx
// frontend/src/components/__tests__/CozyPal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CozyPal from '../CozyPal'; // Assuming CozyPal.tsx will be created
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n'; // Assuming i18n setup

describe('CozyPal', () => {
  it('renders the avatar initially', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    expect(screen.getByRole('button', { name: /cozy pal avatar/i })).toBeInTheDocument();
  });

  it('opens the chat window when avatar is clicked', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    const avatar = screen.getByRole('button', { name: /cozy pal avatar/i });
    fireEvent.click(avatar);
    expect(screen.getByRole('dialog', { name: /cozy pal chat/i })).toBeInTheDocument();
    expect(screen.getByText(/hello, how can i help you today?/i)).toBeInTheDocument(); // Assuming a default greeting
  });

  it('closes the chat window when avatar is clicked again', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    const avatar = screen.getByRole('button', { name: /cozy pal avatar/i });
    fireEvent.click(avatar); // Open
    fireEvent.click(avatar); // Close
    expect(screen.queryByRole('dialog', { name: /cozy pal chat/i })).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd .worktrees/feature-ai-chat-companion/frontend && npm test frontend/src/components/__tests__/CozyPal.test.tsx`
Expected: FAIL due to `CozyPal` component not found or other rendering errors.

**Step 3: Create `CozyPal.tsx` component with basic avatar and chat window**

```typescript jsx
// frontend/src/components/CozyPal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const CozyPal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        aria-label={t('cozyPal.avatarDescription')}
        className="relative w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
      >
        {/* Placeholder for Avatar SVG */}
        <span className="text-3xl" role="img" aria-label="AI Avatar">✨</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            aria-label={t('cozyPal.chatDescription')}
            role="dialog"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-20 right-0 w-80 h-96 bg-white bg-opacity-80 backdrop-blur-md rounded-lg shadow-xl flex flex-col p-4"
          >
            <div className="flex-grow overflow-y-auto mb-4">
              <p className="text-gray-700">{t('cozyPal.greeting')}</p>
            </div>
            <input
              type="text"
              placeholder={t('cozyPal.typeMessagePlaceholder')}
              className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CozyPal;
```

**Step 4: Update `App.tsx` to integrate `CozyPal`**

```typescript jsx
// frontend/src/App.tsx (add CozyPal component)
import React from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import PomodoroTimer from './components/PomodoroTimer';
import LanguageSwitcher from './components/LanguageSwitcher';
import CozyPal from './components/CozyPal'; // Import CozyPal

function App() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-white bg-opacity-70 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
        <h1 className="text-4xl font-bold mb-6 text-gray-800 font-m-plus-rounded-1c">
          {t('pomodoroTitle')}
        </h1>
        <PomodoroTimer />
      </div>
      <CozyPal /> {/* Integrate CozyPal */}
    </div>
  );
}

export default App;
```

**Step 5: Add new translation keys for `CozyPal`**

```json
// frontend/src/i18n/locales/en/translation.json
{
  "pomodoroTitle": "Cozy Pomodoro",
  "focus": "Focus",
  "break": "Break",
  "start": "Start",
  "pause": "Pause",
  "reset": "Reset",
  "settings": "Settings",
  "taskNamePlaceholder": "What are you working on?",
  "dailyFocusTime": "Daily Focus Time:",
  "cozyPal": {
    "avatarDescription": "Cozy Pal AI Avatar",
    "chatDescription": "Cozy Pal Chat Window",
    "greeting": "Hello, how can I help you today?",
    "typeMessagePlaceholder": "Type your message..."
  }
}

// frontend/src/i18n/locales/zh/translation.json
{
  "pomodoroTitle": "温馨番茄钟",
  "focus": "专注",
  "break": "休息",
  "start": "开始",
  "pause": "暂停",
  "reset": "重置",
  "settings": "设置",
  "taskNamePlaceholder": "你在做什么？",
  "dailyFocusTime": "今日专注时长：",
  "cozyPal": {
    "avatarDescription": "温馨伙伴AI头像",
    "chatDescription": "温馨伙伴聊天窗口",
    "greeting": "你好，今天有什么可以帮你的吗？",
    "typeMessagePlaceholder": "输入你的消息..."
  }
}
```

**Step 6: Run test to verify it passes**

Run: `cd .worktrees/feature-ai-chat-companion/frontend && npm test frontend/src/components/__tests__/CozyPal.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add frontend/src/components/CozyPal.tsx frontend/src/App.tsx frontend/src/i18n/locales/en/translation.json frontend/src/i18n/locales/zh/translation.json frontend/src/components/__tests__/CozyPal.test.tsx
git commit -m "feat(frontend): implement basic CozyPal UI component"
```

---

### Task 5: Frontend - Implement AI Chat API Integration and Streaming

**Goal:** Integrate the `CozyPal` component with the backend chat API, enabling real-time, streaming AI responses.

**Files:**
- Modify: `frontend/src/components/CozyPal.tsx`
- Test: `frontend/src/components/__tests__/CozyPal.test.tsx` (extend)

**Step 1: Write a failing test for API integration and streaming**

Extend `frontend/src/components/__tests__/CozyPal.test.tsx` to include tests for sending messages and receiving streaming responses. This will likely involve mocking `fetch` or a dedicated API client.

```typescript jsx
// frontend/src/components/__tests__/CozyPal.test.tsx (Add these tests)
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CozyPal from '../CozyPal';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

// Mock fetch for streaming
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    headers: {
      get: (header: string) => (header === 'Content-Type' ? 'text/event-stream' : null),
    },
    body: {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({ value: new TextEncoder().encode('data: Hello'), done: false })
          .mockResolvedValueOnce({ value: new TextEncoder().encode(' World'), done: false })
          .mockResolvedValueOnce({ done: true }),
      }),
    },
  })
);

describe('CozyPal API Integration', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('sends user message and displays AI response', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /cozy pal avatar/i })); // Open chat

    const input = screen.getByPlaceholderText(/type your message.../i);
    fireEvent.change(input, { target: { value: 'Hi AI' } });
    fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/chat/completions', expect.any(Object));
    });

    // Check for streaming response
    await waitFor(() => {
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd .worktrees/feature-ai-chat-companion/frontend && npm test frontend/src/components/__tests__/CozyPal.test.tsx`
Expected: FAIL due to `fetch` not being called or AI response not appearing.

**Step 3: Implement API call and streaming logic in `CozyPal.tsx`**

Modify `CozyPal.tsx` to handle user input, send messages to the backend `/api/chat/completions` endpoint, and process streaming responses using `TextDecoder` and `fetch` with `getReader()`.

```typescript jsx
// frontend/src/components/CozyPal.tsx (modifications)
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const CozyPal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([{ sender: 'ai', text: t('cozyPal.greeting') }]);
    }
  };

  const sendMessage = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      const userMessage: Message = { sender: 'user', text: inputValue.trim() };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInputValue('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: inputValue.trim() }), // TODO: Add context later
        });

        if (!response.ok || !response.body) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponseText = '';

        setMessages((prevMessages) => [...prevMessages, { sender: 'ai', text: '' }]); // Placeholder for AI response

        while (true) {
          const { value, done } = await reader.read();
          const chunk = decoder.decode(value, { stream: true });
          aiResponseText += chunk;
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            newMessages[newMessages.length - 1].text = aiResponseText;
            return newMessages;
          });
          if (done) break;
        }
      } catch (error) {
        console.error('Error fetching AI response:', error);
        setMessages((prevMessages) => [...prevMessages, { sender: 'ai', text: t('cozyPal.errorMessage') }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        aria-label={t('cozyPal.avatarDescription')}
        className="relative w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
      >
        {/* Placeholder for Avatar SVG */}
        <span className="text-3xl" role="img" aria-label="AI Avatar">✨</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            aria-label={t('cozyPal.chatDescription')}
            role="dialog"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-20 right-0 w-80 h-96 bg-white bg-opacity-80 backdrop-blur-md rounded-lg shadow-xl flex flex-col p-4"
          >
            <div className="flex-grow overflow-y-auto mb-4 custom-scrollbar">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded-lg max-w-[80%] ${
                    msg.sender === 'user' ? 'bg-blue-200 self-end ml-auto' : 'bg-gray-200 self-start mr-auto'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isLoading && (
                <div className="mb-2 p-2 rounded-lg bg-gray-200 self-start mr-auto max-w-[80%]">
                  {t('cozyPal.thinkingMessage')}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <input
              type="text"
              placeholder={t('cozyPal.typeMessagePlaceholder')}
              className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyUp={sendMessage}
              disabled={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CozyPal;
```

**Step 4: Update `translation.json` with new keys**

```json
// frontend/src/i18n/locales/en/translation.json (add these keys)
{
  "cozyPal": {
    "avatarDescription": "Cozy Pal AI Avatar",
    "chatDescription": "Cozy Pal Chat Window",
    "greeting": "Hello, how can I help you today?",
    "typeMessagePlaceholder": "Type your message...",
    "thinkingMessage": "Cozy Pal is thinking...",
    "errorMessage": "Oops! Something went wrong. Please try again."
  }
}

// frontend/src/i18n/locales/zh/translation.json (add these keys)
{
  "cozyPal": {
    "avatarDescription": "温馨伙伴AI头像",
    "chatDescription": "温馨伙伴聊天窗口",
    "greeting": "你好，今天有什么可以帮你的吗？",
    "typeMessagePlaceholder": "输入你的消息...",
    "thinkingMessage": "温馨伙伴正在思考...",
    "errorMessage": "哎呀！出了点问题。请再试一次。"
  }
}
```

**Step 5: Run test to verify it passes**

Run: `cd .worktrees/feature-ai-chat-companion/frontend && npm test frontend/src/components/__tests__/CozyPal.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend/src/components/CozyPal.tsx frontend/src/i18n/locales/en/translation.json frontend/src/i18n/locales/zh/translation.json frontend/src/components/__tests__/CozyPal.test.tsx
git commit -m "feat(frontend): integrate AI chat API with streaming responses"
```

---

Plan complete and saved to `docs/plans/2026-01-22-ai-chat-companion-implementation.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**