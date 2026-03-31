import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'channel_manager' | 'sales_leader' | 'admin';
  org_id?: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('cc_session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);
    return sessionData as AuthUser;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(requiredRole: string[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!requiredRole.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

export function createSessionCookie(user: AuthUser): string {
  return JSON.stringify(user);
}
