import type { NextApiRequest, NextApiResponse } from 'next';

type AdminAccessState = 'granted' | 'missing-key' | 'forbidden';

type QueryValue = string | string[] | undefined;

function normalizeKeyValue(value: QueryValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function getKeyFromHeaders(headers?: NextApiRequest['headers']): string | undefined {
  if (!headers) return undefined;
  const headerValue = headers['x-admin-key'];
  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }
  if (typeof headerValue === 'string') {
    const trimmed = headerValue.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export function getAdminKeyFromQuery(query: Record<string, QueryValue>): string | undefined {
  return normalizeKeyValue(query.key);
}

export function extractAdminKey(source: { query?: Record<string, QueryValue>; headers?: NextApiRequest['headers'] }): string | undefined {
  const queryKey = source.query ? getAdminKeyFromQuery(source.query) : undefined;
  if (queryKey) return queryKey;
  return getKeyFromHeaders(source.headers);
}

export function evaluateAdminAccess(providedKey?: string | null): AdminAccessState {
  const configuredKey = process.env.ADMIN_KEY;
  if (configuredKey && configuredKey.length > 0) {
    if (providedKey === configuredKey) {
      return 'granted';
    }
    return 'missing-key';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'forbidden';
  }
  return 'granted';
}

export function ensureAdminRequest(req: NextApiRequest, res: NextApiResponse): boolean {
  const providedKey = extractAdminKey({ query: req.query as Record<string, QueryValue>, headers: req.headers });
  const state = evaluateAdminAccess(providedKey);
  if (state === 'granted') {
    return true;
  }
  if (state === 'missing-key') {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return false;
  }
  res.status(403).json({ ok: false, error: 'admin_key_required' });
  return false;
}

export function adminAccessStateDetails(state: AdminAccessState): { requiresKey: boolean; forbidden: boolean } {
  return {
    requiresKey: state === 'missing-key',
    forbidden: state === 'forbidden',
  };
}

export type { AdminAccessState };
