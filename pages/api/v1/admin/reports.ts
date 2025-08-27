import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../lib/apiWrapper';
import { requireAdminAuth } from '../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../lib/errors';
import { jsonOk } from '../../../../lib/responses';
// TODO: Extended analytics & date filters in /api/v2.
const prisma = new PrismaClient();
export default withApi( async function handler(req:NextApiRequest,res:NextApiResponse){
  const auth = requireAdminAuth(req,res); if(!auth) return; if(req.method!=='GET') return sendError(res, makeError('VALIDATION_FAILED',405,'Method not allowed'));
  const bookings = await prisma.booking.findMany();
  const agg: Record<number,{ route_id:number; totalBookings:number; totalRevenue:number; codBookings:number; onlineBookings:number }> = {};
  for(const b of bookings){
    const rid = (b as any).route_id; if(!agg[rid]) agg[rid] = { route_id:rid, totalBookings:0, totalRevenue:0, codBookings:0, onlineBookings:0 };
    const row = agg[rid]; row.totalBookings +=1; row.totalRevenue += (b as any).fare_quote_inr||0; if((b as any).payment_mode==='COD') row.codBookings+=1; else row.onlineBookings+=1;
  }
  const routeIds = Object.keys(agg).map(Number);
  const routes = routeIds.length? await prisma.route.findMany({ where:{ id:{ in: routeIds } }, include:{ origin:true, destination:true } }):[];
  const info: Record<number,{ origin:string; destination:string }> = {}; for(const r of routes){ info[r.id] = { origin:r.origin.slug, destination:r.destination.slug }; }
  const rows = Object.values(agg).map(r=>({ ...r, origin: info[r.route_id]?.origin||'', destination: info[r.route_id]?.destination||'' }));
  const top5 = [...rows].sort((a,b)=> b.totalRevenue - a.totalRevenue).slice(0,5);
  jsonOk(res,{ routes: rows, top5, generatedAt: Date.now() });
});
