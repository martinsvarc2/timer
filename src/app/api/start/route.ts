import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    const pool = createPool({
      connectionString: process.env.visionboard_PRISMA_URL
    });

    const { rows: [session] } = await pool.sql`
      INSERT INTO timer_sessions (access_token, is_active)
      VALUES (${accessToken}, true)
      RETURNING session_id;
    `;

    return NextResponse.json({ 
      sessionId: session.session_id,
      message: 'Timer started successfully' 
    });

  } catch (error) {
    console.error('Error starting timer:', error);
    return NextResponse.json({ error: 'Failed to start timer' }, { status: 500 });
  }
}
