import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  if(req.method === 'GET'){
    const fares = await prisma.fare.findMany({ include:{ route:{ include:{ origin:true, destination:true } } }, orderBy:{ id:'asc' } });
    return res.json({ ok:true, fares });
  }
  if(req.method === 'POST'){
    if(!requireCsrf(req,res)) return;
    const { route_id, car_type, base_fare_inr, night_surcharge_pct=0 } = req.body || {};
    if(!route_id || !car_type || base_fare_inr== null) return res.status(400).json({ ok:false, error:'Missing fields' });
    const existing = await prisma.fare.findFirst({ where:{ route_id, car_type } });
    if(existing) return res.status(409).json({ ok:false, error:'Fare exists for route & car type' });
    const fare = await prisma.fare.create({ data:{ route_id:Number(route_id), car_type, base_fare_inr:Number(base_fare_inr), night_surcharge_pct:Number(night_surcharge_pct)||0 } });
    return res.json({ ok:true, fare });
  }
  return res.status(405).json({ ok:false, error:'Method not allowed' });
}
