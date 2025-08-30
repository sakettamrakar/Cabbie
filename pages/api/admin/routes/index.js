import { PrismaClient } from '@prisma/client';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();
export default async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    if (req.method === 'GET') {
        const routes = await prisma.route.findMany({ include: { origin: true, destination: true }, orderBy: { id: 'asc' } });
        return res.json({ ok: true, routes });
    }
    if (req.method === 'POST') {
        if (!requireCsrf(req, res))
            return;
        const { origin_city_id, destination_city_id, distance_km, duration_min, is_active = true } = req.body || {};
        if (!origin_city_id || !destination_city_id)
            return res.status(400).json({ ok: false, error: 'Missing origin/destination' });
        const dupe = await prisma.route.findFirst({ where: { origin_city_id, destination_city_id } });
        if (dupe)
            return res.status(409).json({ ok: false, error: 'Route exists' });
        const route = await prisma.route.create({ data: { origin_city_id, destination_city_id, distance_km: distance_km !== null && distance_km !== void 0 ? distance_km : null, duration_min: duration_min !== null && duration_min !== void 0 ? duration_min : null, is_active } });
        return res.json({ ok: true, route });
    }
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
