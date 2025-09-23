import { PrismaClient } from '@prisma/client';
import { withApi } from '../../lib/apiWrapper';
import { makeError, sendError } from '../../lib/errors';
import { jsonCreated } from '../../lib/responses';
import { BookingQuoteInput } from '../../lib/validate';
import { getPricingQuote } from '../../lib/pricing';
import { consumeOtpSession } from '../../lib/otpSession';
import { getOrSetIdempotent } from '../../lib/idempotency';
import { sendServerEvent } from '../../lib/analytics/mp';
import { sha256 } from '../../lib/analytics/schema';
import { generateEventId, rememberEventId } from '../../lib/analytics/dedupe';
const prisma = new PrismaClient();
const TOLERANCE = 50; // INR tolerance allowed between client fare_quote_inr and recomputed
export default withApi(async function handler(req, res) {
    if (req.method !== 'POST')
        return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
    const idemKey = req.headers['idempotency-key'];
    if (!idemKey || typeof idemKey !== 'string')
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Idempotency-Key header required'));
    // Basic body extraction
    const { route_id, origin_text, destination_text, pickup_datetime, car_type, fare_quote_inr, discount_code, payment_mode, customer_phone, customer_name, otp_token } = req.body || {};
    // UTM extraction: accept explicit body override else attempt cookie header parse (utm_first)
    let utm_source;
    let utm_medium;
    let utm_campaign;
    try {
        if (typeof req.cookies === 'object') {
            const raw = req.cookies['utm_first'];
            if (raw) {
                const parsed = JSON.parse(decodeURIComponent(raw));
                utm_source = parsed.source;
                utm_medium = parsed.medium;
                utm_campaign = parsed.campaign;
            }
        }
        else if (req.headers.cookie) {
            const hit = req.headers.cookie.split('; ').find(c => c.startsWith('utm_first='));
            if (hit) {
                const val = hit.split('=')[1];
                const parsed = JSON.parse(decodeURIComponent(val));
                utm_source = parsed.source;
                utm_medium = parsed.medium;
                utm_campaign = parsed.campaign;
            }
        }
    }
    catch { }
    // Validate core fields via modified schema + additional fields
    const parsedQuote = BookingQuoteInput.safeParse({ origin_text, destination_text, pickup_datetime, car_type, discount_code });
    if (!parsedQuote.success) {
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Invalid booking data', parsedQuote.error.flatten()));
    }
    if (payment_mode && payment_mode !== 'COD')
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Only COD supported currently'));
    if (!route_id || typeof route_id !== 'number')
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'route_id required'));
    if (!customer_phone || !/^[0-9]{10}$/.test(customer_phone))
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'customer_phone invalid'));
    if (typeof fare_quote_inr !== 'number')
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'fare_quote_inr required as number'));
    if (!otp_token)
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'otp_token required'));
    // Idempotent wrapper
    const response = await getOrSetIdempotent('booking:' + idemKey, async () => {
        var _a;
        // Verify OTP session token (single-use)
        const consumed = await consumeOtpSession(otp_token);
        if (!consumed.ok) {
            if (consumed.reason === 'used')
                throw makeError('ALREADY_USED', 410, 'OTP token already used');
            if (consumed.reason === 'expired')
                throw makeError('UNAUTHORIZED', 401, 'OTP token expired');
            throw makeError('UNAUTHORIZED', 401, 'OTP token invalid');
        }
        if (consumed.phone !== customer_phone) {
            throw makeError('UNAUTHORIZED', 401, 'OTP token not valid for this phone');
        }
        // Route active check
        const route = await prisma.route.findUnique({ where: { id: route_id } });
        if (!route || !route.is_active)
            throw makeError('NOT_FOUND', 404, 'Route inactive or missing');
        // Recompute fare server-side
        const quote = await getPricingQuote({ origin_text, destination_text, pickup_datetime, car_type, discount_code });
        if (quote.route_id !== route_id)
            throw makeError('NOT_FOUND', 404, 'Route mismatch');
        const finalFare = quote.fare_after_discount_inr;
        if (Math.abs(finalFare - fare_quote_inr) > TOLERANCE) {
            throw makeError('VALIDATION_FAILED', 409, 'Fare changed, please refresh quote', { server_fare: finalFare });
        }
        // Insert booking
        const booking = await prisma.booking.create({ data: {
                route_id,
                origin_text,
                destination_text,
                pickup_datetime: new Date(pickup_datetime),
                car_type,
                fare_quote_inr: quote.fare_base_inr,
                fare_locked_inr: finalFare,
                payment_mode: 'COD',
                status: 'PENDING',
                customer_name: customer_name || null,
                customer_phone,
                discount_code: ((_a = quote.applied_discount) === null || _a === void 0 ? void 0 : _a.code) || null,
                utm_source: utm_source || null,
                utm_medium: utm_medium || null,
                utm_campaign: utm_campaign || null
            } });
        const booking_id = booking.id;
        console.info('[booking] persisted', { booking_id });
        // Server analytics event (dedup by idempotency already, still produce event_id for client)
        const event_id = generateEventId();
        const SALT = process.env.BOOKING_HASH_SALT || 's1';
        const booking_id_hash = await sha256(String(booking_id) + SALT);
        try {
            await sendServerEvent({ name: 'booking_created', params: { origin: origin_text, destination: destination_text, fare: finalFare, car_type, payment_mode: 'COD', booking_id_hash, source: utm_source, medium: utm_medium, campaign: utm_campaign }, event_id });
            rememberEventId(event_id);
        }
        catch { }
        return { booking_id, status: 'PENDING', payment_mode: 'COD', fare_locked_inr: finalFare, message: 'Booking created', event_id };
    });
    jsonCreated(res, response);
});
