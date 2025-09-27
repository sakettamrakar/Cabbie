import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withApi } from '../../../lib/apiWrapper';
import { makeError, sendError } from '../../../lib/errors';
import { jsonOk } from '../../../lib/responses';
import { readManageSession } from '../../../lib/myBookingsSession';

const prisma = new PrismaClient();
const MAX_LIMIT = 20;

function featureEnabled() {
  return process.env.FEATURE_MY_BOOKINGS === 'true';
}

export default withApi(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!featureEnabled()) {
    return sendError(res, makeError('NOT_FOUND', 404, 'Not found'));
  }
  if (req.method !== 'GET') {
    return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
  }
  const session = readManageSession(req);
  if (!session) {
    return sendError(res, makeError('UNAUTHORIZED', 401, 'Login required'));
  }
  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const limitParsed = Number(limitRaw);
  const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? Math.min(Math.floor(limitParsed), MAX_LIMIT) : MAX_LIMIT;
  const cursorParam = Array.isArray(req.query.cursor) ? req.query.cursor[0] : req.query.cursor;
  let cursorDate: Date | null = null;
  let cursorId: number | null = null;
  if (cursorParam) {
    const [ts, idPart] = cursorParam.split('_');
    const parsedDate = new Date(ts);
    const parsedId = Number(idPart);
    if (!ts || Number.isNaN(parsedDate.getTime()) || Number.isNaN(parsedId)) {
      return sendError(res, makeError('VALIDATION_FAILED', 400, 'Invalid cursor'));
    }
    cursorDate = parsedDate;
    cursorId = parsedId;
  }
  const where: any = { customer_phone: session.phone };
  if (cursorDate && cursorId !== null) {
    where.AND = [
      {
        OR: [
          { created_at: { lt: cursorDate } },
          { created_at: cursorDate, id: { lt: cursorId } },
        ],
      },
    ];
  }
  const rows = await prisma.booking.findMany({
    where,
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const limitedRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? `${limitedRows[limitedRows.length - 1].created_at.toISOString()}_${limitedRows[limitedRows.length - 1].id}`
    : null;
  const bookings = limitedRows.map((booking) => ({
    id: booking.id,
    origin_text: booking.origin_text,
    destination_text: booking.destination_text,
    pickup_datetime: booking.pickup_datetime.toISOString(),
    car_type: booking.car_type,
    fare_quote_inr: booking.fare_quote_inr,
    fare_locked_inr: booking.fare_locked_inr,
    status: booking.status,
    created_at: booking.created_at.toISOString(),
  }));
  jsonOk(res, {
    bookings,
    next_cursor: nextCursor,
  });
});
