import { PrismaClient } from '@prisma/client';
import { requireAdminAuth } from '../../../../lib/adminAuth';
const prisma = new PrismaClient();
export default async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    if (req.method === 'GET') {
        try {
            const { id, phone, date, status } = req.query;
            const where = {};
            if (id)
                where.id = Number(id);
            if (phone)
                where.customer_phone = { contains: String(phone) };
            if (status)
                where.status = String(status);
            if (date) {
                const day = new Date(String(date));
                if (!isNaN(day.getTime())) {
                    const next = new Date(day);
                    next.setDate(day.getDate() + 1);
                    where.pickup_datetime = { gte: day, lt: next };
                }
            }
            const bookings = await prisma.booking.findMany({
                where,
                orderBy: { id: 'desc' },
                include: { route: { include: { origin: true, destination: true } }, assignments: { include: { driver: true } } }
            });
            return res.json({ ok: true, bookings });
        }
        catch (e) {
            return res.status(500).json({ ok: false, error: e.message });
        }
    }
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
