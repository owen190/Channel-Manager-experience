import { NextRequest, NextResponse } from 'next/server';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || 'placeholder_client_id';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || 'placeholder_secret';
const SLACK_REDIRECT_URI =
  process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/integrations/slack/callback';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'oauth-url') {
      const state = crypto.randomUUID();
      const oauthUrl = new URL('https://slack.com/oauth_authorize');
      oauthUrl.searchParams.set('client_id', SLACK_CLIENT_ID);
      oauthUrl.searchParams.set('scope', 'incoming-webhook chat:write');
      oauthUrl.searchParams.set('redirect_uri', SLACK_REDIRECT_URI);
      oauthUrl.searchParams.set('state', state);

      return NextResponse.json({
        url: oauthUrl.toString(),
        state,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] GET /api/integrations/slack error:', err);
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
      const { code } = body;

      if (!code) {
        return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
      }

      const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          redirect_uri: SLACK_REDIRECT_URI,
          code,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const data = await tokenResponse.json();

      if (!data.ok) {
        throw new Error(data.error || 'OAuth failed');
      }

      return NextResponse.json({
        success: true,
        credentials: {
          accessToken: data.access_token,
          botUserId: data.bot_user_id,
          webhookUrl: data.incoming_webhook?.channel_id
            ? `${data.incoming_webhook.channel_id}`
            : undefined,
          teamId: data.team?.id,
        },
      });
    }

    if (action === 'notify') {
      const body = await req.json();
      const { webhookUrl, message } = body;

      if (!webhookUrl || !message) {
        return NextResponse.json(
          { error: 'Missing required fields: webhookUrl, message' },
          { status: 400 }
        );
      }

      return await sendSlackNotification(webhookUrl, message);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] POST /api/integrations/slack error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function sendSlackNotification(webhookUrl: string, message: any) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to send Slack notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent to Slack',
    });
  } catch (error) {
    console.error('Slack notification error:', error);
    throw error;
  }
}
