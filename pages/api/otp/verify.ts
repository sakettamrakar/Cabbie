import type { NextApiRequest, NextApiResponse } from 'next';
import { withApi } from '../../../lib/apiWrapper';
import { OTPVerifyBody } from '../../../lib/validate';
import { makeError, sendError } from '../../../lib/errors';
import { jsonOk } from '../../../lib/responses';
import { verifyOTP } from '../../../lib/otp2';
import { createOtpSession } from '../../../lib/otpSession';

export default withApi(async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method !== 'POST') return sendError(res, makeError('VALIDATION_FAILED',405,'Method not allowed'));
  const parsed = OTPVerifyBody.safeParse(req.body||{});
  if(!parsed.success){
    return sendError(res, makeError('VALIDATION_FAILED',400,'Invalid phone/otp', parsed.error.flatten()));
  }
  const { phone, otp } = parsed.data;
  // simple reuse guard (memory only) to distinguish already-used vs wrong
  const reuseMap = (global as any).__otpUsedMap || ((global as any).__otpUsedMap = new Map<string,number>());
  if(reuseMap.get(phone)){
    return sendError(res, makeError('ALREADY_USED',410,'OTP already used'));
  }
  const ok = await verifyOTP(phone, otp);
  if(!ok){
    // Could be wrong or expired
    return sendError(res, makeError('UNAUTHORIZED',401,'Invalid or expired OTP'));
  }
  reuseMap.set(phone, Date.now());
  const { token, ttl_seconds } = await createOtpSession(phone);
  jsonOk(res,{ valid:true, token, ttl_seconds });
});
