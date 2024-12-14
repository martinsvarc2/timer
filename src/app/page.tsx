'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Timer from '../components/Timer';

export default function Home() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const accessToken = searchParams.get('access');

  useEffect(() => {
    const startTimer = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch('/api/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken }),
        });

        if (!response.ok) throw new Error('Failed to start timer');

        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error('Error starting timer:', error);
      }
    };

    startTimer();
  }, [accessToken]);

  if (!accessToken) {
    return <div>Access token required</div>;
  }

  return (
    <main className="min-h-screen bg-transparent">
      {sessionId && <Timer sessionId={sessionId} />}
    </main>
  );
}
