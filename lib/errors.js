export const ErrorCodes = {
    VALIDATION_FAILED: { status: 400, message: 'Validation failed' },
    UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
    FORBIDDEN: { status: 403, message: 'Forbidden' },
    NOT_FOUND: { status: 404, message: 'Not found' },
    RATE_LIMITED: { status: 429, message: 'Too many requests' },
    ALREADY_USED: { status: 410, message: 'Already used' },
    INTERNAL_ERROR: { status: 500, message: 'Internal server error' }
};
export function makeError(code, status, message, details) {
    const base = ErrorCodes[code] || { status: status || 500, message: message || code };
    const err = Object.assign(new Error(message || base.message), { code, status: status || base.status, details });
    return err;
}
export function sendError(res, err) {
    res.status(err.status || 500).json({ ok: false, error: err.code, message: err.message, details: err.details, correlation_id: res.correlation_id });
}
