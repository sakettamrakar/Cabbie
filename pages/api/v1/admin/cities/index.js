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
        const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
        return jsonOk(res, { cities });
    }
    if (req.method === 'POST') {
        if (!requireCsrf(req, res))
            return;
        const { name, slug, state, airport_code } = req.body || {};
        if (!name || !slug || !state)
            return sendError(res, makeError('VALIDATION_FAILED', 400, 'Missing fields'));
        const existing = await prisma.city.findFirst({ where: { slug } });
        if (existing)
            return sendError(res, makeError('VALIDATION_FAILED', 409, 'Slug exists'));
        const city = await prisma.city.create({ data: { name, slug: slug.toLowerCase(), state, airport_code: airport_code || null } });
        return jsonCreated(res, { city });
    }
    return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
});
