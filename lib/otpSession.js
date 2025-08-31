import crypto from 'crypto';
import Redis from 'ioredis';
const TTL_SEC = 600; // 10 minutes
const PREFIX = 'otpTok:';
let redis = null;
function getRedis() { if (process.env.REDIS_URL) {
    if (!redis)
        redis = new Redis(process.env.REDIS_URL);
    return redis;
} return null; }
const mem = new Map();
export async function createOtpSession(phone) {
    const token = 'otp-ok-' + crypto.randomBytes(8).toString('hex');
    const rec = { phone, exp: Date.now() + TTL_SEC * 1000, used: false };
    const r = getRedis();
    if (r) {
        await r.set(PREFIX + token, JSON.stringify(rec), 'EX', TTL_SEC);
    }
    else {
        mem.set(token, rec);
    }
    return { token, ttl_seconds: TTL_SEC };
}
export async function consumeOtpSession(token) {
    const r = getRedis();
    const now = Date.now();
    if (r) {
        const raw = await r.get(PREFIX + token);
        if (!raw)
            return { ok: false, reason: 'missing' };
        const rec = JSON.parse(raw);
        if (rec.used)
            return { ok: false, reason: 'used' };
        if (rec.exp < now)
            return { ok: false, reason: 'expired' };
        rec.used = true;
        await r.set(PREFIX + token, JSON.stringify(rec), 'PX', rec.exp - now);
        return { ok: true, phone: rec.phone };
    }
    else {
        const rec = mem.get(token);
        if (!rec)
            return { ok: false, reason: 'missing' };
        if (rec.used)
            return { ok: false, reason: 'used' };
        if (rec.exp < now) {
            mem.delete(token);
            return { ok: false, reason: 'expired' };
        }
        rec.used = true;
        return { ok: true, phone: rec.phone };
    }
}
