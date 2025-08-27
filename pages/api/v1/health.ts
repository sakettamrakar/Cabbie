// TODO: For /api/v2 consider adding build/version metadata.
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApi } from '../../../lib/apiWrapper';
import { jsonOk } from '../../../lib/responses';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
let redis:Redis|null=null;

export default withApi(async function handler(_req:NextApiRequest,res:NextApiResponse){
  // DB check
  let db='ok';
  try { await prisma.$queryRaw`SELECT 1`; } catch { db='fail'; }
  // Cache check
  let cache='ok';
  if(process.env.REDIS_URL){
    try { if(!redis) redis = new Redis(process.env.REDIS_URL); await redis.ping(); } catch { cache='fail'; }
  }
  jsonOk(res,{ ok:true, db, cache });
});
