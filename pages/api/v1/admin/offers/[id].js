import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../../../lib/apiWrapper';
import { requireAdminAuth, requireCsrf } from '../../../../../lib/adminAuth';
import { makeError, sendError } from '../../../../../lib/errors';
import { jsonOk } from '../../../../../lib/responses';
// TODO: Soft-delete vs hard delete policy in /api/v2.
const prisma = new PrismaClient();
export default withApi(async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    const id = Number(req.query.id);
    if (Number.isNaN(id))
        return sendError(res, makeError('VALIDATION_FAILED', 400, 'Invalid id'));
    if (req.method === 'GET') {
        const offer = await prisma.offer.findUnique({ where: { id } });
        if (!offer)
            return sendError(res, makeError('NOT_FOUND', 404, 'Not found'));
        return jsonOk(res, { offer });
    }
    if (req.method === 'PUT') {
        if (!requireCsrf(req, res))
            return;
        const { title, description, discount_type, value, cap_inr, valid_from, valid_to, active, conditions } = req.body || {};
        const offer = await prisma.offer.update({ where: { id }, data: { title, description, discount_type, value, cap_inr, valid_from: valid_from ? new Date(valid_from) : null, valid_to: valid_to ? new Date(valid_to) : null, active, conditions: conditions ? JSON.stringify(conditions) : null } });
        return jsonOk(res, { offer });
    }
    if (req.method === 'DELETE') {
        if (!requireCsrf(req, res))
            return;
        await prisma.offer.delete({ where: { id } });
        return jsonOk(res, { deleted: true });
    }
    return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
});
