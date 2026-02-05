# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Accompany (AI 学习伴侣) — a Pomodoro timer with an integrated AI chat companion ("CozyPal") for focused learning. Full-stack app with React frontend and FastAPI backend, using PostgreSQL with pgvector for AI memory embeddings.

## Development Commands

### Prerequisites
- Docker (for PostgreSQL + pgvector): `docker compose up -d`
- Database auto-creates tables on backend startup via SQLAlchemy `Base.metadata.create_all`

### Frontend (in `frontend/`)
```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server on :5173 (proxies /api → localhost:8000)
pnpm build            # TypeScript check + Vite production build
pnpm lint             # ESLint
pnpm test             # Vitest (jsdom environment)
npx vitest run src/path/to/test.test.ts  # Run a single test
```

### Backend (in `backend/`)
```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload    # Run from project root, serves on :8000
```

## Architecture

### Frontend (React 19 + TypeScript + Vite)
- **State management**: React Context (`TimerContext`) + custom hooks with reducer pattern
  - `usePomodoroState` — reducer-based timer state with localStorage persistence
  - `useTimer` — core timer countdown logic
  - `usePomodoroData` — API data fetching for sessions/stats
- **API layer**: Single `src/api/client.ts` with typed fetch wrappers, all calls go to `/api/*`
- **i18n**: i18next with `en.json` and `zh.json` locale files in `src/i18n/locales/`
- **Styling**: Tailwind CSS with custom "cozy" theme (cream, pastelGreen, pastelBlue, etc.) and custom fonts (Fredoka headings, Nunito body)
- **Testing**: Vitest + React Testing Library, setup in `src/test/setup.ts`

### Backend (FastAPI + async SQLAlchemy)
- **Routers**: `sessions`, `users`, `topics`, `countdowns`, `diagnostics`, `documents`, `achievements`
- **Services**: `chat_service` (multi-provider AI: Gemini/OpenAI), `memory_service` (pgvector), `document_service`, `achievement_service`
- **Auth**: Simple Bearer token — `Authorization: Bearer {user_id}`, falls back to `default_user`
- **AI streaming**: Async generator-based streaming responses via abstract `AIServiceProvider` with Gemini and OpenAI implementations
- **Database**: PostgreSQL 15 + pgvector (1536-dim embeddings in `MemoryFragment` model)

### Data Flow
Frontend (:5173) → Vite proxy → Backend (:8000) → PostgreSQL (:5432, Docker)

### Key Patterns
- Backend is fully async (asyncpg driver, async sessions)
- AI providers are pluggable via abstract base class in `chat_service.py`
- Timer state persists to localStorage; sessions persist to PostgreSQL
- CozyPal chat module is self-contained in `src/components/cozypal/`

## Project Conventions
- Bilingual codebase: comments in Chinese, UI text via i18n keys
- Database URL defaults to `postgresql+asyncpg://myuser:mypassword@localhost:5432/mydatabase` (configurable via `DATABASE_URL` env var)
- Backend runs from project root (not from `backend/`): `uvicorn backend.main:app`
