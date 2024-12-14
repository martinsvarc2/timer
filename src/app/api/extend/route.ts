import { NextResponse } from 'next/server';
import { z } from 'zod';

const extendRequestSchema = z.object({
  sessionId: z.string(),
  memberId: z.string(),
  extendedMinutes: z.number()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, memberId, extendedMinutes } = extendRequestSchema.parse(body);

    // Call the webhook
    const webhookResponse = await fetch('https://hook.eu2.make.com/daxebfbbpbxk1lncme1mga4k365qu9g7', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberId,
        extendedMinutes
      })
    });

    if (!webhookResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to process extension request' 
      }, { status: 500 });
    }

    const webhookData = await webhookResponse.json();

    if (!webhookData.Valid) {
      return NextResponse.json({ 
        error: 'Extension request denied', 
        reason: 'Invalid request or insufficient credits' 
      }, { status: 400 });
    }

    // If valid, return the extension period
    return NextResponse.json({
      success: true,
      extendPeriod: webhookData.ExtendPeriod
    });

  } catch (error) {
    console.error('Error processing extension request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to process extension request'
    }, { status: 500 });
  }
}
