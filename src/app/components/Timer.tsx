'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";

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
        // Signal to parent that time is up
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
        // Update duration by adding the new extension period (in seconds)
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
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="relative w-full max-w-md mx-auto mt-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <div className="text-4xl font-bold" aria-live="polite" aria-atomic="true">
          {formatTime(timeLeft)}
        </div>
        <button 
  onClick={() => setShowExtend(true)} 
  className="bg-[#5B21B6] text-white hover:bg-[#4C1D95] rounded-full py-3 px-8 text-lg font-medium transition-colors duration-200 disabled:opacity-50"
  disabled={isExtending}
>
  Extend Time
</button>
      </div>

      <AlertDialog open={showExtend} onOpenChange={setShowExtend}>
        <AlertDialogContent className="bg-white p-4 rounded-[32px] max-w-md">
          <h2 className="text-4xl font-bold text-center text-[#5B21B6] mb-6">
            Extend Call Duration
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {extendOptions.map((option) => (
              <button
                key={option.seconds}
                onClick={() => handleExtend(option)}
                className="flex flex-col items-center justify-center p-3 rounded-3xl bg-white shadow-lg hover:bg-gray-50 transition-all duration-200 group disabled:opacity-50"
                disabled={isExtending}
              >
                <div className="text-xl font-bold mb-1">+ {option.minutes}</div>
                <div className="text-lg font-bold mb-2">Minutes</div>
                <div className="text-gray-600 text-base">-{option.credits} credit{option.credits > 1 ? 's' : ''}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowExtend(false)}
            className="w-full bg-[#5B21B6] text-white hover:bg-[#4C1D95] rounded-full py-2.5 px-8 text-xl font-medium transition-colors duration-200"
            disabled={isExtending}
          >
            Cancel
          </button>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Timer;
