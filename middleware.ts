import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];
const COOKIE_NAME = 'newsdesk_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Cron endpoint checks Bearer CRON_SECRET directly in the route handler
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  // 2. Allow public static assets and auth routes
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. Verify session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;

  let isValid = false;
  if (sessionCookie && secret) {
    try {
      const secretKey = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(sessionCookie, secretKey);
      if (payload.authenticated === true) {
        isValid = true;
      }
    } catch {
      isValid = false;
    }
  }

  if (!isValid) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

