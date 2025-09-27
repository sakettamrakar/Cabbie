import type { NextApiRequest, NextApiResponse } from 'next';
import { withApi } from '../../../lib/apiWrapper';
import { makeError, sendError } from '../../../lib/errors';
import { jsonOk } from '../../../lib/responses';
import { clearManageSession } from '../../../lib/myBookingsSession';

function featureEnabled() {
  return process.env.FEATURE_MY_BOOKINGS === 'true';
}

export default withApi(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!featureEnabled()) {
    return sendError(res, makeError('NOT_FOUND', 404, 'Not found'));
  }
  if (req.method !== 'POST') {
    return sendError(res, makeError('VALIDATION_FAILED', 405, 'Method not allowed'));
  }
  clearManageSession(res);
  jsonOk(res, { logged_out: true });
});
