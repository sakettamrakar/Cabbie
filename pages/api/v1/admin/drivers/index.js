import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../../lib/apiWrapper';
import { requireAdminAuth, requireCsrf } from '../../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../../lib/errors';
import { jsonOk, jsonCreated } from '../../../../../lib/responses';
// TODO: Driver availability scheduling in /api/v2.
const prisma = new PrismaClient();
export default withApi(async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    if (req.method === 'GET') {
        const drivers = await prisma.driver.findMany({ orderBy: { name: 'asc' } });
        return jsonOk(res, { drivers });
    }
    if (req.method === 'POST') {
        if (!requireCsrf(req, res))
            return;
        const { name, phone, car_type, vehicle_no, active = true } = req.body || {};
        if (!name || !phone || !car_type)
            return sendError(res, makeError('VALIDATION_FAILED', 400, 'Missing required fields'));
        const data = { name, phone, car_type, active };
        if (vehicle_no)
            data.vehicle_no = vehicle_no;
        try {
            const driver = await prisma.driver.create({ data });
            return jsonCreated(res, { driver });
        }
        catch (e) {
            return sendError(res, makeError('VALIDATION_FAILED', 409, e.message));
        }
    }
    return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
});
