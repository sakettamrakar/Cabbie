import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../lib/apiWrapper';
import { getPricingQuote } from '../../../../lib/pricing';
import { BookingQuoteInput } from '../../../../lib/validate';
import { makeError, sendError } from '../../../../lib/errors';
const prisma = new PrismaClient();
export default withApi(async function handler(req, res) {
    var _a;
    if (req.method !== 'POST')
        return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
    const body = req.body || {};
    const { route_id, origin_text, destination_text, pickup_datetime, car_type, customer_phone, customer_name } = body;
    if (!route_id)
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'route_id required'));
    const parsed = BookingQuoteInput.safeParse({ origin_text, destination_text, pickup_datetime, car_type });
    if (!parsed.success) {
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Invalid data'));
    }
    if (!customer_phone || !/^[0-9]{10}$/.test(customer_phone))
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'customer_phone invalid'));
    const quote = await getPricingQuote({ origin_text, destination_text, pickup_datetime, car_type });
    // Minimal insertion without OTP (flag for manual verification)
    const booking = await prisma.booking.create({ data: {
            route_id: Number(route_id),
            origin_text, destination_text,
            pickup_datetime: new Date(pickup_datetime),
            car_type,
            fare_quote_inr: quote.fare_base_inr,
            fare_locked_inr: quote.fare_after_discount_inr,
            payment_mode: 'COD',
            status: 'PENDING',
            customer_name: customer_name || null,
            customer_phone,
            discount_code: ((_a = quote.applied_discount) === null || _a === void 0 ? void 0 : _a.code) || null,
            meta: { pe: true }
        } });
    // Simple HTML response (progressive enhancement)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<html><body><h1>Booking Received</h1><p>ID: ${booking.id}</p><p>Status: pending verification.</p><p><a href="/">Return home</a></p></body></html>`);
});
