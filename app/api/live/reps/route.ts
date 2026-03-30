import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const reps = await db.getReps();
    return NextResponse.json(reps);
  } catch (err: any) {
    console.error('[API] GET /api/live/reps error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load reps' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rep = await db.upsertRep(body);
    return NextResponse.json(rep, { status: body.id ? 200 : 201 });
  } catch (err: any) {
    console.error('[API] POST /api/live/reps error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save rep' }, { status: 500 });
  }
}
