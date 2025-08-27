import Redis from 'ioredis';

// In-memory fallback store structure
interface OtpRecord { code:string; expiresAt:number }
const memoryStore: Map<string, OtpRecord> = new Map();

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if(process.env.REDIS_URL){
    if(!redis){ redis = new Redis(process.env.REDIS_URL as string, { lazyConnect:true }); }
    return redis;
  }
  return null;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const PREFIX = 'otp:';

function genCode(): string { return Math.floor(1000 + Math.random()*9000).toString(); }

export async function issueOTP(phone: string): Promise<{ phone:string; otp?:string }>{
  const code = genCode();
  const expiresAt = Date.now() + TTL_MS;
  const r = getRedis();
  if(r){
    await r.set(PREFIX+phone, JSON.stringify({ code, expiresAt }), 'PX', TTL_MS);
  } else {
    memoryStore.set(phone, { code, expiresAt });
  }
  const isDev = process.env.NODE_ENV !== 'production';
  if(isDev){
    console.log(`[OTP][DEV] ${phone} -> ${code}`);
    return { phone, otp: code };
  } else {
    console.log(`[OTP] issued for ${phone}`);
    return { phone };
  }
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean>{
  const now = Date.now();
  const r = getRedis();
  if(r){
    const raw = await r.get(PREFIX+phone);
    if(!raw) return false;
    try {
      const parsed = JSON.parse(raw) as OtpRecord;
      if(parsed.expiresAt < now) return false;
      if(parsed.code === otp){
        await r.del(PREFIX+phone); // one-time use
        return true;
      }
      return false;
    } catch { return false; }
  } else {
    const rec = memoryStore.get(phone);
    if(!rec) return false;
    if(rec.expiresAt < now) { memoryStore.delete(phone); return false; }
    if(rec.code === otp){ memoryStore.delete(phone); return true; }
    return false;
  }
}

export function _clearAllInMemory(){ memoryStore.clear(); }
