import React from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface TimerControlsProps {
  isActive: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({ isActive, onStartPause, onReset, onSkip }) => {
  return (
    <div className="flex items-center justify-center space-x-4 mt-8">
      {/* Reset Button */}
      <button
        onClick={onReset}
        className="p-3 rounded-full bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300 hover:shadow-lg transition-all duration-200
                   dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Reset Timer"
      >
        <RotateCcw size={20} />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={onStartPause}
        className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
        aria-label={isActive ? "Pause Timer" : "Start Timer"}
      >
        {isActive ? <Pause size={32} /> : <Play size={32} />}
      </button>

      {/* Skip Button */}
      <button
        onClick={onSkip}
        className="p-3 rounded-full bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300 hover:shadow-lg transition-all duration-200
                   dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        aria-label="Skip Period"
      >
        <SkipForward size={20} />
      </button>
    </div>
  );
};

export default React.memo(TimerControls);
