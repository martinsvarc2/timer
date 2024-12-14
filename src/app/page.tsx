'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Timer from './components/Timer';

export default function Home() {
  const searchParams = useSearchParams();
  const accessToken = searchParams.get('access');

  if (!accessToken) {
    return <div>Access token required</div>;
  }

  return (
    <main className="min-h-screen bg-transparent">
      <div className="text-center p-6">
        Waiting for session to start...
      </div>
    </main>
  );
}
