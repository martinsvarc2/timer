'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Timer from './components/Timer';

interface TimerSession {
  sessionId: string;
  startTime: number;
  isActive: boolean;
}

export default function Home() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<TimerSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const accessToken = searchParams.get('access');

  // Poll for active session
  useEffect(() => {
    if (!accessToken) return;

    const checkSession = async () => {
      try {
        const response = await fetch(`/api/check-session?accessToken=${accessToken}`);
        if (!response.ok) return;

        const data = await response.json();
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-6 rounded-lg bg-white shadow-lg">
          <div className="text-xl font-semibold text-gray-700">
            Waiting for session to start...
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Session will begin when triggered
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      {session.isActive && <Timer sessionId={session.sessionId} startTime={session.startTime} />}
    </main>
  );
}
