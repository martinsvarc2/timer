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

  // Add message listener for iframe communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TIMER_ENDED') {
        window.location.href = 'https://app.trainedbyai.com/sales-arena';
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Poll for active session
  useEffect(() => {
    if (!accessToken) return;

    const checkSession = async () => {
      try {
        const response = await fetch(`/api/start?access_token=${accessToken}`);
        if (!response.ok) {
          console.error('Failed to check session:', await response.text());
          return;
        }
        const data = await response.json();
        console.log('Session data:', data); // Debug log
        if (data.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };

    // Check immediately and then every 2 seconds
    checkSession();
    const interval = setInterval(checkSession, 2000);
    return () => clearInterval(interval);
  }, [accessToken]);

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-6 rounded-lg bg-red-50 text-red-600">
          Access token is required
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-6 rounded-lg bg-red-50 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!session) {
  return (
    <div className="flex items-center justify-end px-2">
      <div className="text-sm text-gray-700 whitespace-nowrap">
        Press the Start Call Button
      </div>
    </div>
  );
}

  return (
    <main className="min-h-screen bg-transparent">
      {session.isActive && (
        <Timer 
          sessionId={session.sessionId} 
          startTime={session.startTime}
          duration={session.duration}
        />
      )}
    </main>
  );
}
