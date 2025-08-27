import type { NextApiResponse } from 'next';
export function jsonOk(res:NextApiResponse, payload:any){ res.status(200).json({ ok:true, correlation_id:(res as any).correlation_id, ...payload }); }
export function jsonCreated(res:NextApiResponse, payload:any){ res.status(201).json({ ok:true, correlation_id:(res as any).correlation_id, ...payload }); }
