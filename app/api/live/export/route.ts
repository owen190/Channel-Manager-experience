import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const format = searchParams.get('format') || 'csv';

    let data: any[] = [];
    let filename = '';

    if (type === 'advisors' || type === 'all') {
      const advisors = await db.getAdvisors();
      if (format === 'csv') {
        const csv = advisorsToCSV(advisors);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="advisors.csv"',
          },
        });
      } else {
        data = advisors;
        filename = 'advisors.json';
      }
    }

    if (type === 'deals' || type === 'all') {
      const deals = await db.getDeals();
      if (format === 'csv') {
        const csv = dealsToCSV(deals);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="deals.csv"',
          },
        });
      } else {
        data = deals;
        filename = 'deals.json';
      }
    }

    if (type === 'all' && format === 'json') {
      const advisors = await db.getAdvisors();
      const deals = await db.getDeals();
      const notes = await db.getNotes();
      data = { advisors, deals, notes } as any;
      filename = 'export.json';
    }

    // JSON response
    const json = JSON.stringify(data, null, 2);
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('[API] GET /api/live/export error:', err);
    return NextResponse.json({ error: err.message || 'Failed to export data' }, { status: 500 });
  }
}

/**
 * Convert advisors to CSV with proper escaping and BOM for Excel
 */
function advisorsToCSV(advisors: any[]): string {
  const BOM = '\uFEFF';
  const headers = [
    'id',
    'name',
    'title',
    'company',
    'mrr',
    'tier',
    'pulse',
    'trajectory',
    'tone',
    'intent',
    'friction',
    'dealHealth',
    'location',
    'commPreference',
    'personalIntel',
    'diagnosis',
  ];

  const rows = advisors.map((a) =>
    headers.map((h) => {
      const value = a[h] || '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
  );

  return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Convert deals to CSV with proper escaping and BOM for Excel
 */
function dealsToCSV(deals: any[]): string {
  const BOM = '\uFEFF';
  const headers = [
    'id',
    'name',
    'advisorId',
    'stage',
    'mrr',
    'health',
    'probability',
    'daysInStage',
    'closeDate',
    'competitor',
  ];

  const rows = deals.map((d) =>
    headers.map((h) => {
      const value = d[h] || '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
  );

  return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
