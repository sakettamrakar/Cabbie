import { PrismaClient } from '@prisma/client';
import { requireAdminAuth, requireCsrf } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();
export default async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    if (req.method !== 'POST')
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    if (!requireCsrf(req, res))
        return;
    const { booking_id, status } = req.body || {};
    if (!booking_id || !status)
        return res.status(400).json({ ok: false, error: 'booking_id & status required' });
    const allowed = new Set(['PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED']);
    if (!allowed.has(status))
        return res.status(400).json({ ok: false, error: 'invalid status' });
    try {
        const updated = await prisma.booking.update({ where: { id: Number(booking_id) }, data: { status } });
        return res.json({ ok: true, booking: updated });
    }
    catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
}
