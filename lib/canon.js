import { SITE_BASE_URL } from './seo';
function normDomain(domain) {
    const d = (domain || SITE_BASE_URL).replace(/\/$/, '');
    return d;
}
export function canonicalFor(path, domain) {
    if (!path.startsWith('/'))
        path = '/' + path;
    return normDomain(domain) + path;
}
export function alternateForReverseRoute(origin, destination, domain) {
    const d = normDomain(domain);
    return {
        fare: `${d}/${destination}/${origin}/fare`,
        content: `${d}/seo/${destination}/${origin}`
    };
}
