import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip cache headers for static assets (they have content hashes)
  const isStaticAsset = pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image') || pathname.endsWith('.ico');

  // Public routes that don't require auth
  const publicRoutes = ['/', '/login', '/signup', '/onboarding', '/api'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  let response: NextResponse;

  if (isPublicRoute) {
    response = NextResponse.next();
  } else {
    // Check for session cookie for protected routes
    const sessionCookie = request.cookies.get('cc_session');

    if (!sessionCookie) {
      response = NextResponse.redirect(new URL('/login', request.url));
    } else {
      response = NextResponse.next();
    }
  }

  // Prevent browser caching on all page/API responses (not static assets)
  if (!isStaticAsset) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
