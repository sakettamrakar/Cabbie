import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminAuth } from '../../../lib/adminAuth';
const prisma = new PrismaClient();

interface AggRow { route_id:number; totalBookings:number; totalRevenue:number; codBookings:number; onlineBookings:number; }

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return;
  if(req.method!=='GET') return res.status(405).json({ ok:false, error:'Method not allowed' });
  try {
    // Fetch needed fields (limit size if very large - could paginate later)
    const bookings = await prisma.booking.findMany({ select:{ route_id:true, fare_quote_inr:true, payment_mode:true } });
    const agg: Record<number, AggRow> = {};
    for(const b of bookings){
      const rid = (b as any).route_id;
      if(!agg[rid]) agg[rid] = { route_id:rid, totalBookings:0, totalRevenue:0, codBookings:0, onlineBookings:0 };
      const row = agg[rid];
      row.totalBookings += 1;
      row.totalRevenue += (b as any).fare_quote_inr || 0;
      if((b as any).payment_mode === 'COD') row.codBookings += 1; else row.onlineBookings += 1;
    }
    const routeIds = Object.keys(agg).map(Number);
    const routes = routeIds.length? await prisma.route.findMany({ where:{ id:{ in:routeIds } }, include:{ origin:true, destination:true } }):[];
    const info: Record<number,{ origin:string; destination:string }> = {};
    for(const r of routes){ info[r.id] = { origin:r.origin.slug, destination:r.destination.slug }; }
    const rows = Object.values(agg).map(r=>({ ...r, origin: info[r.route_id]?.origin||'', destination: info[r.route_id]?.destination||'' }));
    const top5 = [...rows].sort((a,b)=> b.totalRevenue - a.totalRevenue).slice(0,5);
    return res.json({ ok:true, routes: rows, top5, generatedAt: Date.now() });
  } catch(e:any){ return res.status(500).json({ ok:false, error:e.message }); }
}
