import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const startTimerSchema = z.object({
  accessToken: z.string().min(1),
  duration: z.union([
    z.number(),
    z.string().transform((val) => parseInt(val, 10))
  ]).optional().default(600)
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate and transform input
    const { accessToken, duration } = startTimerSchema.parse(body);

    if (isNaN(duration) || duration < 1 || duration > 7200) {
      return NextResponse.json({
        error: 'Invalid duration. Must be between 1 and 7200 seconds'
      }, { status: 400 });
    }

    const pool = createPool({
      connectionString: process.env.visionboard_PRISMA_URL
    });

    // Check if there's already an active session
    const { rows: existingSessions } = await pool.sql`
      SELECT session_id 
      FROM timer_sessions 
      WHERE access_token = ${accessToken} 
      AND is_active = true;
    `;

    if (existingSessions.length > 0) {
      return NextResponse.json({
        error: 'Active session already exists',
        sessionId: existingSessions[0].session_id
      }, { status: 409 });
    }

    const { rows: [session] } = await pool.sql`
      INSERT INTO timer_sessions (
        access_token,
        is_active,
        start_time,
        duration
      )
      VALUES (
        ${accessToken},
        true,
        CURRENT_TIMESTAMP,
        ${duration}
      )
      RETURNING 
        session_id,
        access_token,
        start_time,
        duration;
    `;

    return NextResponse.json({
      sessionId: session.session_id,
      accessToken: session.access_token,
      startTime: session.start_time,
      duration: session.duration,
      message: 'Timer started successfully'
    });

  } catch (error) {
    console.error('Error starting timer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to start timer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper endpoint to check session status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get('access_token');

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    const pool = createPool({
      connectionString: process.env.visionboard_PRISMA_URL
    });

    const { rows: [session] } = await pool.sql`
      SELECT 
        session_id,
        start_time,
        duration,
        is_active
      FROM timer_sessions
      WHERE access_token = ${accessToken}
      AND is_active = true
      ORDER BY start_time DESC
      LIMIT 1;
    `;

    if (!session) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        sessionId: session.session_id,
        startTime: session.start_time,
        duration: session.duration,
        isActive: session.is_active
      }
    });

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ error: 'Failed to check session' }, { status: 500 });
  }
}
