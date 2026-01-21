# Cozy Pomodoro UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the Pomodoro Timer UI into a "Cozy Companion" style with playful animations, warm colors, and a friendly atmosphere.

**Architecture:** Use `framer-motion` for bouncy animations and transition effects. Leverage Tailwind CSS for a soft color palette and high-radius rounding.

**Tech Stack:** React, Tailwind CSS, Framer Motion, Lucide React.

---

### Task 1: 基础风格与全局样式定义

**文件:**
- 修改: `frontend/index.html`
- 修改: `frontend/src/index.css`
- 修改: `frontend/src/App.tsx`
- 修改: `frontend/tailwind.config.js`

**步骤 1: 引入 Google Fonts (Fredoka) 并配置 Tailwind**
- **文件**: `frontend/index.html`
- **操作**: 添加 Fredoka 字体链接。
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pomodoro Timer</title>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- **文件**: `frontend/tailwind.config.js`
- **操作**: 将 Fredoka 设为默认无衬线字体。
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fredoka', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffeddb',
          200: '#ffd8a8',
          300: '#ffb861',
          400: '#ff962c',
          500: '#f87b08',
          600: '#d36302',
          700: '#ae4d00',
          800: '#8c3f00',
          900: '#743300',
          950: '#421a00',
        },
        cozy: {
          cream: '#FDF7E4',
          lightPink: '#FBF0F6',
          pastelGreen: '#D4EDDA',
          pastelBlue: '#D7EBF8',
          warmOrange: '#FFB766',
          softRed: '#FF6B6B',
        }
      }
    },
  },
  plugins: [],
}
```

**步骤 3: 定义全局“可爱”基础样式**
- **文件**: `frontend/src/index.css`
- **内容**: 定义一些背景纹理效果和全局柔和颜色变量。
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-bg-primary: #FDF7E4; /* cozy cream */
    --color-text-primary: #333;
    --color-text-secondary: #666;
    --color-focus: #FF6B6B; /* soft red */
    --color-short-break: #D4EDDA; /* pastel green */
    --color-long-break: #D7EBF8; /* pastel blue */
  }

  body {
    @apply bg-cozy-cream text-cozy-dark-text;
    margin: 0;
    display: flex;
    place-items: center;
    min-width: 320px;
    min-height: 100vh;
  }
}

/* Custom scrollbar for a softer look */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.1);
}
```

**步骤 4: 更新 `App.tsx` 容器背景色**
- **文件**: `frontend/src/App.tsx`
- **操作**: 将主容器背景色改为 `bg-cozy-cream`。
```tsx
import PomodoroTimer from './components/PomodoroTimer'

function App() {
  return (
    <div className="min-h-screen bg-cozy-cream flex items-center justify-center p-4">
      <PomodoroTimer />
    </div>
  )
}

export default App
```

---

### Task 2: 重构 `TimerDisplay` 为“奶油风”视觉中心

**文件:**
- 修改: `frontend/src/components/TimerDisplay.tsx`

**步骤 1: 更新 `TimerDisplay.tsx`**
- **操作**: 使用 Framer Motion 包装，更新 SVG 颜色和线条样式，添加表情符号。
```tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Phase } from '../types/pomodoro';

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  phase: Phase;
}

const phaseEmojis: Record<Phase, string> = {
  focus: '✍️',
  shortBreak: '☕',
  longBreak: '🧘',
};

export const TimerDisplay = React.memo(({ timeLeft, totalTime, phase }: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / totalTime) * 100; // 进度条从100%到0%
  const circumference = 2 * Math.PI * 120;

  const getColor = () => {
    switch (phase) {
      case 'focus': return 'var(--color-focus)';
      case 'shortBreak': return 'var(--color-short-break)';
      case 'longBreak': return 'var(--color-long-break)';
      default: return 'var(--color-focus)';
    }
  };

  return (
    <motion.div
      className="relative flex items-center justify-center w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80"
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 256 256"
        role="progressbar"
        aria-valuenow={timeLeft}
        aria-valuemin={0}
        aria-valuemax={totalTime}
      >
        <title>Pomodoro Timer Progress</title>
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="transparent"
          stroke="var(--color-bg-primary)" // Background color from CSS var
          strokeWidth="10"
          className="drop-shadow-sm"
        />
        <motion.circle
          cx="128"
          cy="128"
          r="120"
          fill="transparent"
          stroke={getColor()} // Dynamic color from phase
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          strokeLinecap="round"
          className="transition-colors duration-500 ease-in-out drop-shadow-md"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          className="text-6xl md:text-7xl font-extrabold font-sans text-gray-800 dark:text-white"
          key={timeLeft} // Key change for re-render animation
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.span>
        <motion.span
          className="text-xl uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-2"
          key={phase} // Key change for re-render animation
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {phaseEmojis[phase]} {phase.replace(/([A-Z])/g, ' $1')}
        </motion.span>
      </div>
    </motion.div>
  );
});
```

---

### Task 3: 优化 `ThemeSelector` 与 `TimerControls` 的交互体验

**文件:**
- 修改: `frontend/src/components/ThemeSelector.tsx`
- 修改: `frontend/src/components/TimerControls.tsx`

**步骤 1: 更新 `ThemeSelector.tsx`**
- **操作**: 引入 Framer Motion，更新配色和按钮样式。
```tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { FocusTheme } from '../types/pomodoro';

interface ThemeSelectorProps {
  themes: FocusTheme[];
  activeThemeId: string;
  onSelect: (themeId: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, activeThemeId, onSelect }) => {
  return (
    <motion.div 
      className="flex space-x-2 p-1.5 rounded-full bg-cozy-lightPink shadow-inner-sm border border-cozy-cream/50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
    >
      {themes.map((theme) => (
        <motion.button
          key={theme.id}
          aria-pressed={activeThemeId === theme.id}
          aria-label={`Select ${theme.name} theme`}
          onClick={() => onSelect(theme.id)}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
            ${activeThemeId === theme.id
              ? 'bg-cozy-warmOrange text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-cozy-cream dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}
          `}
        >
          {theme.name}
        </motion.button>
      ))}
    </motion.div>
  );
};

export default React.memo(ThemeSelector);
```

**步骤 2: 更新 `TimerControls.tsx`**
- **操作**: 引入 Framer Motion，更新配色和按钮样式，添加图标动画。
```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface TimerControlsProps {
  isActive: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

const controlButtonVariants = {
  rest: { scale: 1, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  hover: { scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" },
  tap: { scale: 0.95, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
};

const primaryButtonVariants = {
  rest: { scale: 1, boxShadow: "0 10px 20px rgba(255,183,102,0.4)" },
  hover: { scale: 1.08, boxShadow: "0 12px 24px rgba(255,183,102,0.6)" },
  tap: { scale: 0.97, boxShadow: "0 4px 8px rgba(255,183,102,0.2)" },
};

const TimerControls: React.FC<TimerControlsProps> = ({
  isActive,
  onStartPause,
  onReset,
  onSkip,
}) => {
  return (
    <motion.div 
      className="flex items-center space-x-4 mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.button
        variants={controlButtonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={onReset}
        aria-label="Reset Timer"
        className="p-3 rounded-full bg-cozy-pastelGreen text-white text-lg shadow-md transition-all duration-200"
      >
        <RotateCcw size={24} />
      </motion.button>

      <motion.button
        variants={primaryButtonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={onStartPause}
        aria-label={isActive ? "Pause Timer" : "Start Timer"}
        className="w-20 h-20 rounded-full bg-cozy-warmOrange text-white flex items-center justify-center shadow-xl transition-all duration-200"
      >
        {isActive ? <Pause size={36} /> : <Play size={36} />}
      </motion.button>

      <motion.button
        variants={controlButtonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        onClick={onSkip}
        aria-label="Skip Period"
        className="p-3 rounded-full bg-cozy-pastelBlue text-white text-lg shadow-md transition-all duration-200"
      >
        <SkipForward size={24} />
      </motion.button>
    </motion.div>
  );
};

export default TimerControls;
```

---

### Task 4: 升级 `TimerSettingsModal` 的视觉细节

**文件:**
- 修改: `frontend/src/components/TimerSettingsModal.tsx`

**步骤 1: 更新 `TimerSettingsModal.tsx`**
- **操作**: 引入 Framer Motion，更新背景、弹窗动画和内部组件样式。
```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FocusTheme, TimerSettings } from '../types/pomodoro';
import { v4 as uuidv4 } from 'uuid';

interface TimerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: TimerSettings;
  initialThemes: FocusTheme[];
  onSave: (settings: TimerSettings, themes: FocusTheme[]) => void;
}

const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({
  isOpen,
  onClose,
  initialSettings,
  initialThemes,
  onSave,
}) => {
  const [settings, setSettings] = useState<TimerSettings>(initialSettings);
  const [themes, setThemes] = useState<FocusTheme[]>(initialThemes);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDuration, setNewThemeDuration] = useState(25);

  useEffect(() => {
    setSettings(initialSettings);
    setThemes(initialThemes);
  }, [initialSettings, initialThemes]);

  const handleSettingChange = useCallback((key: keyof TimerSettings, value: number | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleThemeNameChange = useCallback((id: string, name: string) => {
    setThemes((prev) =>
      prev.map((theme) => (theme.id === id ? { ...theme, name } : theme))
    );
  }, []);

  const handleThemeDurationChange = useCallback((id: string, duration: number) => {
    setThemes((prev) =>
      prev.map((theme) => (theme.id === id ? { ...theme, focusDuration: duration } : theme))
    );
  }, []);

  const handleAddTheme = useCallback(() => {
    if (newThemeName.trim() && newThemeDuration > 0) {
      setThemes((prev) => [
        ...prev,
        { id: uuidv4(), name: newThemeName.trim(), focusDuration: newThemeDuration, isDefault: false },
      ]);
      setNewThemeName('');
      setNewThemeDuration(25);
    }
  }, [newThemeName, newThemeDuration]);

  const handleRemoveTheme = useCallback((id: string) => {
    setThemes((prev) => prev.filter((theme) => theme.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    onSave(settings, themes);
    onClose();
  }, [settings, themes, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform scale-95"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h2>
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="text-gray-600 dark:text-gray-400" size={24} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Timer Durations</h3>
              <div className="space-y-4">
                {[ 
                  { key: 'shortBreakDuration', label: 'Short Break (minutes)' },
                  { key: 'longBreakDuration', label: 'Long Break (minutes)' },
                  { key: 'longBreakInterval', label: 'Long Break Interval (sessions)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label htmlFor={key} className="text-gray-600 dark:text-gray-300">{label}</label>
                    <input
                      id={key}
                      type="number"
                      min={1}
                      value={settings[key] as number}
                      onChange={(e) => handleSettingChange(key, parseInt(e.target.value))}
                      className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <label htmlFor="autoStartNext" className="text-gray-600 dark:text-gray-300">Auto Start Next Period</label>
                  <input
                    id="autoStartNext"
                    type="checkbox"
                    checked={settings.autoStartNext}
                    onChange={(e) => handleSettingChange('autoStartNext', e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Focus Themes</h3>
              <div className="space-y-3 mb-4">
                {themes.map((theme) => (
                  <div key={theme.id} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={theme.name}
                      onChange={(e) => handleThemeNameChange(theme.id, e.target.value)}
                      className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      disabled={theme.isDefault} // Prevent editing default theme names
                    />
                    <input
                      type="number"
                      min={1}
                      value={theme.focusDuration}
                      onChange={(e) => handleThemeDurationChange(theme.id, parseInt(e.target.value))}
                      className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    {!theme.isDefault && (
                      <button
                        onClick={() => handleRemoveTheme(theme.id)}
                        aria-label={`Remove ${theme.name} theme`}
                        className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="New Theme Name"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  min={1}
                  value={newThemeDuration}
                  onChange={(e) => setNewThemeDuration(parseInt(e.target.value))}
                  className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddTheme}
                  aria-label="Add new theme"
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-cozy-warmOrange text-white rounded-xl shadow-lg hover:bg-orange-600 transition-all duration-200"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TimerSettingsModal;
```