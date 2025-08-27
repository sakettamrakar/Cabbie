import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();
let offersVersion = Date.now();
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  const id = Number(req.query.id);
  if(Number.isNaN(id)) return res.status(400).json({ ok:false, error:'Invalid id' });
  if(req.method==='PUT'){
    if(!requireCsrf(req,res)) return;
    const { title, description, discount_type, value, cap_inr, valid_from, valid_to, active, conditions } = req.body||{};
    try {
  const offer = await prisma.offer.update({ where:{ id }, data:{ title, description, discount_type, value: value==null? undefined: Number(value), cap_inr: cap_inr===''||cap_inr==null? null: Number(cap_inr), valid_from: valid_from? new Date(valid_from): null, valid_to: valid_to? new Date(valid_to): null, active: active===undefined? undefined: !!active, conditions: conditions? JSON.stringify(conditions): null }});
  offersVersion = Date.now();
  return res.json({ ok:true, offer, version: offersVersion });
    } catch(e:any){ return res.status(500).json({ ok:false, error:e.message }); }
  }
  if(req.method==='DELETE'){
  if(!requireCsrf(req,res)) return;
  await prisma.offer.delete({ where:{ id } });
  offersVersion = Date.now();
  return res.json({ ok:true, version: offersVersion });
  }
  return res.status(405).json({ ok:false, error:'Method not allowed' });
}
