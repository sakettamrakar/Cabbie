// Simple in-memory event deduplication for a single server instance.
// For production horizontal scaling, replace with Redis or another shared store.

const ttlMs = 24 * 60 * 60 * 1000; // 24h
interface Entry { expires:number }
const store = new Map<string, Entry>();

function sweep(){
  const now = Date.now();
  for(const [k,v] of store){ if(v.expires < now) store.delete(k); }
}

let lastSweep = 0;
function maybeSweep(){
  const now = Date.now();
  if(now - lastSweep > 10 * 60 * 1000){ lastSweep = now; sweep(); }
}

export function hasEventId(id:string){
  maybeSweep();
  const e = store.get(id);
  if(!e) return false;
  if(e.expires < Date.now()){ store.delete(id); return false; }
  return true;
}

export function rememberEventId(id:string){
  maybeSweep();
  store.set(id,{ expires: Date.now()+ttlMs });
}

export function generateEventId(){
  // lightweight random id
  return 'e_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);
}
