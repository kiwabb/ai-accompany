
import type { Phase } from '../types/pomodoro';

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  phase: Phase;
}

import React from 'react';

export const TimerDisplay = React.memo(({ timeLeft, totalTime, phase }: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
            <svg 
        className="w-full h-full -rotate-90"
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
});
