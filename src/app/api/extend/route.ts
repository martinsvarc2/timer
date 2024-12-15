import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const extendRequestSchema = z.object({
  sessionId: z.string()
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = extendRequestSchema.parse(body);

    const pool = createPool({
      connectionString: process.env.visionboard_PRISMA_URL
    });

    // First check if session exists and is active
    const { rows: [session] } = await pool.sql`
      SELECT * FROM timer_sessions 
      WHERE session_id = ${sessionId}
      AND is_active = true;
    `;

    if (!session) {
      return NextResponse.json({ 
        error: 'Invalid or expired session' 
      }, { status: 404 });
    }

    // Calculate new duration (extend by 30 minutes = 1800 seconds)
    const extensionSeconds = 1800;
    const newDuration = session.duration + extensionSeconds;

    // Update the session duration
    const { rows: [updatedSession] } = await pool.sql`
      UPDATE timer_sessions 
      SET duration = ${newDuration}
      WHERE session_id = ${sessionId}
      RETURNING session_id, duration, start_time;
    `;

    return NextResponse.json({
      success: true,
      sessionId: updatedSession.session_id,
      newDuration: updatedSession.duration,
      startTime: updatedSession.start_time,
      extensionAdded: extensionSeconds
    });

  } catch (error) {
    console.error('Error extending session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to extend session'
    }, { status: 500 });
  }
}
