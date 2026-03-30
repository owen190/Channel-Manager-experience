import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const advisors = await db.getAdvisors();
  return NextResponse.json(advisors);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const advisor = await db.upsertAdvisor(body);
  await db.logActivity({
    advisorId: advisor.id,
    activityType: body.id ? 'advisor_updated' : 'advisor_created',
    description: `${body.id ? 'Updated' : 'Created'} advisor: ${advisor.name}`,
  });
  return NextResponse.json(advisor, { status: body.id ? 200 : 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const deleted = await db.deleteAdvisor(id);
  return deleted
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
