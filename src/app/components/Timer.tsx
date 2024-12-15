'use client';

import React, { useState, useEffect } from 'react';

interface TimerProps {
  sessionId: string;
  startTime: string;
  duration: number;
  memberId?: string;
}

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
      return Math.max(0, duration - elapsed);
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

  const handleExtend = async (minutes: number, credits: number) => {
    setIsExtending(true);
    try {
      const response = await fetch('/api/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          memberId,
          extendedMinutes: minutes
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to extend session');
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

  if (error) return <span className="text-red-500 text-sm">{error}</span>;

  return (
    <>
      <span className="inline-flex items-center gap-2 h-7">
        <span className="text-xl leading-7">{formatTime(timeLeft)}</span>
        <button 
          onClick={() => setShowExtend(true)} 
          className="bg-[#5B21B6] text-white text-sm px-4 h-7 rounded-full hover:bg-[#4C1D95] disabled:opacity-50"
          disabled={isExtending}
        >
          Extend Time
        </button>
      </span>

      {showExtend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-[24px] max-w-[90%] w-[400px] p-4">
            <h2 className="text-2xl font-bold text-center text-[#5B21B6] mb-4">Extend Call Duration</h2>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { minutes: 5, credits: 1 },
                { minutes: 10, credits: 2 },
                { minutes: 15, credits: 3 }
              ].map(option => (
                <button
                  key={option.minutes}
                  onClick={() => handleExtend(option.minutes, option.credits)}
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
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Timer;
