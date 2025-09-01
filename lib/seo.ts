export const SITE_BRAND = 'RaipurToCabs';
export const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://www.example.com';

export function canonicalFare(origin:string,destination:string){
  return `${SITE_BASE_URL}/${origin}/${destination}/fare`;
}
export function canonicalSeo(origin:string,destination:string){
  return `${SITE_BASE_URL}/${origin}/${origin}-to-${destination}-taxi.html`;
}
export function canonicalCity(city:string){
  return `${SITE_BASE_URL}/city/${city}`;
}
export function canonicalRoutesIndex(){
  return `${SITE_BASE_URL}/routes.html`;
}
export function buildTitle(main:string){
  return `${main} | ${SITE_BRAND}`;
}

export function metaDescriptionFare(origin:string,destination:string,distance:number,duration:number){
  return `${distance} km (~${duration} mins) taxi from ${origin} to ${destination}. Reliable ${SITE_BRAND} outstation cabs with transparent fares.`;
}

// --- New typed helpers (extended SEO utilities) ---
export type TitleVariant = 'priceFirst' | 'benefitFirst';
export type PageType = 'home' | 'fare' | 'content' | 'city' | 'routes' | 'booking' | 'other';

function cap(v:string){ return v.charAt(0).toUpperCase()+v.slice(1); }
function ensure(v:string, name:string){ if(!v) throw new Error(`${name} required`); return v; }
function normalizeDomain(domain:string){
  if(/^https?:\/\//i.test(domain)) return domain.replace(/\/$/, '');
  return `https://${domain.replace(/\/$/,'')}`;
}

export function buildTitleFare(origin:string,destination:string,price:number|string,brand:string){
  ensure(origin,'origin'); ensure(destination,'destination'); ensure(String(price),'price'); ensure(brand,'brand');
  return `${cap(origin)} to ${cap(destination)} Taxi Fare from \u20B9${price} | ${brand}`;
}

export function buildTitleContent(origin:string,destination:string,brand:string,variant:TitleVariant){
  ensure(origin,'origin'); ensure(destination,'destination'); ensure(brand,'brand');
  const base = `${cap(origin)} to ${cap(destination)} Taxi`;
  if(variant==='priceFirst') return `${base} - Affordable Fares | ${brand}`;
  return `Reliable ${cap(origin)} to ${cap(destination)} Cabs | ${brand}`;
}

interface MetaDescriptionInput { 
  origin: string; 
  destination: string; 
  price?: number | string; 
  benefits?: string[];
  distance?: number;
  duration?: number;
}
export function buildMetaDescription({ origin, destination, price, benefits, distance, duration }: MetaDescriptionInput){
  ensure(origin,'origin'); ensure(destination,'destination');
  const priceText = price ? ` fixed fare ₹${price}` : '';
  const distanceText = distance ? ` ${distance}km` : '';
  const durationText = duration ? `, ${Math.floor(duration/60)}h journey` : '';
  const list = (benefits || []).filter(Boolean).slice(0, 3).join(', ');
  const benefitPart = list ? ` ${list}.` : '';
  return `Book ${cap(origin)} to ${cap(destination)} cab at${priceText}.${distanceText}${durationText}. Toll & GST included, doorstep pickup.${benefitPart}`.trim();
}

export function canonicalForFare(origin:string,destination:string,domain:string){
  ensure(origin,'origin'); ensure(destination,'destination'); ensure(domain,'domain');
  const d = normalizeDomain(domain);
  return `${d}/${origin}/${destination}/fare`;
}
export function canonicalForContent(origin:string,destination:string,domain:string){
  ensure(origin,'origin'); ensure(destination,'destination'); ensure(domain,'domain');
  const d = normalizeDomain(domain);
  return `${d}/${origin}/${origin}-to-${destination}-taxi.html`;
}

interface RobotsInput { index:boolean; follow:boolean; }
export function robotsMeta({ index, follow }: RobotsInput){
  return `${index? 'index':'noindex'},${follow? 'follow':'nofollow'}`;
}

interface UniqueKeyInput { type:PageType; origin?:string; destination?:string; }
export function uniqueKeyForPage({ type, origin, destination }: UniqueKeyInput){
  const o=origin||'_'; const d=destination||'_';
  return `${type}:${o}:${d}`;
}

export type { MetaDescriptionInput as BuildMetaDescriptionInput, RobotsInput, UniqueKeyInput };
