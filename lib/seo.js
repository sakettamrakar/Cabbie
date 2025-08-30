export const SITE_BRAND = 'RaipurToCabs';
export const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://www.example.com';
export function canonicalFare(origin, destination) {
    return `${SITE_BASE_URL}/${origin}/${destination}/fare`;
}
export function canonicalSeo(origin, destination) {
    return `${SITE_BASE_URL}/${origin}/${origin}-to-${destination}-taxi.html`;
}
export function canonicalCity(city) {
    return `${SITE_BASE_URL}/city/${city}`;
}
export function canonicalRoutesIndex() {
    return `${SITE_BASE_URL}/routes.html`;
}
export function buildTitle(main) {
    return `${main} | ${SITE_BRAND}`;
}
export function metaDescriptionFare(origin, destination, distance, duration) {
    return `${distance} km (~${duration} mins) taxi from ${origin} to ${destination}. Reliable ${SITE_BRAND} outstation cabs with transparent fares.`;
}
function cap(v) { return v.charAt(0).toUpperCase() + v.slice(1); }
function ensure(v, name) { if (!v)
    throw new Error(`${name} required`); return v; }
function normalizeDomain(domain) {
    if (/^https?:\/\//i.test(domain))
        return domain.replace(/\/$/, '');
    return `https://${domain.replace(/\/$/, '')}`;
}
export function buildTitleFare(origin, destination, price, brand) {
    ensure(origin, 'origin');
    ensure(destination, 'destination');
    ensure(String(price), 'price');
    ensure(brand, 'brand');
    return `${cap(origin)} to ${cap(destination)} Taxi Fare from \u20B9${price} | ${brand}`;
}
export function buildTitleContent(origin, destination, brand, variant) {
    ensure(origin, 'origin');
    ensure(destination, 'destination');
    ensure(brand, 'brand');
    const base = `${cap(origin)} to ${cap(destination)} Taxi`;
    if (variant === 'priceFirst')
        return `${base} - Affordable Fares | ${brand}`;
    return `Reliable ${cap(origin)} to ${cap(destination)} Cabs | ${brand}`;
}
export function buildMetaDescription({ origin, destination, price, benefits }) {
    ensure(origin, 'origin');
    ensure(destination, 'destination');
    ensure(String(price), 'price');
    const list = (benefits || []).filter(Boolean).slice(0, 3).join(', ');
    const benefitPart = list ? ` Benefits: ${list}.` : '';
    return `${cap(origin)} to ${cap(destination)} taxi fare from \u20B9${price}. Transparent pricing, instant booking.${benefitPart}`.trim();
}
export function canonicalForFare(origin, destination, domain) {
    ensure(origin, 'origin');
    ensure(destination, 'destination');
    ensure(domain, 'domain');
    const d = normalizeDomain(domain);
    return `${d}/${origin}/${destination}/fare`;
}
export function canonicalForContent(origin, destination, domain) {
    ensure(origin, 'origin');
    ensure(destination, 'destination');
    ensure(domain, 'domain');
    const d = normalizeDomain(domain);
    return `${d}/${origin}/${origin}-to-${destination}-taxi.html`;
}
export function robotsMeta({ index, follow }) {
    return `${index ? 'index' : 'noindex'},${follow ? 'follow' : 'nofollow'}`;
}
export function uniqueKeyForPage({ type, origin, destination }) {
    const o = origin || '_';
    const d = destination || '_';
    return `${type}:${o}:${d}`;
}
