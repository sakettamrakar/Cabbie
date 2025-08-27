import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  const id = Number(req.query.id);
  if(Number.isNaN(id)) return res.status(400).json({ ok:false, error:'Invalid id' });
  if(req.method==='PUT'){
    if(!requireCsrf(req,res)) return;
    const { name, phone, car_type, vehicle_no, active } = req.body||{};
    try {
      const driver = await prisma.driver.update({ where:{ id }, data:{ name, phone, car_type, vehicle_no: vehicle_no??null, active: active===undefined? undefined: !!active } });
      return res.json({ ok:true, driver });
    } catch(e:any){ return res.status(500).json({ ok:false, error:e.message }); }
  }
  if(req.method==='DELETE'){
    if(!requireCsrf(req,res)) return;
    await prisma.driver.delete({ where:{ id } });
    return res.json({ ok:true });
  }
  return res.status(405).json({ ok:false, error:'Method not allowed' });
}
