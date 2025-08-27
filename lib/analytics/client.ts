import { AnalyticsEventName, BaseParams, sha256 } from './schema';
import { event } from './gtag';

interface TrackParams extends BaseParams { phone?:string; booking_id?:string; }

export async function track(name:AnalyticsEventName, params:TrackParams={}){
  try {
    const cloned: any = { ...params };
    if(!cloned.page_type && typeof window!=='undefined'){
      try {
        const p = window.location.pathname;
        if(/\/booking/.test(p)) cloned.page_type='booking';
        else if(/\/seo\//.test(p)) cloned.page_type='seo';
        else if(/\/fare$/.test(p)) cloned.page_type='fare';
        else cloned.page_type='other';
      } catch {}
    }
    if(cloned.phone){ cloned.phone_hash = await sha256(cloned.phone); delete cloned.phone; }
  if(cloned.booking_id){ cloned.booking_id_hash = await sha256(cloned.booking_id); delete cloned.booking_id; }
    event(name, cloned);
  } catch(e){ /* swallow */ }
}
