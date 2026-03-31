import { NextRequest, NextResponse } from 'next/server';

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID || 'placeholder_client_id';
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET || 'placeholder_secret';
const HUBSPOT_REDIRECT_URI =
  process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/api/integrations/hubspot/callback';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'oauth-url') {
      const state = crypto.randomUUID();
      const oauthUrl = new URL('https://app.hubspot.com/oauth/authorize');
      oauthUrl.searchParams.set('client_id', HUBSPOT_CLIENT_ID);
      oauthUrl.searchParams.set('redirect_uri', HUBSPOT_REDIRECT_URI);
      oauthUrl.searchParams.set('scope', 'crm.objects.contacts.read crm.objects.deals.read');
      oauthUrl.searchParams.set('state', state);

      return NextResponse.json({
        url: oauthUrl.toString(),
        state,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] GET /api/integrations/hubspot error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'callback') {
      const body = await req.json();
      const { code, orgId } = body;

      if (!code) {
        return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: HUBSPOT_CLIENT_ID,
          client_secret: HUBSPOT_CLIENT_SECRET,
          redirect_uri: HUBSPOT_REDIRECT_URI,
          code,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();

      return NextResponse.json({
        success: true,
        credentials: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
        },
      });
    }

    if (action === 'sync') {
      const body = await req.json();
      const { orgId, credentials } = body;

      if (!credentials?.accessToken) {
        return NextResponse.json(
          { error: 'Not connected - missing access token' },
          { status: 401 }
        );
      }

      const syncResult = await syncAdvisorsFromHubspot(credentials);

      return NextResponse.json({
        success: true,
        syncedCount: syncResult.count,
        lastSync: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] POST /api/integrations/hubspot error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function syncAdvisorsFromHubspot(credentials: any) {
  try {
    // Placeholder: In production, this would fetch from HubSpot
    const contactsResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts?limit=100',
      {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      }
    );

    if (!contactsResponse.ok) {
      throw new Error('Failed to fetch contacts from HubSpot');
    }

    return {
      count: 0,
      message: 'Sync scaffolded - implementation pending',
    };
  } catch (error) {
    console.error('HubSpot sync error:', error);
    throw error;
  }
}
