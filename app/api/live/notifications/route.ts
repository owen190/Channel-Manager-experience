import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const readOnly = searchParams.get('readOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const notifications = await db.getNotifications({
      userId,
      read: readOnly ? true : undefined,
      limit,
    });

    const unreadCount = (await db.getNotifications({ userId, read: false })).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: any) {
    console.error('[API] GET /api/live/notifications error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const notification = await db.createNotification(body);
    return NextResponse.json(notification, { status: 201 });
  } catch (err: any) {
    console.error('[API] POST /api/live/notifications error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || '';
    let success = false;

    if (body.all === true) {
      // Mark all as read for user
      success = await db.markAllNotificationsAsRead(userId);
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      // Mark specific notifications as read
      success = await db.markNotificationsAsRead(body.ids);
    }

    return NextResponse.json({ success });
  } catch (err: any) {
    console.error('[API] PATCH /api/live/notifications error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update notifications' }, { status: 500 });
  }
}
