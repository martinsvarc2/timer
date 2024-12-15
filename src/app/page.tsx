'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Timer from './components/Timer';

interface TimerSession {
  sessionId: string;
  startTime: string;
  duration: number;
  isActive: boolean;
}

export default function Home() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<TimerSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const accessToken = searchParams.get('access');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TIMER_ENDED') {
        window.location.href = 'https://app.trainedbyai.com/sales-arena';
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const checkSession = async () => {
      try {
        const response = await fetch(`/api/start?access_token=${accessToken}`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.session) setSession(data.session);
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 2000);
    return () => clearInterval(interval);
  }, [accessToken]);

  if (!accessToken) {
    return <span className="text-red-600">Access token required</span>;
  }

  if (error) {
    return <span className="text-red-600">{error}</span>;
  }

  if (!session) {
    return <span className="text-gray-600">Press the Start Call Button</span>;
  }

  return session.isActive ? (
    <Timer 
      sessionId={session.sessionId} 
      startTime={session.startTime}
      duration={session.duration}
    />
  ) : null;
}
