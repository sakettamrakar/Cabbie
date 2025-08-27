import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getCsrfToken, validateCsrf } from './csrf';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev_admin_secret_change_me';

export interface AdminContext { userId:number; email:string; }

export function verifyJwtFromRequest(req:NextApiRequest): AdminContext | null {
  const raw = req.cookies['admin_session'];
  if(!raw) return null;
  try {
    const decoded:any = jwt.verify(raw, JWT_SECRET);
    return { userId: decoded.sub, email: decoded.email };
  } catch { return null; }
}

export function requireAdminAuth(req:NextApiRequest,res:NextApiResponse): AdminContext | null {
  const ctx = verifyJwtFromRequest(req);
  if(!ctx){ res.status(401).json({ ok:false, error:'unauthorized' }); return null; }
  return ctx;
}

export function requireCsrf(req:NextApiRequest,res:NextApiResponse): boolean {
  if(['GET','HEAD','OPTIONS'].includes(req.method||'')) return true;
  const token = req.headers['x-csrf-token'] || (req.body && req.body._csrf);
  if(!token || Array.isArray(token)){ res.status(403).json({ ok:false, error:'missing_csrf' }); return false; }
  const cookieToken = req.cookies['csrf_token'];
  if(!cookieToken){ res.status(403).json({ ok:false, error:'missing_csrf_cookie' }); return false; }
  if(!validateCsrf(String(token), cookieToken)){ res.status(403).json({ ok:false, error:'invalid_csrf' }); return false; }
  return true;
}

export function issueCsrf(res:NextApiResponse){
  const { cookieValue, token } = getCsrfToken();
  // 2h expiry
  res.setHeader('Set-Cookie', `csrf_token=${cookieValue}; Path=/; Max-Age=${60*120}; SameSite=Lax`);
  return token;
}
