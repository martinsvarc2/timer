'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Timer from './components/Timer';

export default function Home() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = searchParams.get('access');

  useEffect(() => {
    const startTimer = async () => {
      if (!accessToken) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start timer');
        }

        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error('Error starting timer:', error);
        setError(error instanceof Error ? error.message : 'Failed to start timer');
      } finally {
        setIsLoading(false);
      }
    };

    startTimer();
  }, [accessToken]);

  if (!accessToken) {
    return <div>Access token required</div>;
  }

  if (isLoading) {
    return <div>Starting timer session...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-transparent">
      {sessionId && <Timer sessionId={sessionId} />}
    </main>
  );
}
