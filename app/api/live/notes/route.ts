import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const advisorId = searchParams.get('advisorId') || undefined;
  const dealId = searchParams.get('dealId') || undefined;
  const notes = await db.getNotes({ advisorId, dealId });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const note = await db.createNote(body);
  await db.logActivity({
    advisorId: note.advisorId || undefined,
    dealId: note.dealId || undefined,
    activityType: 'note_added',
    description: `Added ${note.noteType}: ${note.content.substring(0, 100)}`,
  });
  return NextResponse.json(note, { status: 201 });
}
