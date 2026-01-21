# Pomodoro Timer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a customizable Pomodoro timer with focus themes and global break settings.

**Architecture:** A React-based frontend using a custom `useTimer` hook for logic, modular components for UI, and `localStorage` for persistence.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React, Vitest (for testing).

### Task 0: Project Setup & Dependencies

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`

**Step 1: Add dependencies**
Run: `npm install lucide-react` in `frontend`
Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` in `frontend`

**Step 2: Configure Vitest**
Modify `frontend/vite.config.ts` to include `test` configuration.
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```
Create `frontend/src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

**Step 3: Commit**
```bash
git add frontend/package.json frontend/vite.config.ts frontend/src/test/setup.ts
git commit -m "chore: setup testing environment and add lucide-react"
```

### Task 1: Data Models & Types

**Files:**
- Create: `frontend/src/types/pomodoro.ts`

**Step 1: Define FocusTheme and TimerSettings interfaces**
```typescript
export interface FocusTheme {
  id: string;
  name: string;
  focusDuration: number; // in minutes
  isDefault: boolean;
}

export interface TimerSettings {
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartNext: boolean;
}

export type Phase = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerState {
  timeLeft: number; // in seconds
  isActive: boolean;
  currentPhase: Phase;
  completedSessions: number;
}
```

**Step 2: Commit**
```bash
git add frontend/src/types/pomodoro.ts
git commit -m "feat: define pomodoro types"
```

### Task 2: useTimer Hook (Logic)

**Files:**
- Create: `frontend/src/hooks/useTimer.ts`
- Create: `frontend/src/hooks/__tests__/useTimer.test.ts`

**Step 1: Write failing test for countdown logic**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../useTimer';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with initial time and decrement', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer({ initialSeconds: 10, onComplete }));
    expect(result.current.timeLeft).toBe(10);
    
    act(() => {
      result.current.start();
    });
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.timeLeft).toBe(9);
    expect(result.current.isActive).toBe(true);
  });
});
```

**Step 2: Implement minimal useTimer hook**
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerProps {
  initialSeconds: number;
  onComplete: () => void;
}

export function useTimer({ initialSeconds, onComplete }: UseTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      onCompleteRef.current();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback(() => {
    setIsActive(false);
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  return { timeLeft, isActive, start, pause, reset, setTimeLeft };
}
```

**Step 3: Run tests**
Run: `npx vitest run frontend/src/hooks/__tests__/useTimer.test.ts`

**Step 4: Commit**
```bash
git add frontend/src/hooks/useTimer.ts frontend/src/hooks/__tests__/useTimer.test.ts
git commit -m "feat: implement useTimer hook with basic countdown"
```

### Task 3: Constants and Default Data

**Files:**
- Create: `frontend/src/constants/pomodoro.ts`

**Step 1: Define initial themes and settings**
```typescript
import { FocusTheme, TimerSettings } from '../types/pomodoro';

export const DEFAULT_THEMES: FocusTheme[] = [
  { id: 'english', name: 'English', focusDuration: 25, isDefault: true },
  { id: '408', name: '408', focusDuration: 45, isDefault: true },
  { id: 'math', name: 'Math', focusDuration: 60, isDefault: true },
];

export const DEFAULT_SETTINGS: TimerSettings = {
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartNext: false,
};
```

**Step 2: Commit**
```bash
git add frontend/src/constants/pomodoro.ts
git commit -m "feat: add default pomodoro constants"
```

### Task 4: TimerDisplay Component

**Files:**
- Create: `frontend/src/components/TimerDisplay.tsx`

**Step 1: Implement TimerDisplay with progress ring**
(Use Tailwind for the ring and text)
```typescript
interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  phase: string;
}

export function TimerDisplay({ timeLeft, totalTime, phase }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200"
        />
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={2 * Math.PI * 120}
          strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
          className="text-blue-500 transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold font-mono">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-sm uppercase tracking-wider text-gray-500">{phase}</span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add frontend/src/components/TimerDisplay.tsx
git commit -m "feat: implement TimerDisplay component with progress ring"
```

### Task 5: ThemeSelector and TimerControls Components

**Files:**
- Create: `frontend/src/components/ThemeSelector.tsx`
- Create: `frontend/src/components/TimerControls.tsx`

**Step 1: Implement ThemeSelector**
```typescript
import { FocusTheme } from '../types/pomodoro';

interface ThemeSelectorProps {
  themes: FocusTheme[];
  activeThemeId: string;
  onSelect: (theme: FocusTheme) => void;
}

export function ThemeSelector({ themes, activeThemeId, onSelect }: ThemeSelectorProps) {
  return (
    <div className="flex gap-2 mb-8">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeThemeId === theme.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {theme.name}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Implement TimerControls**
```typescript
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface TimerControlsProps {
  isActive: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({ isActive, onStartPause, onReset, onSkip }: TimerControlsProps) {
  return (
    <div className="flex items-center gap-6 mt-8">
      <button onClick={onReset} className="p-2 text-gray-400 hover:text-gray-600">
        <RotateCcw size={24} />
      </button>
      <button
        onClick={onStartPause}
        className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg"
      >
        {isActive ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
      </button>
      <button onClick={onSkip} className="p-2 text-gray-400 hover:text-gray-600">
        <SkipForward size={24} />
      </button>
    </div>
  );
}
```

**Step 3: Commit**
```bash
git add frontend/src/components/ThemeSelector.tsx frontend/src/components/TimerControls.tsx
git commit -m "feat: implement ThemeSelector and TimerControls components"
```

### Task 6: PomodoroTimer Main Container

**Files:**
- Create: `frontend/src/components/PomodoroTimer.tsx`

**Step 1: Implement state management and phase logic**
- Load from `localStorage` on mount.
- Handle phase transitions.
- Use `useTimer` hook.

**Step 2: Commit**
```bash
git add frontend/src/components/PomodoroTimer.tsx
git commit -m "feat: implement main PomodoroTimer component with state management"
```

### Task 7: TimerSettingsModal

**Files:**
- Create: `frontend/src/components/TimerSettingsModal.tsx`

**Step 1: Implement settings UI**
- Edit break durations.
- Add/Edit/Delete themes.
- Toggle auto-start.

**Step 2: Commit**
```bash
git add frontend/src/components/TimerSettingsModal.tsx
git commit -m "feat: implement TimerSettingsModal component"
```

### Task 8: Integration and Final Polish

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/index.css`

**Step 1: Integrate PomodoroTimer into App.tsx**
**Step 2: Run build to verify**
Run: `npm run build` in `frontend`
**Step 3: Commit**
```bash
git add frontend/src/App.tsx frontend/src/index.css
git commit -m "feat: integrate PomodoroTimer into main App"
```
