import Redis from 'ioredis';
let redis:Redis|null=null;
function getRedis(){ if(process.env.REDIS_URL){ if(!redis) redis=new Redis(process.env.REDIS_URL); return redis;} return null; }
const mem = new Map<string,{ body:any; exp:number }>();
const TTL_SEC = 60*60; // 1h
export async function getOrSetIdempotent(key:string, compute:()=>Promise<any>){
  const r = getRedis();
  const now = Date.now();
  if(r){
    const existing = await r.get('idem:'+key);
    if(existing) return JSON.parse(existing);
    const body = await compute();
    await r.set('idem:'+key, JSON.stringify(body), 'EX', TTL_SEC);
    return body;
  } else {
    const rec = mem.get(key);
    if(rec && rec.exp > now) return rec.body;
    const body = await compute();
    mem.set(key,{ body, exp: now + TTL_SEC*1000 });
    return body;
  }
}
