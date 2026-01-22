
## 6. Future Enhancements & Unimplemented Features
While the core "CozyPal" functionality is live, the following features from the [original design plan](docs/plans/2026-01-22-ai-chat-companion-design.md) are yet to be implemented:

### 3. AI Logic & Intelligence
*   **Proactive Messages (主动对话)**:
    *   Currently: The AI only responds when the user types.
    *   Planned: AI should proactively send "bubble" messages at key events (e.g., "Timer started! Good luck!", "Halfway there!", "Well done!").
*   **Actionable AI (功能调用)**:
    *   Currently: The AI is purely conversational.
    *   Planned: AI should be able to control the timer (start/stop) or change themes upon request (e.g., "Start a 25m focus session").
*   **Chat History Persistence (历史记录)**:
    *   Currently: Chat history is transient and lost on page reload.
    *   Planned: Store chat history in the PostgreSQL database (`ChatHistory` model) to maintain context across sessions.
*   **Advanced Persona Configuration**:
    *   Currently: Persona is hardcoded/default ("gentle_encourager").
    *   Planned: Allow users to switch personas (e.g., "Strict Coach", "Funny Friend") in settings.

### 2. Interaction Design
*   **Advanced Animations**:
    *   Currently: Basic "Typing..." pulse and idle hover effects.
    *   Planned: More complex animations for different states (e.g., wearing headphones when focused, sleeping when idle for long).

### 5. Privacy
*   **Data Masking**:
    *   Currently: Basic context is sent.
    *   Planned: Granular privacy controls to let users decide exactly what data (mood, history) is shared with the AI.
