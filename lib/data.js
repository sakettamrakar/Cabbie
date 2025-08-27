import { PrismaClient } from '@prisma/client';
let _prisma; function prisma(){ if(!_prisma) _prisma=new PrismaClient(); return _prisma; }

export async function fetchRoutes(){
  const r = await prisma().route.findMany({ include:{ origin:true, destination:true, fares:true } });
  return r.map(rt=>({
    id:rt.id,
    origin:rt.origin,
    destination:rt.destination,
    distance_km:rt.distance_km,
    duration_min:rt.duration_min,
    fares:rt.fares,
  }));
}

export async function fetchRouteBySlugs(originSlug,destSlug){
  const origin=await prisma().city.findUnique({ where:{ slug:originSlug }});
  const destination=await prisma().city.findUnique({ where:{ slug:destSlug }});
  if(!origin||!destination) return null;
  const route=await prisma().route.findFirst({ where:{ origin_city_id:origin.id, destination_city_id:destination.id }, include:{ fares:true }});
  if(!route) return null;
  return { route, origin, destination };
}

// Added to mirror TypeScript implementation for updated timestamps
export async function fetchRouteLastUpdated(originSlug,destSlug){
  const origin=await prisma().city.findUnique({ where:{ slug:originSlug }});
  const destination=await prisma().city.findUnique({ where:{ slug:destSlug }});
  if(!origin||!destination) return new Date();
  const route=await prisma().route.findFirst({ where:{ origin_city_id:origin.id, destination_city_id:destination.id }, include:{ fares:true } });
  if(!route) return new Date();
  const fareTimes = route.fares.map(f=> (f.updatedAt||f.updated_at)).filter(Boolean).map(t=> new Date(t).getTime());
  const mostRecentFare = fareTimes.length ? new Date(Math.max(...fareTimes)) : undefined;
  return mostRecentFare || (route.updatedAt && new Date(route.updatedAt)) || new Date();
}

export async function fetchContentToken(key){
  const tok = await prisma().contentToken.findUnique({ where:{ key }});
  return tok?.json ? JSON.parse(tok.json) : null;
}

export async function fetchCities(){
  return prisma().city.findMany({ orderBy:{ slug:'asc' } });
}

export async function fetchCityOutbound(citySlug){
  const city=await prisma().city.findUnique({ where:{ slug:citySlug }});
  if(!city) return [];
  const routes=await prisma().route.findMany({ where:{ origin_city_id:city.id }, include:{ destination:true, fares:true }, orderBy:{ distance_km:'asc' } });
  return routes;
}

export async function disconnect(){ if(_prisma){ await _prisma.$disconnect(); _prisma=null; } }
