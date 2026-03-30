import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const advisorId = searchParams.get('advisorId') || undefined;
    const intents = await db.computeRevenueIntent(advisorId);
    return NextResponse.json(intents);
  } catch (err: any) {
    console.error('[API] GET /api/live/intent error:', err);
    return NextResponse.json({ error: err.message || 'Failed to compute intent' }, { status: 500 });
  }
}
