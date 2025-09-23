import { PrismaClient } from '@prisma/client';
import { ensureAdminRequest, extractAdminKey } from '../../../../lib/simpleAdminKeyAuth';
const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
function parsePositiveInt(value, fallback) {
    if (Array.isArray(value))
        return parsePositiveInt(value[0], fallback);
    if (typeof value !== 'string')
        return fallback;
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0)
        return fallback;
    return parsed;
}
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
    if (!ensureAdminRequest(req, res))
        return;
    const page = parsePositiveInt(req.query.page, 1);
    const requestedPageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(Math.max(requestedPageSize, 1), MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;
    try {
        const [total, records] = await prisma.$transaction([
            prisma.booking.count(),
            prisma.booking.findMany({
                orderBy: { created_at: 'desc' },
                skip,
                take: pageSize,
            }),
        ]);
        const bookings = records.map((booking) => ({
            booking_id: booking.id,
            customer_name: (booking === null || booking === void 0 ? void 0 : booking.customer_name) || '',
            customer_phone: booking.customer_phone,
            origin: booking.origin_text,
            destination: booking.destination_text,
            pickup_datetime: booking.pickup_datetime.toISOString(),
            car_type: booking.car_type,
            fare: booking.fare_locked_inr || booking.fare_quote_inr,
            status: booking.status,
            created_at: booking.created_at.toISOString(),
        }));
        res.status(200).json({
            ok: true,
            page,
            pageSize,
            total,
            bookings,
            key: extractAdminKey({ query: req.query, headers: req.headers }) || null,
        });
    }
    catch (error) {
        res.status(500).json({ ok: false, error: (error === null || error === void 0 ? void 0 : error.message) || 'Unexpected error' });
    }
}
