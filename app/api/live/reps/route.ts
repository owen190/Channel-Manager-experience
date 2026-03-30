import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const reps = await db.getReps();
  return NextResponse.json(reps);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rep = await db.upsertRep(body);
  return NextResponse.json(rep, { status: body.id ? 200 : 201 });
}
