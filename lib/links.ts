import { fetchRoutes, fetchCityOutbound } from './data';

export interface RelatedRoute { origin:string; destination:string; distance_km:number|null }

// Returns reverse route (if exists) + up to 3 nearest neighbors (same origin different destination sorted by distance)
export async function relatedRoutes(origin:string, destination:string): Promise<RelatedRoute[]> {
  const routes = await fetchRoutes();
  const reverse = routes.find(r=> r.origin.slug===destination && r.destination.slug===origin);
  const neighbors = routes
    .filter(r=> r.origin.slug===origin && r.destination.slug!==destination)
    .sort((a,b)=> (a.distance_km||999999) - (b.distance_km||999999))
    .slice(0,3);
  const out: RelatedRoute[] = [];
  if(reverse) out.push({ origin:reverse.origin.slug, destination:reverse.destination.slug, distance_km:reverse.distance_km });
  neighbors.forEach(n=> out.push({ origin:n.origin.slug, destination:n.destination.slug, distance_km:n.distance_km }));
  return out;
}

export async function cityTopRoutes(citySlug:string, limit=12){
  const outbound = await fetchCityOutbound(citySlug);
  return outbound
    .slice()
    .sort((a,b)=> (a.distance_km||999999)-(b.distance_km||999999))
    .slice(0,limit)
    .map(r=>({ origin:citySlug, destination:r.destination.slug, distance_km:r.distance_km, fares:r.fares }));
}

export async function footerLinks(){
  // Minimal placeholder: could be expanded to include popular cities based on route counts
  const routes = await fetchRoutes();
  const cityCounts: Record<string,number> = {};
  routes.forEach(r=>{ cityCounts[r.origin.slug]=(cityCounts[r.origin.slug]||0)+1; });
  const topCities = Object.entries(cityCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([slug])=> slug);
  return {
    routesIndex: '/routes',
    topCities: topCities.map(c=> `/city/${c}`),
    brandHub: '/'
  };
}
