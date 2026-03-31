import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      oauthUrl.searchParams.set('scope', 'crm.objects.contacts.read crm.objects.deals.read crm.objects.contacts.write crm.objects.deals.write');
      oauthUrl.searchParams.set('state', state);

      return NextResponse.json({
        url: oauthUrl.toString(),
        state,
      });
    }

    if (action === 'status') {
      // Return connection status and sync info
      const lastSync = process.env.HUBSPOT_LAST_SYNC || null;
      const syncedCount = parseInt(process.env.HUBSPOT_SYNCED_COUNT || '0');

      return NextResponse.json({
        connected: !!process.env.HUBSPOT_ACCESS_TOKEN,
        lastSync,
        syncedCount,
      });
    }

    if (action === 'field-mapping') {
      const fieldMapping = {
        name: { target: 'firstname + lastname', type: 'text' },
        title: { target: 'jobtitle', type: 'text' },
        company: { target: 'company', type: 'text' },
        email: { target: 'email', type: 'email' },
        tier: { target: 'role_in_the_channel', type: 'select' },
        type: { target: 'Trusted Advisor', type: 'constant' },
        lifecyclestage: {
          target: 'based on tier',
          type: 'derived',
          mapping: {
            Elite: 'customer',
            Premier: 'opportunity',
            Growth: 'salesqualifiedlead',
            Developing: 'lead',
          },
        },
      };
      return NextResponse.json(fieldMapping);
    }

    if (action === 'sync-log') {
      // Return mock sync logs - in production this would query a sync_logs table
      const mockLogs = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          action: 'push-advisors',
          recordCount: 156,
          status: 'success',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
          action: 'full_sync',
          recordCount: 186,
          status: 'success',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
          action: 'push-deals',
          recordCount: 0,
          status: 'success',
        },
      ];
      return NextResponse.json(mockLogs);
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

    if (action === 'push-advisors') {
      try {
        const advisors = await db.getAdvisors();
        const mapped = advisors.map((advisor: any) => {
          const tierToLifecycleStage: Record<string, string> = {
            Elite: 'customer',
            Premier: 'opportunity',
            Growth: 'salesqualifiedlead',
            Developing: 'lead',
          };

          return {
            cc_id: advisor.id,
            hubspot_mapping: {
              firstname: advisor.name.split(' ')[0] || advisor.name,
              lastname: advisor.name.split(' ').slice(1).join(' ') || '',
              jobtitle: advisor.title || '',
              company: advisor.company || '',
              email: advisor.email || '',
              type: 'Trusted Advisor',
              role_in_the_channel: advisor.tier || '',
              lifecyclestage: tierToLifecycleStage[advisor.tier] || 'lead',
            },
          };
        });

        return NextResponse.json({
          advisors: mapped,
          syncedCount: mapped.length,
        });
      } catch (error) {
        console.error('Push advisors error:', error);
        throw error;
      }
    }

    if (action === 'push-deals') {
      try {
        const deals = await db.getDeals();
        const stageMapping: Record<string, string> = {
          Discovery: 'appointmentscheduled',
          Qualifying: 'qualifiedtobuy',
          Proposal: 'presentationscheduled',
          Negotiating: 'decisionmakerboughtin',
          'Closed Won': 'closedwon',
          Stalled: 'closedlost',
        };

        const mapped = deals.map((deal: any) => {
          const advisor = deals.find((d: any) => d.id === deal.advisorId);
          return {
            cc_id: deal.id,
            hubspot_mapping: {
              dealname: deal.name,
              amount: deal.mrr ? (deal.mrr * 12).toString() : '0',
              hs_mrr: deal.mrr?.toString() || '0',
              dealstage: stageMapping[deal.stage] || 'appointmentscheduled',
              pipeline: 'default',
              description: `Supplier: ${deal.supplier || 'N/A'} | Product: ${deal.product || 'N/A'} | Probability: ${deal.probability || 0}%`,
            },
            advisor_name: advisor?.name || 'Unknown',
          };
        });

        return NextResponse.json({
          deals: mapped,
          syncedCount: mapped.length,
        });
      } catch (error) {
        console.error('Push deals error:', error);
        throw error;
      }
    }

    if (action === 'sync') {
      // Full sync orchestrator
      try {
        const advisorResponse = await fetch(
          new URL('/api/integrations/hubspot?action=push-advisors', req.url),
          { method: 'POST' }
        );
        const advisorData = await advisorResponse.json();

        const dealResponse = await fetch(
          new URL('/api/integrations/hubspot?action=push-deals', req.url),
          { method: 'POST' }
        );
        const dealData = await dealResponse.json();

        const totalSynced = (advisorData.syncedCount || 0) + (dealData.syncedCount || 0);

        // Log sync event
        console.log(`[HubSpot] Full sync completed: ${totalSynced} records synced`);

        return NextResponse.json({
          success: true,
          syncedCount: totalSynced,
          lastSync: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Sync error:', error);
        throw error;
      }
    }

    if (action === 'log-sync') {
      const body = await req.json();
      const { action: syncAction, recordCount, status, error } = body;

      // In production, this would write to a sync_logs table
      console.log(`[HubSpot Sync] ${syncAction}: ${recordCount} records, status: ${status}`);
      if (error) {
        console.error(`[HubSpot Sync Error] ${error}`);
      }

      return NextResponse.json({ success: true });
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
