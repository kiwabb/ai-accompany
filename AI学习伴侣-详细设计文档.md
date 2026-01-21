# AI 学习伴侣 - 详细设计文档

## 1. 产品概述

### 1.1 愿景
本产品旨在创建一个智能的、个性化的学习伴侣应用。它结合了经典的学习方法（番茄工作法）与前沿的人工智能技术（情境感知的 AI 助教），帮助用户更有效地规划、追踪和深化他们的学习过程。

### 1.2 核心价值
*   **效率提升**: 通过番茄钟和任务管理，帮助用户建立专注、规律的学习节奏。
*   **深度学习**: 通过情境感知的 AI 聊天，让 AI 成为一个真正了解您学习内容的“私人助教”，而非泛泛而谈的通用聊天机器人。
*   **进度可视**: 通过直观的仪表盘，让用户看到自己的成长轨迹，获得正向反馈。

---

## 2. 功能清单

### 2.1 核心功能 (MVP)

| 功能模块 | 功能描述 | 优先级 |
| :--- | :--- | :--- |
| **番茄钟 (Pomodoro Timer)** | 可定制的计时器（工作/休息时长），与学习任务关联，提供桌面通知和提示音。 | P0 |
| **学习进度保存 (Progress Saving)** | 自动记录每一次学习会话的数据（时间、主题、任务），并持久化存储。 | P0 |
| **情境感知 AI 聊天 (Context-aware AI Chat)** | 基于用户上传的学习资料（PDF、网页、笔记），提供能结合具体内容的精准问答。 | P0 |

### 2.2 扩展功能

| 功能模块 | 功能描述 | 优先级 |
| :--- | :--- | :--- |
| **学习资料库 (Knowledge Base)** | 一个集中管理用户上传所有学习材料（PDF、网页剪藏、Markdown 笔记）的模块，它是 AI 情境感知的基础。 | P1 |
| **任务管理器 (Task Manager)** | 创建、编辑、删除学习任务，并为番茄钟会话指定具体的执行任务。 | P1 |
| **学习仪表盘 (Dashboard)** | 数据可视化模块，以图表展示学习时长、活跃时段、完成的任务数、专注领域等。 | P1 |
| **间隔重复系统 (SRS)** | 类似 Anki 的功能，允许用户从学习资料中创建“闪卡”，系统根据遗忘曲线智能安排复习。 | P2 |
| **目标设定 (Goal Setting)** | 允许用户设定周/月度学习目标（如“本周学习 Python 10 小时”），并追踪进度。 | P2 |

---

## 3. 系统架构设计

### 3.1 高层架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层 (Frontend)                │
│  React/Vue Web App                                    │
│  (Timer, Dashboard, Chat UI, Task Manager)            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  业务逻辑层 (Backend)                   │
│              FastAPI / Node.js Service                 │
│  - 认证与授权 (Authentication)                          │
│  - API 端点 (REST API)                                │
│  - AI 编排 (AI Orchestration)                          │
│  - 数据库访问 (Data Access Layer)                      │
└────────────┬──────────────────┬───────────────────────┘
             │                  │
┌────────────▼──────────┐ ┌───▼──────────────────────────┐
│   数据持久层 (DB)     │ │  AI 服务层 (AI Services)     │
│                      │ │                              │
│ PostgreSQL + pgvector │ │  - 文档处理 (Doc Processing) │
│ (Unified Data Store) │ │  - 向量化 (Embedding)        │
│                      │ │  - 检索 (Retrieval)         │
│  Tables:             │ │  - LLM 调用 (Google Gemini API)     │
│  - users             │ │                              │
│  - learning_sessions  │ │  Vector Database (ChromaDB)  │
│  - tasks            │ │  (知识库向量存储)              │
│  - materials        │ │                              │
│  - flashcards       │ └───────────────────────────────┘
└─────────────────────┘
```

### 3.2 推荐技术栈

#### 3.2.1 前端 (Frontend)
*   **框架**: **React** 或 **Vue**。两者都是成熟的现代框架，拥有庞大的生态系统和活跃的社区。选择一个团队更熟悉的即可。
*   **UI 库**: **Tailwind CSS** 或 **Ant Design**，用于快速构建美观且一致的界面。
*   **番茄钟实现**: 推荐使用 **`react-countdown`** (React) 或 **`vue-countdown`** (Vue) 库，它们是成熟的、可定制的计时器组件库。桌面通知可使用浏览器的 **`Notification` API**，提示音可使用 **`howler.js`** 或简单的 HTML5 `<audio>` 标签。

#### 3.2.2 后端 (Backend)
*   **语言/框架**: **Python (FastAPI)**。选择 Python 的原因是其拥有强大的 AI/ML 生态系统（如 `LangChain`、`OpenAI SDK`、`ChromaDB`），与我们的 AI 功能完美契合。FastAPI 性能优秀、自动生成 API 文档，非常适合快速开发。
*   **认证**: 使用 **JWT (JSON Web Tokens)** 进行用户身份验证，并结合 **OAuth2**（如 Google 登录）提供更便捷的登录方式。
*   **API 设计**: 采用 **RESTful API** 设计原则，确保接口的清晰和可预测性。

#### 3.2.3 数据存储 (Data Storage)
*   **核心数据库**: **PostgreSQL**。一个强大、可靠、功能丰富的开源关系型数据库。
*   **向量数据库插件**: **`pgvector`**。这是 PostgreSQL 的一个开源扩展，允许我们在同一个数据库中直接进行向量搜索。
    *   **决策理由 (来自 Oracle)**: 采用 `PostgreSQL + pgvector` 的统一存储方案，可以避免引入一个独立的向量数据库服务（如 Pinecone）。这大大降低了架构的复杂度和运维成本，同时也能满足我们初期和中期的所有需求。

#### 3.2.4 AI 服务 (AI Services)
*   **LLM 提供商**: **Google Gemini API**。使用 `Gemini Pro` 或 `Gemini Flash` 模型来生成 AI 回复。
*   **RAG 编排框架**: **LangChain** (推荐使用 `langchain-google-genai`)。一个强大的 Python 框架，用于构建 LLM 应用。它提供了文档加载、文本切分、嵌入生成、向量数据库集成、提示模板管理等一系列现成组件，能极大地加速 RAG 功能的开发。
*   **文档处理**: **`PyPDF2`**、**`BeautifulSoup4`** 等库，用于处理用户上传的 PDF、网页等不同格式的学习材料。

---

## 4. 核心数据模型

所有数据存储在 PostgreSQL 中，使用 `pgvector` 扩展来处理向量搜索。

### 4.1 数据库表结构

#### `users` (用户表)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `learning_sessions` (学习会话表)
```sql
CREATE TABLE learning_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    task_id INT REFERENCES tasks(id), -- 关联的学习任务
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INT,
    topic VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `tasks` (任务表)
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `materials` (学习资料表)
```sql
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- pdf, web, note
    content_url TEXT, -- 存储原始文件的 URL 或内容
    embedding vector(1536), -- 使用 pgvector 存储内容向量，用于 RAG 检索
    metadata JSONB, -- 存储额外的元数据，如来源、作者等
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为 embedding 列创建向量搜索索引
CREATE INDEX ON materials USING ivfflat (embedding vector_cosine_ops);
```

#### `chat_history` (聊天历史表)
```sql
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    session_id VARCHAR(255) NOT NULL, -- 一个会话可能有多个来回的消息
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    context_materials JSONB, -- 记录本次回答引用了哪些学习资料 (material_id列表)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. RAG 与情境感知 AI 聊天工作流

这是产品的核心竞争力。其工作流如下：

1.  **知识库构建 (离线/异步)**:
    *   用户通过“学习资料库”上传文件（PDF、网页 URL、Markdown 笔记）。
    *   后端使用 `LangChain` 的 `DocumentLoaders` 加载并解析这些文件。
    *   使用 `RecursiveCharacterTextSplitter` 将长文档切分成小的文本块（例如，每块 1000 个字符）。
    *   调用 Google Gemini 的 Embedding 模型 (例如 `text-embedding-004`)，为每个文本块生成一个向量表示。
    *   将每个文本块的向量存储到 `materials` 表的 `embedding` 列中。

2.  **智能问答 (在线/实时)**:
    *   用户在聊天界面提出问题。
    *   后端首先将用户的问题进行向量化。
    *   在 `materials` 表中，使用 PostgreSQL 的 `pgvector` 功能，执行一个向量相似度搜索，找到与用户问题最相关的 K 个（例如，3 个）文本块。
    *   将这 K 个文本块和用户的原始问题一起，构建成一个发送给 LLM 的 Prompt。Prompt 模板可能如下：
        ```
        你是一个学习助教。请根据以下用户提供的资料来回答他们的问题：
        {retrieved_materials}

        用户的问题是：{user_query}
        ```
    *   调用 Google Gemini 的 LLM，让它根据提供的上下文材料生成回答。
    *   将 LLM 的回答返回给用户，并在 `chat_history` 表中记录整个交互，包括使用了哪些 `material_id`，以便后续分析和展示。

---

## 6. 开发路线图 (基于 Oracle 建议)

### 第一阶段：MVP (第 1-3 周)

**目标**: 构建一个可工作的最小可行产品，包含最核心的功能。

*   **后端 (FastAPI)**:
    *   项目初始化与基本配置。
    *   实现 PostgreSQL 数据库，并安装 `pgvector` 扩展。
    *   实现用户认证（JWT）。
    *   实现 `tasks`、`learning_sessions` 的 CRUD API。
    *   实现基础 RAG 流程：上传 PDF → 解析 → 切分 → 向量化 → 存入数据库 → 基于向量搜索的简单问答接口。

*   **前端 (React)**:
    *   项目初始化与基本布局。
    *   实现登录/注册页面。
    *   实现简单的番茄钟 UI。
    *   实现一个文件上传页面，用于测试 RAG 功能。
    *   实现一个简单的聊天界面，连接后端的 RAG 问答接口。

*   **成果**: 一个可以注册登录、上传学习资料、在聊天中基于这些资料提问的网页应用，番茄钟可以运行。

### 第二阶段：功能完善与集成 (第 4-6 周)

**目标**: 让各个功能模块更完善，并实现它们之间的关联。

*   **番茄钟集成**:
    *   实现番茄钟与 `learning_sessions` 的关联。每次计时结束，自动创建一条学习会话记录。
    *   启动计时器时，要求用户从任务列表中选择一个任务进行关联。
    *   实现工作/休息循环的提示音和浏览器通知。

*   **任务管理器**:
    *   实现完整的任务 CRUD 界面和逻辑。
    *   在仪表盘上展示未完成任务和今日完成的任务。

*   **AI 聊天优化**:
    *   为聊天历史提供持久化存储。
    *   优化 RAG 检索的 Prompt，提高回答的准确性。
    *   在聊天界面中，显示回答引用了哪些学习资料（例如，“回答基于：Python基础教程.pdf, P.15-18”）。

*   **成果**: 产品各核心功能已经串联起来，用户体验基本完整。

### 第三阶段：体验提升与扩展 (第 7-10 周)

**目标**: 提升用户体验，并开发 P1 优先级的扩展功能。

*   **学习仪表盘**:
    *   使用图表库（如 **Recharts**）展示用户的学习数据：
        *   过去 7 天的学习时长趋势图。
        *   完成任务的柱状图。
        *   不同学习主题（如编程、语言、历史）的学习时间分布。

*   **资料库增强**:
    *   支持上传网页 URL，并自动抓取并处理网页内容。
    *   提供一个管理界面，让用户可以查看、编辑、删除他们上传的所有学习资料。

*   **前端优化**:
    *   实现响应式布局，确保应用在移动设备上也能使用。
    *   添加加载状态、错误处理等微交互，提升应用的健壮性和用户友好度。

*   **成果**: 产品拥有更强大的数据可视化、更丰富的资料管理能力，整体体验显著提升。

---

## 7. 关键决策点与风险 (来自 Oracle)

### 7.1 关键决策点 (需要在开始开发前确定)

1.  **是否需要离线支持？**
    *   **是**: 需要引入本地数据库（IndexedDB）并设计一个与后端同步的策略。这会增加前端复杂度。
    *   **否**: 采用纯在线方案，架构更简单。建议 MVP 先按“否”来做。

2.  **隐私和合规要求？**
    *   **严格合规**: 如果是面向教育机构，数据可能需要本地化部署或使用符合特定合规标准（如 GDPR）的云服务。
    *   **一般**: 可以使用 Google Gemini Platform、Supabase 等第三方云服务。我们假设是“一般”情况。

3.  **目标用户规模预期？**
    *   **< 1000 用户**: MVP 架构即可，无需过早考虑扩展性。
    *   **> 10 万用户**: 需要在架构设计阶段就考虑水平扩展、缓存（Redis）、数据库读写分离等。我们假设初期用户规模较小。

4.  **开发团队技能栈？**
    *   我们计划使用 **Python (FastAPI) + React**。如果团队成员对 JavaScript/TypeScript 更熟悉，可以考虑使用 Node.js 作为后端，但在 AI 集成方面，Python 仍然是更优的选择。

### 7.2 潜在风险与对策

| 风险 | 影响 | 对策 |
| :--- | :--- | :--- |
| **RAG 上下文管理不当** | AI 回答可能不准确或泛泛而谈，用户体验差。 | 从简单的单次检索开始，根据效果迭代。尝试不同的文本切分策略和向量相似度搜索的 `k` 值。为用户提供“重新生成”的选项。 |
| **数据库设计错误** | 后期难以修改，影响系统扩展性。 | Oracle 强调这是最高优先级的风险。**务必在开发 MVP 前花足够时间与团队一起审查数据模型设计**。使用 migrations (如 Alembic) 来管理数据库 schema 变更。 |
| **LLM 上下文窗口超限** | 向量检索到的材料太多，超过了 LLM 的处理上限（例如 GPT-4 的 8k token）。 | 始终将检索到的材料总长度控制在 LLM 的上下文窗口内。对于特别长的回复，可以考虑使用 `Agentic RAG`，让 Agent 分批检索和总结信息。 |
| **多租户数据隔离** | 如果支持多用户，确保一个用户只能看到自己的学习资料和数据。 | 在后端 API 层，为所有数据库查询添加 `WHERE user_id = current_user.id` 条件。对敏感操作进行权限校验。 |
| **性能问题** | 随着用户数量和学习资料增加，向量搜索变慢。 | `pgvector` 支持创建索引，务必为 `embedding` 列创建向量索引。在开发后期引入 Redis 缓存频繁访问的问答结果或学习资料摘要。 |

---

## 8. 总结

《AI学习伴侣》是一个将传统学习方法和前沿 AI 技术相结合的激动人心的产品。本设计文档为其提供了从产品愿景、技术架构、数据模型到开发路线图的全面蓝图。

**核心原则**: 从简单开始，逐步迭代。优先确保核心功能（番茄钟、进度保存、基础 RAG）的稳定性，再考虑高级特性。选择 `PostgreSQL + pgvector` 作为统一数据存储，是降低初期复杂度和运维成本的关键决策。

遵循本设计文档，一个高效、强大且个性化的 AI 学习伴侣应用将逐步变为现实。
