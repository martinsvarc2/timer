'use client';

import React, { useState, useEffect } from 'react';

interface TimerProps {
  sessionId: string;
  startTime: string;
  duration: number;
  memberId?: string;
}

interface ExtendOption {
  seconds: number;
  credits: number;
  minutes: number;
}

const extendOptions: ExtendOption[] = [
  { seconds: 300, credits: 1, minutes: 5 },
  { seconds: 600, credits: 2, minutes: 10 },
  { seconds: 900, credits: 3, minutes: 15 },
];

const Timer: React.FC<TimerProps> = ({ sessionId, startTime, duration, memberId = 'mem_sb_cm3hw95d30mio0spfgqe5bytb' }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showExtend, setShowExtend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = duration - elapsed;
      return Math.max(0, remaining);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        window.parent.postMessage({ type: 'TIMER_ENDED' }, '*');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleExtend = async (option: ExtendOption) => {
    setIsExtending(true);
    try {
      const response = await fetch('/api/extend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          memberId,
          extendedMinutes: option.minutes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extend session');
      }

      if (data.success && data.extendPeriod) {
        duration += data.extendPeriod;
        setShowExtend(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend session');
    } finally {
      setIsExtending(false);
    }
  };

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="flex items-center justify-end gap-2 px-2">
      <div className="text-2xl font-bold whitespace-nowrap" aria-live="polite" aria-atomic="true">
        {formatTime(timeLeft)}
      </div>
      <button 
        onClick={() => setShowExtend(true)} 
        className="bg-[#5B21B6] text-white hover:bg-[#4C1D95] rounded-full py-1.5 px-4 text-sm font-medium transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
        disabled={isExtending}
      >
        Extend Time
      </button>

      {showExtend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-[24px] max-w-[90%] w-[400px] p-4">
            <h2 className="text-2xl font-bold text-center text-[#5B21B6] mb-4">
              Extend Call Duration
            </h2>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {extendOptions.map((option) => (
                <button
                  key={option.seconds}
                  onClick={() => handleExtend(option)}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white shadow-md hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                  disabled={isExtending}
                >
                  <div className="text-lg font-bold">+{option.minutes}</div>
                  <div className="text-sm font-medium">Min</div>
                  <div className="text-xs text-gray-600">-{option.credits} credit{option.credits > 1 ? 's' : ''}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowExtend(false)}
              className="w-full bg-[#5B21B6] text-white hover:bg-[#4C1D95] rounded-full py-2 text-sm font-medium transition-colors duration-200"
              disabled={isExtending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
