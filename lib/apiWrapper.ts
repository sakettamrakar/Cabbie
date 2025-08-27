import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { newCorrelationId } from './ids';
import { makeError, sendError } from './errors';

interface WrapperOpts { cors?: boolean }

export function withApi(handler:NextApiHandler, opts:WrapperOpts = {}): NextApiHandler {
  return async function wrapped(req:NextApiRequest,res:NextApiResponse){
    const cid = newCorrelationId();
    (req as any).correlation_id = cid;
    (res as any).correlation_id = cid;
    try {
      if(opts.cors){
        res.setHeader('Vary','Origin');
        const origin = req.headers.origin || '';
        const allow = process.env.NODE_ENV !== 'production' && /localhost|127\.0\.0\.1/.test(String(origin));
        if(allow){
          res.setHeader('Access-Control-Allow-Origin', String(origin));
          res.setHeader('Access-Control-Allow-Credentials','true');
          res.setHeader('Access-Control-Allow-Headers','Content-Type, x-csrf-token');
          res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
        }
        if(req.method==='OPTIONS'){ res.status(204).end(); return; }
      }
      await Promise.resolve(handler(req,res));
    } catch(err:any){
      if(!err.code) err = makeError('INTERNAL_ERROR',500, err.message || 'Internal error');
      sendError(res, err);
    }
  };
}
