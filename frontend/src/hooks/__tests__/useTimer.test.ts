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
