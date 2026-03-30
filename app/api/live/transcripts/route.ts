import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const advisorId = searchParams.get('advisorId') || undefined;
    const transcripts = await db.getTranscripts({ advisorId });
    return NextResponse.json(transcripts);
  } catch (err: any) {
    console.error('[API] GET /api/live/transcripts error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load transcripts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transcript = await db.createTranscript(body);
    await db.logActivity({
      advisorId: transcript.advisorId || undefined,
      dealId: transcript.dealId || undefined,
      activityType: 'transcript_added',
      description: `Added transcript: ${transcript.title}`,
    });
    return NextResponse.json(transcript, { status: 201 });
  } catch (err: any) {
    console.error('[API] POST /api/live/transcripts error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save transcript' }, { status: 500 });
  }
}
