import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface TimelineItem {
  id: string;
  type: 'note' | 'transcript' | 'signal' | 'deal_update' | 'activity';
  timestamp: string;
  title: string;
  description: string;
  source: string;
  icon: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const advisorId = searchParams.get('advisorId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!advisorId) {
      return NextResponse.json({ error: 'Missing advisorId' }, { status: 400 });
    }

    const items: TimelineItem[] = [];

    // Fetch notes
    const notes = await db.getNotes({ advisorId });
    notes.forEach((note) => {
      items.push({
        id: note.id,
        type: 'note',
        timestamp: note.createdAt || new Date().toISOString(),
        title: note.noteType || 'Note',
        description: note.content.substring(0, 150),
        source: note.source || 'Manual',
        icon: 'MessageCircle',
      });
    });

    // Fetch transcripts
    const transcripts = await db.getTranscripts({ advisorId });
    transcripts.forEach((transcript) => {
      items.push({
        id: transcript.id,
        type: 'transcript',
        timestamp: transcript.createdAt || new Date().toISOString(),
        title: transcript.title,
        description: transcript.summary || transcript.content.substring(0, 150),
        source: transcript.source || 'Call Recording',
        icon: 'Mic',
      });
    });

    // Fetch signals
    const signals = await db.getSignals({ advisorId });
    signals.forEach((signal) => {
      items.push({
        id: signal.id,
        type: 'signal',
        timestamp: signal.occurredAt,
        title: signal.signalType.replace(/_/g, ' '),
        description: `${signal.product || 'Product activity'}${signal.value ? ` - $${(signal.value / 1000).toFixed(1)}K` : ''}`,
        source: signal.source || 'Engagement Signal',
        icon: 'Zap',
      });
    });

    // Fetch deals and extract deal updates from activity
    const deals = await db.getDeals();
    const advisorDeals = deals.filter(d => d.advisorId === advisorId);
    advisorDeals.forEach((deal) => {
      items.push({
        id: deal.id,
        type: 'deal_update',
        timestamp: deal.updatedAt || new Date().toISOString(),
        title: deal.name,
        description: `Stage: ${deal.stage} | Health: ${deal.health}`,
        source: 'Deal Update',
        icon: 'DollarSign',
      });
    });

    // Fetch activity log
    const activities = await db.getActivity({ advisorId, limit: 100 });
    activities.forEach((activity) => {
      items.push({
        id: activity.id,
        type: 'activity',
        timestamp: activity.createdAt || new Date().toISOString(),
        title: activity.activityType.replace(/_/g, ' '),
        description: activity.description,
        source: 'Activity',
        icon: 'Activity',
      });
    });

    // Sort by timestamp descending (newest first)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedItems = items.slice(offset, offset + limit);

    return NextResponse.json({
      items: paginatedItems,
      total: items.length,
      offset,
      limit,
    });
  } catch (err: any) {
    console.error('[API] GET /api/live/timeline error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load timeline' }, { status: 500 });
  }
}
