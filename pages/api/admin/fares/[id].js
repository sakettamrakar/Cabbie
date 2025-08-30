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
        const { base_fare_inr, night_surcharge_pct } = req.body || {};
        const fare = await prisma.fare.update({ where: { id }, data: { ...(base_fare_inr == null ? {} : { base_fare_inr: Number(base_fare_inr) }), ...(night_surcharge_pct == null ? {} : { night_surcharge_pct: Number(night_surcharge_pct) }) } });
        return res.json({ ok: true, fare });
    }
    if (req.method === 'DELETE') {
        if (!requireCsrf(req, res))
            return;
        await prisma.fare.delete({ where: { id } });
        return res.json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
