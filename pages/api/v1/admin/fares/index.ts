import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../../lib/apiWrapper';
import { requireAdminAuth, requireCsrf } from '../../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../../lib/errors';
import { jsonOk, jsonCreated } from '../../../../../lib/responses';
// TODO: Revisit fare model for dynamic pricing in /api/v2.
const prisma = new PrismaClient();
export default withApi(async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  if(req.method==='GET'){
    const fares = await prisma.fare.findMany({ include:{ route:{ include:{ origin:true, destination:true } } }, orderBy:{ id:'asc' } });
    return jsonOk(res,{ fares });
  }
  if(req.method==='POST'){
    if(!requireCsrf(req,res)) return; const { route_id, car_type, base_fare_inr, night_surcharge_pct=0 } = req.body||{};
    if(!route_id || !car_type || base_fare_inr==null) return sendError(res, makeError('VALIDATION_FAILED',400,'Missing fields'));
    const existing = await prisma.fare.findFirst({ where:{ route_id, car_type } }); if(existing) return sendError(res, makeError('VALIDATION_FAILED',409,'Fare exists'));
    const fare = await prisma.fare.create({ data:{ route_id:Number(route_id), car_type, base_fare_inr:Number(base_fare_inr), night_surcharge_pct:Number(night_surcharge_pct)||0 } });
    return jsonCreated(res,{ fare });
  }
  return sendError(res, makeError('VALIDATION_FAILED',405,'Method not allowed'));
});
