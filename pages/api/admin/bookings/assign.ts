import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  if(req.method!=='POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  if(!requireCsrf(req,res)) return;
  const { booking_id, driver_id } = req.body||{};
  if(!booking_id || !driver_id) return res.status(400).json({ ok:false, error:'booking_id & driver_id required' });
  try {
    const booking = await prisma.booking.findUnique({ where:{ id:Number(booking_id) } });
    if(!booking) return res.status(404).json({ ok:false, error:'Booking not found' });
    const driver = await prisma.driver.findUnique({ where:{ id:Number(driver_id) } });
    if(!driver) return res.status(404).json({ ok:false, error:'Driver not found' });
    if(driver.car_type !== booking.car_type) return res.status(400).json({ ok:false, error:'Driver car type mismatch' });
    // Create assignment if not exists
    const existing = await prisma.assignment.findFirst({ where:{ booking_id:booking.id, driver_id:driver.id } });
    if(!existing){
      await prisma.assignment.create({ data:{ booking_id:booking.id, driver_id:driver.id, status:'ASSIGNED' } });
    }
    // Update booking status
    const updated = await prisma.booking.update({ where:{ id:booking.id }, data:{ status:'ASSIGNED' } });
    return res.json({ ok:true, booking: updated });
  } catch(e:any){ return res.status(500).json({ ok:false, error:e.message }); }
}
