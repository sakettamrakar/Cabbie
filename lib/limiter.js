import Redis from 'ioredis';
const mem = new Map();
let redis = null;
function getRedis() { if (process.env.REDIS_URL) {
    if (!redis)
        redis = new Redis(process.env.REDIS_URL);
    return redis;
} return null; }
export async function rateLimit(opts) {
    const now = Date.now();
    const r = getRedis();
    if (r) {
        const key = `rl:${opts.key}`;
        const ttl = opts.windowSec;
        const count = await r.incr(key);
        if (count === 1)
            await r.expire(key, ttl);
        return { allowed: count <= opts.max, remaining: Math.max(0, opts.max - count) };
    }
    else {
        const rec = mem.get(opts.key);
        if (!rec || rec.exp < now) {
            mem.set(opts.key, { c: 1, exp: now + opts.windowSec * 1000 });
            return { allowed: true, remaining: opts.max - 1 };
        }
        rec.c++;
        return { allowed: rec.c <= opts.max, remaining: Math.max(0, opts.max - rec.c) };
    }
}
