import { PrismaClient } from '@prisma/client';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();
export default async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    if (req.method === 'GET') {
        const drivers = await prisma.driver.findMany({ orderBy: { name: 'asc' } });
        return res.json({ ok: true, drivers });
    }
    if (req.method === 'POST') {
        if (!requireCsrf(req, res))
            return;
        const { name, phone, car_type, vehicle_no, active = true } = req.body || {};
        if (!name || !phone || !car_type)
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        try {
            const driver = await prisma.driver.create({ data: { name, phone, car_type, vehicle_no: vehicle_no || null, active } });
            return res.json({ ok: true, driver });
        }
        catch (e) {
            return res.status(500).json({ ok: false, error: e.message });
        }
    }
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
