import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();

// Body: { car_type: 'SEDAN', mode:'PCT'|'DELTA'|'SET', value:number }
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  if(req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  if(!requireCsrf(req,res)) return;
  const { car_type, mode, value } = req.body || {};
  if(!car_type || !mode || value==null) return res.status(400).json({ ok:false, error:'Missing fields' });
  const fares = await prisma.fare.findMany({ where:{ car_type } });
  let updatedCount=0;
  for(const f of fares){
    let newFare = f.base_fare_inr;
    if(mode==='PCT') newFare = Math.round(f.base_fare_inr * (1 + value/100));
    else if(mode==='DELTA') newFare = f.base_fare_inr + value;
    else if(mode==='SET') newFare = value;
    if(newFare<0) newFare=0;
    if(newFare !== f.base_fare_inr){
      await prisma.fare.update({ where:{ id:f.id }, data:{ base_fare_inr:newFare } });
      updatedCount++;
    }
  }
  return res.json({ ok:true, updated:updatedCount });
}
