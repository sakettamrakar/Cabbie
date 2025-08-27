import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { issueCsrf } from '../../../lib/adminAuth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev_admin_secret_change_me';
const SESSION_TTL_SECONDS = 60 * 30; // 30 minutes
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
type AttemptInfo = { count:number; expires:number };
const attempts = new Map<string,AttemptInfo>();

function rateLimit(ip:string){
  const now = Date.now();
  const rec = attempts.get(ip);
  if(!rec || rec.expires < now){
    attempts.set(ip,{ count:1, expires: now + WINDOW_MS });
    return { allowed:true };
  }
  rec.count++;
  if(rec.count > MAX_ATTEMPTS){
    return { allowed:false, retryAfter: Math.ceil((rec.expires-now)/1000) };
  }
  return { allowed:true };
}

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const rl = rateLimit(ip);
  if(!rl.allowed) return res.status(429).json({ ok:false, error:'Too many attempts. Try later.', retryAfter: rl.retryAfter });
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ ok:false, error:'Missing credentials' });
  const user = await (prisma as any).user.findUnique({ where:{ email }}).catch(()=>null);
  if(!user) return res.status(401).json({ ok:false, error:'Invalid email or password' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if(!valid) return res.status(401).json({ ok:false, error:'Invalid email or password' });
  const token = jwt.sign({ sub:user.id, email:user.email, exp: Math.floor(Date.now()/1000)+SESSION_TTL_SECONDS }, JWT_SECRET, { algorithm:'HS256' });
  const cookies: string[] = [];
  cookies.push(`admin_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax`);
  const csrf = issueCsrf(res); // sets csrf cookie
  // ensure existing Set-Cookie header preserved
  const existing = res.getHeader('Set-Cookie');
  if(existing){
    if(Array.isArray(existing)) cookies.push(...existing.map(String)); else cookies.push(String(existing));
  }
  res.setHeader('Set-Cookie', cookies);
  return res.json({ ok:true, csrfToken: csrf });
}
