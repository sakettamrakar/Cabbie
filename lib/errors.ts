import type { NextApiResponse } from 'next';

export interface AppError extends Error { code:string; status:number; details?:any; correlation_id?:string }

export const ErrorCodes: Record<string,{ status:number; message:string }> = {
  VALIDATION_FAILED:{ status:400, message:'Validation failed' },
  UNAUTHORIZED:{ status:401, message:'Unauthorized' },
  FORBIDDEN:{ status:403, message:'Forbidden' },
  NOT_FOUND:{ status:404, message:'Not found' },
  RATE_LIMITED:{ status:429, message:'Too many requests' },
  ALREADY_USED:{ status:410, message:'Already used' },
  INTERNAL_ERROR:{ status:500, message:'Internal server error' }
};

export function makeError(code:string, status?:number, message?:string, details?:any): AppError {
  const base = ErrorCodes[code] || { status: status||500, message: message||code };
  const err: AppError = Object.assign(new Error(message||base.message), { code, status: status||base.status, details });
  return err;
}

export function sendError(res:NextApiResponse, err:AppError){
  res.status(err.status||500).json({ ok:false, error:err.code, message:err.message, details:err.details, correlation_id: (res as any).correlation_id });
}
