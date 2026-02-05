import { useState, useEffect, useCallback } from 'react';
import { useTimer } from './useTimer';

// Mock themes data as it seems to be missing from the original context
const THEMES = [
  { id: 'english', name: 'English Learning', focusDuration: 25, isDefault: true },
  { id: '408', name: 'Computer Science', focusDuration: 45, isDefault: true },
  { id: 'math', name: 'Mathematics', focusDuration: 60, isDefault: true },
];

interface FocusTimerState {
  activeThemeId: string | null;
}

export function useFocusTimer() {
  const [state, setState] = useState<FocusTimerState>({ activeThemeId: null });
  const [themes] = useState(THEMES);

  const activeTheme = themes.find(t => t.id === state.activeThemeId);
  const totalTimeValue = (activeTheme?.focusDuration || 0) * 60;

  const {
    timeLeft,
    isActive,
    start,
    pause,
    reset: resetTimer,
    setTimeLeft,
  } = useTimer({
    initialSeconds: totalTimeValue,
    onComplete: () => {
      console.log('Focus session completed!');
      setState(prevState => ({ ...prevState, activeThemeId: null }));
    },
  });

  useEffect(() => {
    // If there's an active theme, ensure the timer's timeLeft is correctly set.
    if (activeTheme) {
        // This might need adjustment based on whether we want to reset or resume
        setTimeLeft(totalTimeValue);
    }
  }, [state.activeThemeId, setTimeLeft, totalTimeValue, activeTheme]);


  const startFocusSession = useCallback((themeId: string) => {
    setState({ activeThemeId: themeId });
    // The useEffect above will handle setting the time and starting the timer will be handled by the component
  }, []);

  const reset = useCallback(() => {
    resetTimer();
    setState({ activeThemeId: null });
  }, [resetTimer]);

  return {
    isActive,
    timeLeft,
    totalTimeValue,
    state,
    reset,
    themes,
    start,
    pause,
    startFocusSession,
  };
}
