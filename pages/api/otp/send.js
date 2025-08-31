import { withApi } from '../../../lib/apiWrapper';
import { OTPIssueBody } from '../../../lib/validate';
import { makeError, sendError } from '../../../lib/errors';
import { jsonOk } from '../../../lib/responses';
import { issueOTP } from '../../../lib/otp2';
import { rateLimit } from '../../../lib/limiter';
export default withApi(async function handler(req, res) {
    if (req.method !== 'POST')
        return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
    const parsed = OTPIssueBody.safeParse(req.body || {});
    if (!parsed.success) {
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Invalid phone', parsed.error.flatten()));
    }
    const { phone } = parsed.data;
    // Rate limits: 3 / 15m per phone, 10 / hour per IP
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const rlPhone = await rateLimit({ key: `otp_phone_${phone}`, windowSec: 15 * 60, max: 3 });
    if (!rlPhone.allowed) {
        return sendError(res, makeError('RATE_LIMITED', 429, 'Too many OTP requests for this phone'));
    }
    const rlIP = await rateLimit({ key: `otp_ip_${ip}`, windowSec: 60 * 60, max: 10 });
    if (!rlIP.allowed) {
        return sendError(res, makeError('RATE_LIMITED', 429, 'Too many OTP requests from this IP'));
    }
    const issued = await issueOTP(phone);
    const ttl_seconds = issued.expires_in; // rename for contract
    const payload = { ok: true, ttl_seconds };
    if (issued.otp)
        payload.mock_otp = issued.otp; // dev only
    jsonOk(res, payload);
});
