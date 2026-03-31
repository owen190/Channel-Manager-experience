import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Return empty integrations for now - will be implemented with auth system
    return NextResponse.json({ integrations: [] });
  } catch (err: any) {
    console.error('[API] GET /api/integrations error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load integrations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, orgId, type, status, credentials, settings } = body;

    if (!orgId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: orgId, type' },
        { status: 400 }
      );
    }

    // For now, just return success - will be implemented with auth system
    const integration = {
      id: id || crypto.randomUUID(),
      orgId,
      type,
      status: status || 'disconnected',
      credentials: credentials || {},
      settings: settings || {},
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(integration, { status: id ? 200 : 201 });
  } catch (err: any) {
    console.error('[API] POST /api/integrations error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save integration' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // For now, just return success - will be implemented with auth system
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API] DELETE /api/integrations error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete integration' },
      { status: 500 }
    );
  }
}
