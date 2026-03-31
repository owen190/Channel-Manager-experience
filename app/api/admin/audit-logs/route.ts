import { NextRequest, NextResponse } from 'next/server';

const mockAuditLogs = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    user: 'Jordan R.',
    action: 'user_invited',
    entity: 'User',
    details: 'Invited new_user@example.com as manager',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    user: 'Jordan R.',
    action: 'integration_connected',
    entity: 'Integration',
    details: 'Connected Salesforce integration',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    user: 'Alex K.',
    action: 'user_role_updated',
    entity: 'User',
    details: 'Updated sam@example.com role from member to manager',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
    user: 'Jordan R.',
    action: 'organization_updated',
    entity: 'Organization',
    details: 'Updated organization name to Acme Corporation',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
    user: 'Alex K.',
    action: 'integration_disconnected',
    entity: 'Integration',
    details: 'Disconnected HubSpot integration',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get('dateRange') || 'all';
    const userId = searchParams.get('userId');

    let filtered = [...mockAuditLogs];

    // Filter by date range
    if (dateRange !== 'all') {
      const now = Date.now();
      let daysAgo = 7;

      if (dateRange === '30d') daysAgo = 30;
      if (dateRange === '90d') daysAgo = 90;

      const cutoff = now - daysAgo * 24 * 3600000;
      filtered = filtered.filter((log) => new Date(log.timestamp).getTime() > cutoff);
    }

    // Filter by user
    if (userId && userId !== 'all') {
      filtered = filtered.filter((log) => log.user === userId);
    }

    // In production: const logs = await db.query('SELECT * FROM audit_log WHERE ...');

    return NextResponse.json(filtered);
  } catch (err: any) {
    console.error('[API] GET /api/admin/audit-logs error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load audit logs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action, entityType, entityId, details } = body;

    if (!action || !entityType) {
      return NextResponse.json(
        { error: 'Missing required fields: action, entityType' },
        { status: 400 }
      );
    }

    // In production: await db.query('INSERT INTO audit_log ...');

    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userId,
        action,
        entityType,
        entityId,
        details,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API] POST /api/admin/audit-logs error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to log audit event' },
      { status: 500 }
    );
  }
}
