import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../../lib/apiWrapper';
import { requireAdminAuth, requireCsrf } from '../../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../../lib/errors';
import { jsonOk } from '../../../../../lib/responses';
// TODO: Fare history endpoint in /api/v2.
const prisma = new PrismaClient();
export default withApi(async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return; const id = Number(req.query.id); if(Number.isNaN(id)) return sendError(res, makeError('VALIDATION_FAILED',400,'Invalid id'));
  if(req.method==='GET'){
    const fare = await prisma.fare.findUnique({ where:{ id } }); if(!fare) return sendError(res, makeError('NOT_FOUND',404,'Not found')); return jsonOk(res,{ fare });
  }
  if(req.method==='PUT'){
    if(!requireCsrf(req,res)) return; const { base_fare_inr, night_surcharge_pct } = req.body||{};
    const fare = await prisma.fare.update({ where:{ id }, data:{ base_fare_inr, night_surcharge_pct } }); return jsonOk(res,{ fare });
  }
  if(req.method==='DELETE'){
    if(!requireCsrf(req,res)) return; await prisma.fare.delete({ where:{ id } }); return jsonOk(res,{ deleted:true });
  }
  return sendError(res, makeError('VALIDATION_FAILED',405,'Method not allowed'));
});
