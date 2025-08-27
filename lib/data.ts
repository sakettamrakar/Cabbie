import { PrismaClient, City, Route, Fare } from '@prisma/client';
let _prisma:PrismaClient | null = null;
function prisma(){ if(!_prisma) _prisma=new PrismaClient(); return _prisma; }

export interface RouteWithRelations {
  id:number; origin:City; destination:City; distance_km:number | null; duration_min:number | null; fares: Fare[];
}

export async function fetchRoutes(): Promise<RouteWithRelations[]> {
  const routes = await prisma().route.findMany({ where:{ is_active:true }, include:{ origin:true, destination:true, fares:true } });
  return routes.map(r=>({ id:r.id, origin:r.origin, destination:r.destination, distance_km:r.distance_km, duration_min:r.duration_min, fares:r.fares }));
}

export async function fetchRouteBySlugs(originSlug:string,destSlug:string){
  const origin=await prisma().city.findUnique({ where:{ slug:originSlug }});
  const destination=await prisma().city.findUnique({ where:{ slug:destSlug }});
  if(!origin||!destination) return null;
  const route=await prisma().route.findFirst({ where:{ origin_city_id:origin.id, destination_city_id:destination.id, is_active:true }, include:{ fares:true }});
  if(!route) return null;
  return { route, origin, destination };
}

// Derive a last updated timestamp for a route's fare/content data.
// Prefers most recent fare updateAt (if available) else route updatedAt else now.
export async function fetchRouteLastUpdated(originSlug:string,destSlug:string){
  const origin=await prisma().city.findUnique({ where:{ slug:originSlug }});
  const destination=await prisma().city.findUnique({ where:{ slug:destSlug }});
  if(!origin||!destination) return new Date();
  const route=await prisma().route.findFirst({ where:{ origin_city_id:origin.id, destination_city_id:destination.id }, include:{ fares:true } });
  if(!route) return new Date();
  // @ts-ignore possible updatedAt fields if schema includes them
  const routeUpdated: Date | undefined = (route as any).updatedAt;
  // @ts-ignore fares updatedAt
  const fareTimes: Date[] = route.fares.map(f=> (f as any).updatedAt).filter(Boolean);
  const mostRecentFare = fareTimes.length ? new Date(Math.max(...fareTimes.map(ft=> new Date(ft).getTime()))) : undefined;
  return mostRecentFare || routeUpdated || new Date();
}

export async function fetchContentToken(key:string){
  const tok = await prisma().contentToken.findUnique({ where:{ key }});
  return tok?.json ? JSON.parse(tok.json) : null;
}

export async function fetchCities(){
  return prisma().city.findMany({ orderBy:{ slug:'asc' } });
}

export async function fetchCityOutbound(citySlug:string){
  const city=await prisma().city.findUnique({ where:{ slug:citySlug }});
  if(!city) return [] as any[];
  const routes=await prisma().route.findMany({ where:{ origin_city_id:city.id, is_active:true }, include:{ destination:true, fares:true }, orderBy:{ distance_km:'asc' } });
  return routes;
}

export async function disconnect(){ if(_prisma){ await _prisma.$disconnect(); _prisma=null; } }
