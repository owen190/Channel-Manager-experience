import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ImportRow {
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  tier?: string;
  mrr?: string;
  commPreference?: string;
  personalIntel?: string;
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found' }, { status: 400 });
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Validate required fields
        if (!row.name) {
          errors.push(`Row ${i + 2}: Missing required field 'name'`);
          continue;
        }

        // Validate MRR is a number
        let mrr = 0;
        if (row.mrr) {
          const parsed = parseInt(row.mrr.replace(/[^0-9]/g, ''), 10);
          if (isNaN(parsed)) {
            errors.push(`Row ${i + 2}: Invalid MRR value '${row.mrr}'`);
            continue;
          }
          mrr = parsed;
        }

        // Upsert advisor
        await db.upsertAdvisor({
          name: row.name.trim(),
          title: row.title?.trim() || '',
          company: row.company?.trim() || '',
          location: row.location?.trim() || undefined,
          tier: (row.tier?.toLowerCase() || 'silver') as any,
          mrr,
          commPreference: row.commPreference?.trim() || undefined,
          personalIntel: row.personalIntel?.trim() || undefined,
          pulse: 'Steady',
          trajectory: 'Stable',
          tone: 'Neutral',
          intent: 'Moderate',
          friction: 'Low',
          dealHealth: 'Healthy',
        });

        imported++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message || 'Unknown error'}`);
      }
    }

    // Log activity
    await db.logActivity({
      activityType: 'advisors_bulk_imported',
      description: `Bulk imported ${imported} advisors from CSV`,
      metadata: { totalRows: rows.length, errorCount: errors.length },
    });

    return NextResponse.json({
      imported,
      errors,
      total: rows.length,
    });
  } catch (err: any) {
    console.error('[API] POST /api/live/import error:', err);
    return NextResponse.json({ error: err.message || 'Failed to import data' }, { status: 500 });
  }
}

/**
 * Simple CSV parser that handles quoted fields and newlines
 */
function parseCSV(text: string): ImportRow[] {
  // Remove BOM if present
  const content = text.replace(/^\uFEFF/, '');
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: ImportRow[] = [];

  let currentLine = '';
  for (let i = 1; i < lines.length; i++) {
    currentLine += lines[i];

    // Count quotes to detect if line is complete
    const quoteCount = (currentLine.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      currentLine += '\n';
      continue; // Multi-line quoted field
    }

    const values = parseCSVLine(currentLine);
    const row: ImportRow = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    rows.push(row);
    currentLine = '';
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
