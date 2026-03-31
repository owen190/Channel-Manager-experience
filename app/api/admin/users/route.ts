import { NextRequest, NextResponse } from 'next/server';

// Mock data - in production, would query from database
const mockUsers = [
  {
    id: '1',
    name: 'Jordan R.',
    email: 'jordan@example.com',
    role: 'admin',
    status: 'active',
    lastActive: '2 minutes ago',
  },
  {
    id: '2',
    name: 'Alex K.',
    email: 'alex@example.com',
    role: 'manager',
    status: 'active',
    lastActive: '1 hour ago',
  },
  {
    id: '3',
    name: 'Sam J.',
    email: 'sam@example.com',
    role: 'member',
    status: 'inactive',
    lastActive: '3 days ago',
  },
];

export async function GET() {
  try {
    // In production: const users = await db.query('SELECT * FROM users ORDER BY name');
    return NextResponse.json(mockUsers);
  } catch (err: any) {
    console.error('[API] GET /api/admin/users error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, role, status } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // In production: await db.query(...)
    const user = {
      id: id || crypto.randomUUID(),
      name,
      email,
      role: role || 'member',
      status: status || 'active',
      lastActive: new Date().toISOString(),
    };

    return NextResponse.json(user, { status: id ? 200 : 201 });
  } catch (err: any) {
    console.error('[API] POST /api/admin/users error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save user' },
      { status: 500 }
    );
  }
}
