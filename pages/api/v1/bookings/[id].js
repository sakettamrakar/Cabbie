import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../lib/apiWrapper';
import { makeError, sendError } from '../../../../lib/errors';
import { jsonOk } from '../../../../lib/responses';
const prisma = new PrismaClient();
export default withApi(async function handler(req, res) {
    var _a;
    if (req.method !== 'GET')
        return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
    const id = Number(req.query.id);
    if (Number.isNaN(id))
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Invalid id'));
    const booking = await prisma.booking.findUnique({ where: { id }, include: { assignments: { include: { driver: true } } } });
    if (!booking)
        return sendError(res, makeError('NOT_FOUND', 404, 'Booking not found'));
    const data = { booking_id: booking.id, status: booking.status || 'PENDING', payment_mode: booking.payment_mode || 'COD', fare_locked_inr: (_a = booking.fare_locked_inr) !== null && _a !== void 0 ? _a : booking.fare_quote_inr };
    if (data.status === 'ASSIGNED' && booking.assignments && booking.assignments.length) {
        const drv = booking.assignments[0].driver;
        if (drv) {
            const masked = drv.phone ? String(drv.phone).replace(/.(?=.{4})/g, '*') : '';
            data.driver = { name: drv.name, phone_masked: masked, car_type: drv.car_type, vehicle_no: drv.vehicle_no || null };
        }
    }
    jsonOk(res, { booking: data });
});
