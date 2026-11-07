import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyPassword, createSessionToken, checkRateLimit, COOKIE_NAME } from '@/lib/server/auth';
import { env } from '@/lib/server/env';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // 1. Check rate limit
    const { allowed, remaining } = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 10 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    if (!env.APP_PASSWORD) {
      return NextResponse.json(
        { error: 'APP_PASSWORD is not configured in Vercel / environment variables.' },
        { status: 500 }
      );
    }

    // 2. Verify password with constant-time comparison
    const isValid = verifyPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: `Invalid password. ${remaining} attempts remaining.` },
        { status: 401 }
      );
    }

    // 3. Create signed JWT token
    const token = await createSessionToken();

    // 4. Set httpOnly cookie (30-day)
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

