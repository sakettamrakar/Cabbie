import crypto from 'crypto';
import type { TitleVariant } from './seo';

export function titleVariantForRoute(origin:string,destination:string): TitleVariant {
  const list = (process.env.EXP_TITLE_ROUTES||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const key = `${origin}-${destination}`.toLowerCase();
  if(list.includes(key)) return 'priceFirst';
  const h = crypto.createHash('md5').update(key).digest('hex');
  const n = parseInt(h.slice(0,4),16);
  const pct = n / 0xffff;
  return pct < 0.1 ? 'priceFirst' : 'benefitFirst';
}

export function buildFareTitle(origin:string,destination:string,baseFare:number|undefined|null, variant:TitleVariant, brand:string){
  if(variant==='priceFirst' && baseFare){
    return `${origin} to ${destination} Taxi Fare from ₹${baseFare} | ${brand}`;
  }
  return `${origin} to ${destination} Taxi Fare | ${brand}`;
}