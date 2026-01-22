# Learning Progress System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement a system to persist learning progress (focus sessions) to a PostgreSQL database and provide daily statistics.

**Architecture:**
- **Backend:** FastAPI with SQLAlchemy (Async) for database interactions.
- **Database:** PostgreSQL with a `learning_sessions` table.
- **Frontend:** React with a custom API client to send session data on completion/skip.

**Tech Stack:** FastAPI, SQLAlchemy (Async), PostgreSQL, Pydantic, React, TypeScript.

---

### Task 1: 数据库模型与迁移配置

**文件:**
- 创建: `backend/models.py`
- 创建: `backend/database.py`
- 修改: `backend/main.py` (集成 DB 启动)

**步骤 1: 创建 `backend/database.py` 配置数据库连接**
- 使用 `sqlalchemy.ext.asyncio` 创建异步引擎。
- 定义 `Base` 类和 `get_db` 依赖。
- **注意**: 确保使用环境变量获取 DB URL，提供默认值用于开发。

**步骤 2: 创建 `backend/models.py` 定义 `LearningSession` 模型**
- 字段: `id`, `theme_name`, `duration_seconds`, `phase_type`, `status`, `start_time`, `end_time`, `created_at`。
- 确保时间字段使用 UTC。

**步骤 3: 在 `backend/main.py` 中添加启动时创建表的逻辑**
- 使用 `engine.begin()` 和 `Base.metadata.create_all` 自动建表 (简化版迁移)。

---

### Task 2: 后端 API 开发

**文件:**
- 创建: `backend/schemas.py`
- 创建: `backend/crud.py`
- 创建: `backend/routers/sessions.py`
- 修改: `backend/main.py`

**步骤 1: 创建 `backend/schemas.py` 定义 Pydantic 模型**
- `SessionCreate`: 用于接收前端数据。
- `SessionResponse`: 用于返回数据。
- `DailyStats`: 用于返回统计数据。

**步骤 2: 创建 `backend/crud.py` 实现数据库操作**
- `create_session`: 插入记录。
- `get_daily_stats`: 使用 SQL 聚合查询计算当日总时长和次数。

**步骤 3: 创建 `backend/routers/sessions.py` 定义路由**
- `POST /api/sessions`: 调用 `create_session`。
- `GET /api/stats/daily`: 调用 `get_daily_stats`。

**步骤 4: 在 `backend/main.py` 中注册路由**
- 包含 `sessions_router`。

---

### Task 3: 前端 API 客户端与集成

**文件:**
- 创建: `frontend/src/api/client.ts`
- 修改: `frontend/vite.config.ts` (配置代理)
- 修改: `frontend/src/components/PomodoroTimer.tsx`

**步骤 1: 配置 Vite 代理**
- 将 `/api` 请求代理到 `http://localhost:8000`。

**步骤 2: 创建 `frontend/src/api/client.ts`**
- 封装 `saveSession(data)` 和 `getDailyStats()` 方法。
- 定义前端 TypeScript 接口对应后端 Pydantic 模型。

**步骤 3: 集成到 `frontend/src/components/PomodoroTimer.tsx`**
- 在 `handleSkip`, `onComplete` (需从 useTimer 传递或在 hook 外部处理), `reset` 时收集数据。
- 构造 Session 对象（计算时长、时间戳）。
- 调用 `api.saveSession`。
- (可选) 在界面显示“今日专注时长”。

---

### Task 4: 验证与调试

**步骤 1: 启动全栈环境**
- 确保 Docker 数据库运行。
- 启动 Backend。
- 启动 Frontend。

**步骤 2: 手动测试**
- 完成一个番茄钟，检查数据库是否新增记录。
- 检查统计接口是否返回正确数据。
