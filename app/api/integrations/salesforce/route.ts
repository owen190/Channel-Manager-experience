import { NextRequest, NextResponse } from 'next/server';

const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID || 'placeholder_client_id';
const SALESFORCE_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET || 'placeholder_secret';
const SALESFORCE_REDIRECT_URI =
  process.env.SALESFORCE_REDIRECT_URI || 'http://localhost:3000/api/integrations/salesforce/callback';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'oauth-url') {
      const state = crypto.randomUUID();
      const oauthUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
      oauthUrl.searchParams.set('client_id', SALESFORCE_CLIENT_ID);
      oauthUrl.searchParams.set('redirect_uri', SALESFORCE_REDIRECT_URI);
      oauthUrl.searchParams.set('response_type', 'code');
      oauthUrl.searchParams.set('state', state);
      oauthUrl.searchParams.set('scope', 'api refresh_token');

      return NextResponse.json({
        url: oauthUrl.toString(),
        state,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] GET /api/integrations/salesforce error:', err);
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
      const tokenResponse = await fetch('https://login.salesforce.com/services/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: SALESFORCE_CLIENT_ID,
          client_secret: SALESFORCE_CLIENT_SECRET,
          redirect_uri: SALESFORCE_REDIRECT_URI,
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
          instanceUrl: tokens.instance_url,
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

      // Scaffold sync function - would fetch contacts and opportunities
      const syncResult = await syncAdvisorsFromSalesforce(credentials);

      return NextResponse.json({
        success: true,
        syncedCount: syncResult.count,
        lastSync: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] POST /api/integrations/salesforce error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function syncAdvisorsFromSalesforce(credentials: any) {
  try {
    // Placeholder: In production, this would fetch from Salesforce
    // and map contacts to advisors
    const contactsResponse = await fetch(
      `${credentials.instanceUrl}/services/data/v57.0/sobjects/Contact`,
      {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      }
    );

    if (!contactsResponse.ok) {
      throw new Error('Failed to fetch contacts from Salesforce');
    }

    // This is where we would map Salesforce contacts to advisors
    return {
      count: 0,
      message: 'Sync scaffolded - implementation pending',
    };
  } catch (error) {
    console.error('Salesforce sync error:', error);
    throw error;
  }
}
