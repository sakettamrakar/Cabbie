import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../../lib/apiWrapper';
import { requireAdminAuth, requireCsrf } from '../../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../../lib/errors';
import { jsonOk } from '../../../../../lib/responses';
// TODO: Move destructive operations to /api/v2 with soft-delete semantics.
const prisma = new PrismaClient();
export default withApi(async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    const id = Number(req.query.id);
    if (Number.isNaN(id))
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Invalid id'));
    if (req.method === 'GET') {
        const route = await prisma.route.findUnique({ where: { id }, include: { origin: true, destination: true } });
        if (!route)
            return sendError(res, makeError('NOT_FOUND', 404, 'Not found'));
        return jsonOk(res, { route });
    }
    if (req.method === 'PUT') {
        if (!requireCsrf(req, res))
            return;
        const { distance_km, duration_min, is_active } = req.body || {};
        const route = await prisma.route.update({ where: { id }, data: { distance_km, duration_min, is_active } });
        return jsonOk(res, { route });
    }
    if (req.method === 'DELETE') {
        if (!requireCsrf(req, res))
            return;
        await prisma.route.delete({ where: { id } });
        return jsonOk(res, { deleted: true });
    }
    return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
});
