import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, companyName } = body;

    if (!email || !password || !name || !companyName) {
      return NextResponse.json(
        { error: 'All fields required' },
        { status: 400 }
      );
    }

    // In production, this would create actual DB records
    // For now, we'll just create a session like login
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const orgId = 'org_' + Math.random().toString(36).substr(2, 9);

    const user = {
      id: userId,
      email,
      name,
      role: 'channel_manager',
      org_id: orgId,
    };

    const cookieStore = await cookies();
    cookieStore.set('cc_session', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({ user, success: true });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
