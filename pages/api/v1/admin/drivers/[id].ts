import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../../lib/apiWrapper';
import { requireAdminAuth, requireCsrf } from '../../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../../lib/errors';
import { jsonOk } from '../../../../../lib/responses';
// TODO: Separate driver activation endpoint in /api/v2.
const prisma = new PrismaClient();
export default withApi(async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return; const id = Number(req.query.id); if(Number.isNaN(id)) return sendError(res, makeError('VALIDATION_FAILED',400,'Invalid id'));
  if(req.method==='GET'){
    const driver = await prisma.driver.findUnique({ where:{ id } }); if(!driver) return sendError(res, makeError('NOT_FOUND',404,'Not found')); return jsonOk(res,{ driver });
  }
  if(req.method==='PUT'){
    if(!requireCsrf(req,res)) return; const { name, phone, car_type, vehicle_no, active } = req.body||{};
    const update:any = { name, phone, car_type, active };
    if(vehicle_no!==undefined) update.vehicle_no = vehicle_no;
    const driver = await prisma.driver.update({ where:{ id }, data: update }); return jsonOk(res,{ driver });
  }
  if(req.method==='DELETE'){
    if(!requireCsrf(req,res)) return; await prisma.driver.update({ where:{ id }, data:{ active:false } }); return jsonOk(res,{ deactivated:true });
  }
  return sendError(res, makeError('VALIDATION_FAILED',405,'Method not allowed'));
});
