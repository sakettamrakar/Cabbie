import { withApi } from '../../lib/apiWrapper';
import { BookingQuoteInput } from '../../lib/validate';
import { makeError, sendError } from '../../lib/errors';
import { getPricingQuote } from '../../lib/pricing';
import { jsonOk } from '../../lib/responses';
export default withApi(async function handler(req, res) {
    if (req.method !== 'POST')
        return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
    // Validate body
    const parsed = BookingQuoteInput.safeParse(req.body || {});
    if (!parsed.success) {
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Invalid request', parsed.error.flatten()));
    }
    const { origin_text, destination_text, pickup_datetime, car_type, discount_code } = parsed.data;
    // Call pricing
    const quote = await getPricingQuote({ origin_text, destination_text, pickup_datetime, car_type, discount_code });
    if (quote.route_id == null) {
        return sendError(res, makeError('NOT_FOUND', 404, 'Route not found'));
    }
    if (discount_code && quote.discount_valid === false) {
        return sendError(res, makeError('VALIDATION_FAILED', 409, 'Invalid or ineligible discount code'));
    }
    jsonOk(res, { quote });
});
