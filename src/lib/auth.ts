import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { sql } from './db';
import { SESSION_SECRET as SECRET, IS_PROD } from './env';


const COOKIE = 'aparajita_session';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const a = Buffer.from(key, 'hex');
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Cookie value is `email.expiry.signature` — no session table needed.
function sign(value: string) {
  return createHmac('sha256', SECRET).update(value).digest('hex');
}

export function createSession(cookies: AstroCookies, email: string) {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = `${email}.${expires}`;
  cookies.set(COOKIE, `${payload}.${sign(payload)}`, {
    path: '/',
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: MAX_AGE,
  });
}

export function destroySession(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export function getSessionEmail(cookies: AstroCookies): string | null {
  const raw = cookies.get(COOKIE)?.value;
  if (!raw || !SECRET) return null;
  const idx = raw.lastIndexOf('.');
  const payload = raw.slice(0, idx);
  const signature = raw.slice(idx + 1);
  if (sign(payload) !== signature) return null;
  const [email, expires] = payload.split('.');
  if (!email || Number(expires) < Date.now()) return null;
  return email;
}

export async function findUser(email: string) {
  const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
  return rows[0] as { email: string; password_hash: string; name: string } | undefined;
}

/** Returns a redirect Response when the request is not signed in. */
export function requireLogin(cookies: AstroCookies, redirect: (path: string) => Response) {
  return getSessionEmail(cookies) ? null : redirect('/admin/login');
}
