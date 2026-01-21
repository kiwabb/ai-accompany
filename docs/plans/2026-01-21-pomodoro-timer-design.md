# Design Document: Pomodoro Timer with Focus Themes

**Date:** 2026-01-21
**Topic:** Pomodoro Timer implementation for AI Learning Companion
**Status:** Validated

## 1. Overview
A customizable Pomodoro timer designed for students, supporting focus themes (e.g., English, Math, 408) with specific durations and global break configurations.

## 2. Requirements
- **Focus Themes (Mixed Mode):**
    - Default themes: English (25m), 408 (45m), Math (60m).
    - User can add, edit, or delete custom themes.
    - Each theme has its own configurable focus duration.
- **Global Break Settings:**
    - Short break duration (default 5m).
    - Long break duration (default 15m).
    - Long break interval (default 4 sessions).
    - All break settings are user-configurable.
- **Core Timer Logic:**
    - Start, Pause, Reset, Skip functionality.
    - Phase transitions: Focus -> Short/Long Break -> Focus.
    - Persistence via `localStorage`.
- **UI/UX:**
    - Visual indicator of current phase.
    - Responsive design for mobile/desktop.
    - Circular progress bar.

## 3. Architecture & Data Structures

### 3.1 Data Models
```typescript
interface FocusTheme {
  id: string;
  name: string;
  focusDuration: number; // in minutes
  isDefault: boolean;
}

interface TimerSettings {
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartNext: boolean;
}

type Phase = 'focus' | 'shortBreak' | 'longBreak';
```

### 3.2 State Management
- `activeTheme`: Currently selected theme.
- `themes`: List of all available themes.
- `settings`: Global timer configurations.
- `timerState`: `timeLeft`, `isActive`, `currentPhase`, `completedSessions`.

## 4. Components
- `PomodoroTimer`: Main container component.
- `TimerDisplay`: Large time display with progress ring.
- `ThemeSelector`: Tabs/List for selecting focus themes.
- `TimerControls`: Action buttons (Start/Pause, Reset, Skip).
- `TimerSettingsModal`: Modal for managing themes and global settings.

## 5. Technical Implementation
- **Vite/React/TypeScript** for the frontend.
- **Tailwind CSS** for styling.
- **Lucide React** for icons.
- **Custom Hook `useTimer`** for core countdown logic.
- **localStorage** for data persistence.

## 6. Future Extensibility
- Backend integration (Issue #2) for syncing progress.
- Browser notifications and sound alerts.
- Data visualization for learning statistics.
