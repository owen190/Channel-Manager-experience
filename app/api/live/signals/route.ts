import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const advisorId = searchParams.get('advisorId') || undefined;
    const signalType = searchParams.get('signalType') as any || undefined;
    const since = searchParams.get('since') || undefined;
    const signals = await db.getSignals({ advisorId, signalType, since });
    return NextResponse.json(signals);
  } catch (err: any) {
    console.error('[API] GET /api/live/signals error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load signals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Bulk import: array of signals
    if (Array.isArray(body)) {
      const count = await db.bulkCreateSignals(body);
      await db.logActivity({
        activityType: 'signals_bulk_imported',
        description: `Bulk imported ${count} engagement signals`,
      });
      return NextResponse.json({ imported: count }, { status: 201 });
    }

    // Single signal
    const signal = await db.createSignal(body);
    await db.logActivity({
      advisorId: signal.advisorId,
      activityType: 'signal_logged',
      description: `Logged ${signal.signalType}${signal.product ? ' for ' + signal.product : ''}${signal.value ? ' ($' + (signal.value/1000).toFixed(1) + 'K)' : ''}`,
    });
    return NextResponse.json(signal, { status: 201 });
  } catch (err: any) {
    console.error('[API] POST /api/live/signals error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save signal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const deleted = await db.deleteSignal(id);
    return deleted
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (err: any) {
    console.error('[API] DELETE /api/live/signals error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete signal' }, { status: 500 });
  }
}
