'use client';

import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Timer = ({ sessionId }: { sessionId: string }) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [showExtend, setShowExtend] = useState(false);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch(`/api/validate?sessionId=${sessionId}`);
        if (!response.ok) {
          setIsValid(false);
          return;
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        setIsValid(false);
      }
    };

    const interval = setInterval(() => {
      validateSession();
      
      setTimeLeft((prevTime) => {
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

    return () => clearInterval(interval);
  }, [sessionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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