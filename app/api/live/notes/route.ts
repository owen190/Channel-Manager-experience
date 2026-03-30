import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const advisorId = searchParams.get('advisorId') || undefined;
    const dealId = searchParams.get('dealId') || undefined;
    const notes = await db.getNotes({ advisorId, dealId });
    return NextResponse.json(notes);
  } catch (err: any) {
    console.error('[API] GET /api/live/notes error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const note = await db.createNote(body);
    await db.logActivity({
      advisorId: note.advisorId || undefined,
      dealId: note.dealId || undefined,
      activityType: 'note_added',
      description: `Added ${note.noteType}: ${note.content.substring(0, 100)}`,
    });
    return NextResponse.json(note, { status: 201 });
  } catch (err: any) {
    console.error('[API] POST /api/live/notes error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save note' }, { status: 500 });
  }
}
