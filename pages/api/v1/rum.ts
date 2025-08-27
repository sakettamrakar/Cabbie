import type { NextApiRequest, NextApiResponse } from 'next';
import { withApi } from '../../../lib/apiWrapper';
import fs from 'fs';
import path from 'path';

// Simple RUM ingest endpoint.
// Accepts POST JSON: { metric, value, page_type, origin?, destination?, ts }
// In production you could forward to external analytics (BigQuery / GA4 / etc.).

export default withApi(async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { metric, value, page_type, origin, destination, ts } = body || {};
    if(!metric || typeof value !== 'number') return res.status(400).json({ ok:false, error:'Invalid payload' });
    const record = { metric, value, page_type, origin, destination, ts: ts || Date.now(), ua: req.headers['user-agent'] };
    // Append to daily JSONL file for aggregation
    try {
      const day = new Date(record.ts).toISOString().slice(0,10);
      const dir = path.join(process.cwd(),'data','rum');
      if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
      fs.appendFile(dir+`/${day}.jsonl`, JSON.stringify(record)+'\n', ()=>{});
    } catch(e){ /* swallow persistence errors */ }
    if(process.env.NODE_ENV !== 'production'){
      // eslint-disable-next-line no-console
      console.log('[RUM]', record);
    }
    // TODO: Forward to external sink when configured
    return res.status(200).json({ ok:true });
  } catch(err:any){
    return res.status(500).json({ ok:false, error:'RUM ingest failed' });
  }
});
