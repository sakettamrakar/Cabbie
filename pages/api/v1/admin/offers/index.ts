import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../../lib/apiWrapper';
import { requireAdminAuth, requireCsrf } from '../../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../../lib/errors';
import { jsonOk, jsonCreated } from '../../../../../lib/responses';
// TODO: Offer segmentation enhancements for /api/v2.
const prisma = new PrismaClient();
let offersVersion = Date.now();
export default withApi(async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  if(req.method==='GET'){
    const page = Number(req.query.page||'1'); const pageSize = Math.min(100, Number(req.query.pageSize||'25')); const skip=(page-1)*pageSize;
    const [offers,total] = await Promise.all([
      prisma.offer.findMany({ orderBy:{ code:'asc' }, skip, take:pageSize }),
      prisma.offer.count()
    ]);
    return jsonOk(res,{ offers, page, pageSize, total, pages: Math.ceil(total/pageSize), version: offersVersion });
  }
  if(req.method==='POST'){
    if(!requireCsrf(req,res)) return; const { code, title, description, discount_type, value, cap_inr, valid_from, valid_to, active=true, conditions } = req.body||{};
    if(!code || !discount_type || value==null) return sendError(res, makeError('VALIDATION_FAILED',400,'Missing required fields'));
    const offer = await prisma.offer.create({ data:{ code, title, description, discount_type, value:Number(value), cap_inr: cap_inr===''||cap_inr==null? null: Number(cap_inr), valid_from: valid_from? new Date(valid_from): null, valid_to: valid_to? new Date(valid_to): null, active, conditions: conditions? JSON.stringify(conditions): null }});
    offersVersion = Date.now();
    return jsonCreated(res,{ offer, version: offersVersion });
  }
  return sendError(res, makeError('VALIDATION_FAILED',405,'Method not allowed'));
});
