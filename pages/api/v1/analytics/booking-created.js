import { sendError, makeError } from '../../../../lib/errors';
import { sendServerEvent } from '../../../../lib/analytics/mp';
import { hasEventId, rememberEventId } from '../../../../lib/analytics/dedupe';
import { sha256 } from '../../../../lib/analytics/schema';
export default async function handler(req, res) {
    if (req.method !== 'POST')
        return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
    try {
        const { booking_id, origin, destination, car_type, fare, payment_mode, event_id, client_id } = req.body || {};
        if (!booking_id)
            return sendError(res, makeError('VALIDATION_FAILED', 400, 'booking_id required'));
        if (event_id && hasEventId(event_id)) {
            return res.status(202).json({ ok: true, dedup: true });
        }
        const booking_id_hash = await sha256(String(booking_id));
        await sendServerEvent({ client_id, name: 'booking_created', params: { origin, destination, car_type, fare, payment_mode, booking_id_hash }, event_id });
        if (event_id)
            rememberEventId(event_id);
        res.json({ ok: true });
    }
    catch (e) {
        sendError(res, makeError('UNKNOWN', 500, e.message || 'Server error'));
    }
}
