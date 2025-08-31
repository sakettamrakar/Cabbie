import { newCorrelationId } from './ids';
import { makeError, sendError } from './errors';
export function withApi(handler, opts = {}) {
    return async function wrapped(req, res) {
        const cid = newCorrelationId();
        req.correlation_id = cid;
        res.correlation_id = cid;
        try {
            if (opts.cors) {
                res.setHeader('Vary', 'Origin');
                const origin = req.headers.origin || '';
                const allow = process.env.NODE_ENV !== 'production' && /localhost|127\.0\.0\.1/.test(String(origin));
                if (allow) {
                    res.setHeader('Access-Control-Allow-Origin', String(origin));
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-csrf-token');
                    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
                }
                if (req.method === 'OPTIONS') {
                    res.status(204).end();
                    return;
                }
            }
            await Promise.resolve(handler(req, res));
        }
        catch (err) {
            if (!err.code)
                err = makeError('INTERNAL_ERROR', 500, err.message || 'Internal error');
            sendError(res, err);
        }
    };
}
