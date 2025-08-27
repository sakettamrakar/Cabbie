// New OTP module (hashed code) separate to avoid breaking existing until migration
import crypto from 'crypto';
import Redis from 'ioredis';

interface Rec { hash:string; exp:number }
const mem = new Map<string,Rec>();
let redis:Redis|null=null;
function getRedis(){ if(process.env.REDIS_URL){ if(!redis) redis=new Redis(process.env.REDIS_URL); return redis;} return null; }
const TTL_MS = 300_000;
const PREFIX='otp2:';
function gen(){ return Math.floor(1000+Math.random()*9000).toString(); }
function h(code:string){ return crypto.createHash('sha256').update(code).digest('hex'); }

export async function issueOTP(phone:string){
  const code = gen();
  const rec:Rec = { hash: h(code), exp: Date.now()+TTL_MS };
  const r = getRedis();
  if(r){ await r.set(PREFIX+phone, JSON.stringify(rec), 'PX', TTL_MS); } else { mem.set(phone, rec); }
  const dev = process.env.NODE_ENV !== 'production';
  if(dev) return { phone, otp: code, expires_in: TTL_MS/1000 };
  return { phone, expires_in: TTL_MS/1000 };
}

export async function verifyOTP(phone:string, code:string){
  const now = Date.now();
  const r = getRedis();
  if(r){ const raw = await r.get(PREFIX+phone); if(!raw) return false; try { const rec:Rec = JSON.parse(raw); if(rec.exp < now) return false; if(h(code)===rec.hash){ await r.del(PREFIX+phone); return true;} return false; } catch { return false; } }
  const rec = mem.get(phone); if(!rec) return false; if(rec.exp < now){ mem.delete(phone); return false; } if(h(code)===rec.hash){ mem.delete(phone); return true;} return false;
}
