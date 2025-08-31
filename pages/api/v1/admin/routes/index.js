import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../../lib/apiWrapper';
import { requireAdminAuth, requireCsrf } from '../../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../../lib/errors';
import { jsonOk, jsonCreated } from '../../../../../lib/responses';
const prisma = new PrismaClient();
export default withApi(async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    if (req.method === 'GET') {
        const routes = await prisma.route.findMany({ include: { origin: true, destination: true }, orderBy: { id: 'asc' } });
        return jsonOk(res, { routes });
    }
    if (req.method === 'POST') {
        if (!requireCsrf(req, res))
            return;
        const { origin_city_id, destination_city_id, distance_km, duration_min, is_active = true } = req.body || {};
        if (!origin_city_id || !destination_city_id)
            return sendError(res, makeError('VALIDATION_FAILED', 400, 'Missing origin/destination'));
        const dupe = await prisma.route.findFirst({ where: { origin_city_id, destination_city_id } });
        if (dupe)
            return sendError(res, makeError('VALIDATION_FAILED', 409, 'Route exists'));
        const route = await prisma.route.create({ data: { origin_city_id, destination_city_id, distance_km: distance_km !== null && distance_km !== void 0 ? distance_km : null, duration_min: duration_min !== null && duration_min !== void 0 ? duration_min : null, is_active } });
        return jsonCreated(res, { route });
    }
    return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
});
