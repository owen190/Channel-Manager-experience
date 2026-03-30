import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const advisorId = searchParams.get('advisorId') || undefined;
  const transcripts = await db.getTranscripts({ advisorId });
  return NextResponse.json(transcripts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const transcript = await db.createTranscript(body);
  await db.logActivity({
    advisorId: transcript.advisorId || undefined,
    dealId: transcript.dealId || undefined,
    activityType: 'transcript_added',
    description: `Added transcript: ${transcript.title}`,
  });
  return NextResponse.json(transcript, { status: 201 });
}
