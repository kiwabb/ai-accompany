# AI Chat Companion (AI 聊天伴侣) 详细设计文档

## 📅 日期: 2026-01-22
## 状态: 已验证 (Validated)

## 1. 概述 (Overview)
为 "AI Accompany" 项目添加一个具有情感陪伴能力的 AI 聊天助手。该助手将以悬浮虚拟形象 (Avatar) 的形式存在，具备感知用户学习状态、提供情感价值、主动关怀以及辅助操作软件的能力。

## 2. 交互设计 (User Experience & Interaction)
- **核心组件**: 一个名为 "Cozy Pal" 的右下角悬浮组件。
- **形态**: 一个具备微动画 (Framer Motion) 的 SVG 虚拟形象。
- **状态切换**:
    - **闲置**: 呼吸感动画。
    - **专注中**: 陪读模式（带耳机、看书等）。
- **对话形式**:
    - 点击 Avatar 弹出毛玻璃效果的对话窗口。
    - **主动对话**: 在关键节点（开始专注、进度过半、完成任务）弹出非侵入式的简短气泡消息。
- **字体**: 使用 `M PLUS Rounded 1c` 确保视觉温润。

## 3. AI 逻辑与语境感知 (AI Intelligence)
- **默认人设**: 温柔鼓励型（温柔、多鼓励、感知疲惫）。
- **可配置项**: 人设切换（硬核督促、幽默吐槽）、主动性开关、助手权限开关。
- **语境注入 (Context Injection)**:
    - **实时**: 任务名称、剩余时间、当前阶段。
    - **历史 (需授权)**: 学习习惯、专注频率。
    - **情感 (需授权)**: 用户输入的心情状态。
- **功能调用 (Actionable AI)**:
    - AI 可控制计时器（开始、休息、停止）。
    - AI 可调节界面氛围（明暗、主题）。

## 4. 技术架构 (Technical Architecture)
- **Frontend**:
    - React + Framer Motion (UI/Animation)。
    - SSE (Server-Sent Events) 或 WebSocket 实现流式对话。
    - i18next 集成，确保回复语言与 UI 语言一致。
- **Backend**:
    - FastAPI 接口 `/api/chat/completions`。
    - Prompt 组装引擎，负责合并用户数据与 System Prompt。
    - PostgreSQL 存储对话历史 (`ChatHistory`)。
- **LLM**: 支持 Gemini/OpenAI 等主流模型。

## 5. 隐私与安全 (Privacy)
- **隐私增强选项**: 习惯分析、心情记录默认关闭，需用户手动勾选。
- **数据脱敏**: 在用户未授权时，后端在组装 Prompt 时自动剔除相关字段。

## 6. 后续计划 (Next Steps)
1. 创建独立开发分支。
2. 实现后端聊天接口与数据库模型。
3. 实现前端悬浮 Avatar 组件。
4. 集成 LLM API 并进行人设调优。
