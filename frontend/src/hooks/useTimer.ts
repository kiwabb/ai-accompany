import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'pomodoro_timer_state';

interface TimerState {
  timeLeft: number;
  isActive: boolean;
  lastUpdated: number;
  initialSeconds: number;
}

interface UseTimerProps {
  initialSeconds: number;
  onComplete: () => void;
}

export function useTimer({ initialSeconds, onComplete }: UseTimerProps) {
  // Use lazy initialization to recover state immediately on mount
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialSeconds;
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed: TimerState = JSON.parse(savedState);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - parsed.lastUpdated) / 1000);

        // If it was valid and active
        if (parsed.isActive) {
          const newTimeLeft = parsed.timeLeft - elapsedSeconds;
          // If valid remaining time, return it
          if (newTimeLeft > 0) return newTimeLeft;
          // If expired during away, returning 0 might cause issues if not handled, 
          // let's return 0 and handle completion in effect
          return 0;
        }
        // If paused, return saved time
        return parsed.timeLeft;
      }
    } catch (e) {
      console.error(e);
    }
    return initialSeconds;
  });

  // Also recover active state lazily
  const [isActive, setIsActive] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed: TimerState = JSON.parse(savedState);
        // Only restore active if not expired
        if (parsed.isActive) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - parsed.lastUpdated) / 1000);
          return (parsed.timeLeft - elapsedSeconds) > 0;
        }
        return false;
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  });

  const onCompleteRef = useRef(onComplete);
  // Ref to track previous initialSeconds to avoid reset on refresh
  const prevInitialSeconds = useRef(initialSeconds);
  const initialSecondsRef = useRef(initialSeconds);

  // Update refs
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Only sync refs, handled in logic
  useEffect(() => {
    initialSecondsRef.current = initialSeconds;
  }, [initialSeconds]);

  useEffect(() => {
    if (prevInitialSeconds.current === initialSeconds) return;
    prevInitialSeconds.current = initialSeconds;
    queueMicrotask(() => {
      setTimeLeft(initialSeconds);
      setIsActive(false);
      localStorage.removeItem(STORAGE_KEY);
    });
  }, [initialSeconds]);

  // Persist state functionality
  const saveState = useCallback((tl: number, active: boolean, init: number) => {
    const state: TimerState = {
      timeLeft: tl,
      isActive: active,
      lastUpdated: Date.now(),
      initialSeconds: init
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  // Save state when pausing/stopping
  useEffect(() => {
    // Only save if it's a valid remaining time and not currently active
    // This prevents saving 0 back to local storage when the timer completes
    if (!isActive && timeLeft > 0) {
      saveState(timeLeft, false, initialSecondsRef.current);
    }
  }, [isActive, timeLeft, saveState]);

  // Trusted interval implementation
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      let isCompleted = false;
      setTimeLeft(t => {
        const newVal = t - 1;
        if (newVal <= 0) {
          setIsActive(false);
          localStorage.removeItem(STORAGE_KEY);
          onCompleteRef.current();
          return 0;
        }
        // Save state during tick
        const state: TimerState = {
          timeLeft: newVal,
          isActive: true,
          lastUpdated: Date.now(),
          initialSeconds: initialSecondsRef.current
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return newVal;
      });
    }, 1000);


    return () => clearInterval(id);
  }, [isActive]);

  // Sync timeLeft when duration changes (e.g. phase change) 
  // This is already handled by the early useEffect[initialSeconds], 
  // this block was causing reset on pause


  const start = useCallback(() => {
    setIsActive(true);
    saveState(timeLeft, true, initialSecondsRef.current);
  }, [timeLeft, saveState]);

  const pause = useCallback(() => {
    setIsActive(false);
    saveState(timeLeft, false, initialSecondsRef.current);
  }, [timeLeft, saveState]);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeLeft(initialSeconds);
    localStorage.removeItem(STORAGE_KEY);
  }, [initialSeconds]);

  return { timeLeft, isActive, start, pause, reset, setTimeLeft };
}
