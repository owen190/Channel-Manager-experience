import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SearchResult {
  id: string;
  type: 'advisor' | 'deal' | 'note' | 'transcript' | 'signal';
  title: string;
  subtitle: string;
  description: string;
}

interface SearchResponse {
  advisors: SearchResult[];
  deals: SearchResult[];
  notes: SearchResult[];
  transcripts: SearchResult[];
  signals: SearchResult[];
  total: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({
        advisors: [],
        deals: [],
        notes: [],
        transcripts: [],
        signals: [],
        total: 0,
      } as SearchResponse);
    }

    const searchTerm = `%${query}%`;
    const limit = 10;
    const results: SearchResponse = {
      advisors: [],
      deals: [],
      notes: [],
      transcripts: [],
      signals: [],
      total: 0,
    };

    // Search advisors
    const advisors = await db.getAdvisors();
    const advisorResults = advisors
      .filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          (a.company?.toLowerCase().includes(query.toLowerCase())) ||
          (a.location?.toLowerCase().includes(query.toLowerCase())) ||
          (a.personalIntel?.toLowerCase().includes(query.toLowerCase())) ||
          (a.diagnosis?.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        type: 'advisor' as const,
        title: a.name,
        subtitle: `${a.title} at ${a.company}`,
        description: a.personalIntel || a.diagnosis || 'No description',
      }));
    results.advisors = advisorResults;
    results.total += advisorResults.length;

    // Search deals
    const deals = await db.getDeals();
    const dealResults = deals
      .filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          (d.competitor?.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, limit)
      .map((d) => ({
        id: d.id,
        type: 'deal' as const,
        title: d.name,
        subtitle: `${d.stage} | MRR: $${(d.mrr / 1000).toFixed(1)}K`,
        description: `Health: ${d.health}`,
      }));
    results.deals = dealResults;
    results.total += dealResults.length;

    // Search notes
    const notes = await db.getNotes();
    const noteResults = notes
      .filter((n) => n.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit)
      .map((n) => ({
        id: n.id,
        type: 'note' as const,
        title: n.noteType || 'Note',
        subtitle: n.author || 'Unknown',
        description: n.content.substring(0, 100),
      }));
    results.notes = noteResults;
    results.total += noteResults.length;

    // Search transcripts
    const transcripts = await db.getTranscripts();
    const transcriptResults = transcripts
      .filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.content?.toLowerCase().includes(query.toLowerCase()) ||
          t.summary?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
      .map((t) => ({
        id: t.id,
        type: 'transcript' as const,
        title: t.title,
        subtitle: t.source || 'Recording',
        description: t.summary || t.content.substring(0, 100),
      }));
    results.transcripts = transcriptResults;
    results.total += transcriptResults.length;

    // Search signals
    const signals = await db.getSignals();
    const signalResults = signals
      .filter(
        (s) =>
          s.product?.toLowerCase().includes(query.toLowerCase()) ||
          s.notes?.toLowerCase().includes(query.toLowerCase()) ||
          s.signalType?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
      .map((s) => ({
        id: s.id,
        type: 'signal' as const,
        title: s.signalType.replace(/_/g, ' '),
        subtitle: s.product || 'Engagement Signal',
        description: s.notes || `Value: $${(s.value || 0) / 1000}K`,
      }));
    results.signals = signalResults;
    results.total += signalResults.length;

    return NextResponse.json(results);
  } catch (err: any) {
    console.error('[API] GET /api/live/search error:', err);
    return NextResponse.json({ error: err.message || 'Failed to search' }, { status: 500 });
  }
}
