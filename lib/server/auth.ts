import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { env } from './env';
import { getDb } from './db';

const COOKIE_NAME = 'newsdesk_session';
const SECRET_KEY = new TextEncoder().encode(env.SESSION_SECRET);

export interface SessionPayload {
  authenticated: boolean;
  issuedAt: number;
}

export function verifyPassword(submitted: string): boolean {
  if (!submitted || !env.APP_PASSWORD) return false;
  const submittedBuffer = Buffer.from(submitted);
  const targetBuffer = Buffer.from(env.APP_PASSWORD);

  if (submittedBuffer.length !== targetBuffer.length) {
    // Constant time comparison padding
    crypto.timingSafeEqual(submittedBuffer, submittedBuffer);
    return false;
  }
  return crypto.timingSafeEqual(submittedBuffer, targetBuffer);
}

export async function createSessionToken(): Promise<string> {
  const token = await new SignJWT({ authenticated: true, issuedAt: Date.now() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
  return token;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const db = getDb();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data, error } = await db
      .from('login_attempts')
      .select('attempted_at')
      .eq('ip', ip)
      .gte('attempted_at', tenMinutesAgo);

    if (error) {
      // If table doesn't exist yet or connection fails, allow locally
      return { allowed: true, remaining: 5 };
    }

    const attempts = data?.length || 0;
    if (attempts >= 5) {
      return { allowed: false, remaining: 0 };
    }

    // Record this attempt
    await db.from('login_attempts').insert({ ip });

    return { allowed: true, remaining: Math.max(0, 5 - (attempts + 1)) };
  } catch {
    return { allowed: true, remaining: 5 };
  }
}

export { COOKIE_NAME };

