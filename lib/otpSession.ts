import crypto from 'crypto';
import Redis from 'ioredis';

const TTL_SEC = 600; // 10 minutes
const PREFIX = 'otpTok:';
let redis:Redis|null=null;
function getRedis(){ if(process.env.REDIS_URL){ if(!redis) redis = new Redis(process.env.REDIS_URL); return redis;} return null; }
interface Rec { phone:string; exp:number; used:boolean }
const mem = new Map<string,Rec>();

export async function createOtpSession(phone:string){
  const token = 'otp-ok-' + crypto.randomBytes(8).toString('hex');
  const rec:Rec = { phone, exp: Date.now() + TTL_SEC*1000, used:false };
  const r = getRedis();
  if(r){ await r.set(PREFIX+token, JSON.stringify(rec), 'EX', TTL_SEC); }
  else { mem.set(token, rec); }
  return { token, ttl_seconds: TTL_SEC };
}

export async function consumeOtpSession(token:string){
  const r = getRedis();
  const now = Date.now();
  if(r){
    const raw = await r.get(PREFIX+token);
    if(!raw) return { ok:false, reason:'missing' as const };
    const rec:Rec = JSON.parse(raw);
    if(rec.used) return { ok:false, reason:'used' as const };
    if(rec.exp < now) return { ok:false, reason:'expired' as const };
    rec.used = true; await r.set(PREFIX+token, JSON.stringify(rec), 'PX', rec.exp-now);
    return { ok:true, phone: rec.phone };
  } else {
    const rec = mem.get(token);
    if(!rec) return { ok:false, reason:'missing' as const };
    if(rec.used) return { ok:false, reason:'used' as const };
    if(rec.exp < now){ mem.delete(token); return { ok:false, reason:'expired' as const }; }
    rec.used = true; return { ok:true, phone: rec.phone };
  }
}
