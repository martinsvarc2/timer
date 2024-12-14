'use client';

import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from './ui/alert-dialog';

const Timer = ({ sessionId }: { sessionId: string }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showExtend, setShowExtend] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const validateSession = async () => {
      try {
        const response = await fetch(`/api/validate?sessionId=${sessionId}`);
        if (!response.ok) {
          setIsValid(false);
          return;
        }
        
        setIsValid(true);
        // Only start the timer after validation
        if (timeLeft === null) {
          setTimeLeft(600); // 10 minutes
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();

    if (isValid && timeLeft !== null) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === null) return null;
          if (prevTime <= 60 && prevTime > 0) {
            setShowExtend(true);
          }
          if (prevTime <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, isValid, timeLeft]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div>Validating session...</div>;
  }

  if (!isValid) {
    return <div>Session expired or invalid</div>;
  }

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
