'use client';

import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from './ui/alert-dialog';

interface TimerProps {
  sessionId: string;
  startTime: string;
  duration: number;
}

const Timer = ({ sessionId, startTime, duration }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showExtend, setShowExtend] = useState(false);

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

      if (remaining <= 60 && remaining > 0) {
        setShowExtend(true);
      }

      if (remaining <= 0) {
        clearInterval(interval);
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

  return (
    <div className="relative w-full max-w-md mx-auto mt-8">
      <div className="text-center p-6 rounded-lg shadow-lg bg-white">
        <div className="text-4xl font-bold mb-4">{formatTime(timeLeft)}</div>
      </div>

      <AlertDialog open={showExtend} onOpenChange={setShowExtend}>
        <AlertDialogContent className="bg-white p-6 rounded-lg shadow-xl">
          <AlertDialogTitle className="text-xl font-bold text-purple-600 mb-4">
            Time is almost up!
          </AlertDialogTitle>
          <button
            onClick={() => setShowExtend(false)}
            className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Okay
          </button>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Timer;
