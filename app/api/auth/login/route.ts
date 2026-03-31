import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Demo: Accept any email with password "demo123"
    if (password !== 'demo123') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create a user session
    const user = {
      id: email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      role: 'channel_manager',
      org_id: 'org_' + Math.random().toString(36).substr(2, 9),
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
