import { withApi } from '../../../lib/apiWrapper';
import { jsonOk } from '../../../lib/responses';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
const prisma = new PrismaClient();
let redis = null;
export default withApi(async function handler(_req, res) {
    // DB check
    let db = 'ok';
    try {
        await prisma.$queryRaw `SELECT 1`;
    }
    catch {
        db = 'fail';
    }
    // Cache check
    let cache = 'ok';
    if (process.env.REDIS_URL) {
        try {
            if (!redis)
                redis = new Redis(process.env.REDIS_URL);
            await redis.ping();
        }
        catch {
            cache = 'fail';
        }
    }
    jsonOk(res, { ok: true, db, cache });
});
