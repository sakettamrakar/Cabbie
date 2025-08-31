// UTM capture & retrieval utilities (client-side)
// Persist first-touch UTM params in cookie (90 days) and expose helper to append to analytics events.
const COOKIE_NAME = 'utm_first';
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days
function parseQuery(qs) {
    const out = {};
    qs.replace(/^\?/, '').split('&').forEach(p => { if (!p)
        return; const [k, v] = p.split('='); if (k)
        out[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return out;
}
export function captureUtmFromLocation() {
    if (typeof document === 'undefined')
        return;
    try {
        const params = parseQuery(window.location.search);
        const utm = {};
        if (params.utm_source)
            utm.source = params.utm_source;
        if (params.utm_medium)
            utm.medium = params.utm_medium;
        if (params.utm_campaign)
            utm.campaign = params.utm_campaign;
        if (Object.keys(utm).length === 0)
            return; // nothing new
        // Only set if cookie not already present (first touch)
        if (!document.cookie.split('; ').find(c => c.startsWith(COOKIE_NAME + '='))) {
            const value = encodeURIComponent(JSON.stringify(utm));
            document.cookie = `${COOKIE_NAME}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
        }
    }
    catch { }
}
export function readUtmCookie() {
    if (typeof document === 'undefined')
        return;
    const raw = document.cookie.split('; ').find(c => c.startsWith(COOKIE_NAME + '='));
    if (!raw)
        return;
    try {
        return JSON.parse(decodeURIComponent(raw.split('=')[1] || ''));
    }
    catch {
        return;
    }
}
export function attachUtm(params) {
    const utm = readUtmCookie();
    if (!utm)
        return params;
    return { ...params, source: utm.source, medium: utm.medium, campaign: utm.campaign };
}
