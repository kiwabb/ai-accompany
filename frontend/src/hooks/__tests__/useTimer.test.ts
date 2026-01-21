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

  it('should call onComplete and stop when time reaches 0', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer({ initialSeconds: 2, onComplete }));
    
    act(() => {
      result.current.start();
    });
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should pause the timer', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer({ initialSeconds: 10, onComplete }));
    
    act(() => {
      result.current.start();
    });
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(result.current.timeLeft).toBe(8);
    
    act(() => {
      result.current.pause();
    });
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(result.current.timeLeft).toBe(8);
    expect(result.current.isActive).toBe(false);
  });

  it('should reset the timer', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer({ initialSeconds: 10, onComplete }));
    
    act(() => {
      result.current.start();
    });
    
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(result.current.timeLeft).toBe(5);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.timeLeft).toBe(10);
    expect(result.current.isActive).toBe(false);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(10);
  });
});
