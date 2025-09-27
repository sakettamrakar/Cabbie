import type { NextApiRequest, NextApiResponse } from 'next';
import type { IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE = 'mb_session';
const DEFAULT_SECRET = 'dev_mb_session_secret_change_me';
const SESSION_SECRET = process.env.MB_SESSION_SECRET || DEFAULT_SECRET;
const ttlHoursRaw = Number(process.env.MB_SESSION_TTL_HOURS || '24');
const SESSION_TTL_SECONDS = Number.isFinite(ttlHoursRaw) && ttlHoursRaw > 0 ? Math.floor(ttlHoursRaw * 3600) : 24 * 3600;

interface CookieCapableRequest extends IncomingMessage {
  cookies?: Partial<Record<string, string>>;
}

export interface ManageSession {
  phone: string;
  issuedAt: number;
  expiresAt: number;
}

function appendSetCookie(res: NextApiResponse | ServerResponse, value: string) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', value);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, value]);
    return;
  }
  res.setHeader('Set-Cookie', [existing as string, value]);
}

function buildCookie(value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const expires = maxAgeSeconds <= 0 ? '; Expires=Thu, 01 Jan 1970 00:00:00 GMT' : '';
  const normalizedMaxAge = maxAgeSeconds <= 0 ? 0 : maxAgeSeconds;
  return `${SESSION_COOKIE}=${value}; HttpOnly; Path=/; Max-Age=${normalizedMaxAge}; SameSite=Lax${secure}${expires}`;
}

function readCookie(req: CookieCapableRequest, name: string) {
  if (req.cookies && typeof req.cookies[name] === 'string') {
    return req.cookies[name] as string;
  }
  const header = req.headers?.cookie;
  if (!header) return null;
  const match = header
    .split(';')
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith(`${name}=`));
  if (!match) return null;
  return match.slice(name.length + 1);
}

export function issueManageSession(res: NextApiResponse | ServerResponse, phone: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + SESSION_TTL_SECONDS;
  const token = jwt.sign({ phone, iat: issuedAt, exp: expiresAt }, SESSION_SECRET, { algorithm: 'HS256' });
  appendSetCookie(res, buildCookie(token, SESSION_TTL_SECONDS));
  return { token, expiresAt };
}

export function readManageSession(req: NextApiRequest | CookieCapableRequest): ManageSession | null {
  const raw = readCookie(req as CookieCapableRequest, SESSION_COOKIE);
  if (!raw) return null;
  try {
    const decoded = jwt.verify(raw, SESSION_SECRET) as { phone?: string; iat?: number; exp?: number };
    if (!decoded.phone || !decoded.exp || !decoded.iat) return null;
    if (decoded.exp * 1000 < Date.now()) return null;
    return { phone: decoded.phone, issuedAt: decoded.iat, expiresAt: decoded.exp };
  } catch {
    return null;
  }
}

export function clearManageSession(res: NextApiResponse | ServerResponse) {
  appendSetCookie(res, buildCookie('', 0));
}
