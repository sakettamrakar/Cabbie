import { PrismaClient } from '@prisma/client';
import { requireAdminAuth } from '../../../lib/adminAuth';
const prisma = new PrismaClient();
export default async function handler(req, res) {
    const auth = requireAdminAuth(req, res);
    if (!auth)
        return;
    if (req.method === 'GET') {
        const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
        return res.json({ ok: true, cities });
    }
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
