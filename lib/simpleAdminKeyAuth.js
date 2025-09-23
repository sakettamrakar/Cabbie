function normalizeKeyValue(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
}
function getKeyFromHeaders(headers) {
    if (!headers)
        return undefined;
    const headerValue = headers['x-admin-key'];
    if (Array.isArray(headerValue)) {
        return headerValue[0];
    }
    if (typeof headerValue === 'string') {
        const trimmed = headerValue.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
}
export function getAdminKeyFromQuery(query) {
    return normalizeKeyValue(query.key);
}
export function extractAdminKey(source) {
    const queryKey = source.query ? getAdminKeyFromQuery(source.query) : undefined;
    if (queryKey)
        return queryKey;
    return getKeyFromHeaders(source.headers);
}
export function evaluateAdminAccess(providedKey) {
    const configuredKey = process.env.ADMIN_KEY;
    if (configuredKey && configuredKey.length > 0) {
        if (providedKey === configuredKey) {
            return 'granted';
        }
        return 'missing-key';
    }
    if (process.env.NODE_ENV === 'production') {
        return 'forbidden';
    }
    return 'granted';
}
export function ensureAdminRequest(req, res) {
    const providedKey = extractAdminKey({ query: req.query, headers: req.headers });
    const state = evaluateAdminAccess(providedKey);
    if (state === 'granted') {
        return true;
    }
    if (state === 'missing-key') {
        res.status(401).json({ ok: false, error: 'unauthorized' });
        return false;
    }
    res.status(403).json({ ok: false, error: 'admin_key_required' });
    return false;
}
export function adminAccessStateDetails(state) {
    return {
        requiresKey: state === 'missing-key',
        forbidden: state === 'forbidden',
    };
}
