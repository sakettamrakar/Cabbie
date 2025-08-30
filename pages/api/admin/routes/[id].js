import { PrismaClient } from '@prisma/client';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();
export default async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    const id = Number(req.query.id);
    if (Number.isNaN(id))
        return res.status(400).json({ ok: false, error: 'Invalid id' });
    if (req.method === 'PUT') {
        if (!requireCsrf(req, res))
            return;
        const { distance_km, duration_min, is_active } = req.body || {};
        const updated = await prisma.route.update({ where: { id }, data: { distance_km: distance_km !== null && distance_km !== void 0 ? distance_km : null, duration_min: duration_min !== null && duration_min !== void 0 ? duration_min : null, ...(is_active === undefined ? {} : { is_active }) } });
        return res.json({ ok: true, route: updated });
    }
    if (req.method === 'DELETE') {
        if (!requireCsrf(req, res))
            return;
        await prisma.route.delete({ where: { id } });
        return res.json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
