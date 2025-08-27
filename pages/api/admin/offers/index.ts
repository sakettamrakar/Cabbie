import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();
let offersVersion = Date.now();

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res);
  if(!auth) return;
  if(req.method==='GET'){
    const page = Number(req.query.page||'1');
    const pageSize = Math.min(100, Number(req.query.pageSize||'25'));
    const skip = (page-1)*pageSize;
    const [offers,total] = await Promise.all([
      prisma.offer.findMany({ orderBy:{ code:'asc' }, skip, take:pageSize }),
      prisma.offer.count()
    ]);
    return res.json({ ok:true, offers, page, pageSize, total, pages: Math.ceil(total/pageSize), version: offersVersion });
  }
  if(req.method==='POST'){
    if(!requireCsrf(req,res)) return;
    const { code, title, description, discount_type, value, cap_inr, valid_from, valid_to, active=true, conditions } = req.body||{};
    if(!code || !discount_type || value==null) return res.status(400).json({ ok:false, error:'Missing required fields' });
    try {
  const offer = await prisma.offer.create({ data:{ code, title, description, discount_type, value:Number(value), cap_inr: cap_inr===''||cap_inr==null? null: Number(cap_inr), valid_from: valid_from? new Date(valid_from): null, valid_to: valid_to? new Date(valid_to): null, active, conditions: conditions? JSON.stringify(conditions): null }});
  offersVersion = Date.now();
  return res.json({ ok:true, offer, version: offersVersion });
    } catch(e:any){ return res.status(500).json({ ok:false, error:e.message }); }
  }
  return res.status(405).json({ ok:false, error:'Method not allowed' });
}
