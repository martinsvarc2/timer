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
  const [isExtending, setIsExtending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLastMinute, setIsLastMinute] = useState(false);

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
      
      // Check if we're in the last minute
      setIsLastMinute(remaining <= 60);
      
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

  const handleExtendClick = () => {
    window.parent.postMessage({ 
      type: 'SHOW_EXTEND_MODAL',
      data: {
        sessionId,
        memberId
      }
    }, '*');
  };

  if (error) return <span className="text-red-500 text-sm">{error}</span>;

  return (
    <span className="inline-flex items-center h-7">
      <span 
        className={`
          text-xl leading-7 font-montserrat font-bold
          ${isLastMinute ? 'text-red-600 animate-heartbeat' : 'text-black'}
          transition-colors duration-300
        `}
      >
        {formatTime(timeLeft)}
      </span>
    </span>
  );
};

export default Timer;
