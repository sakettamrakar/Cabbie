import crypto from 'crypto';
export function titleVariantForRoute(origin, destination) {
    const list = (process.env.EXP_TITLE_ROUTES || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const key = `${origin}-${destination}`.toLowerCase();
    if (list.includes(key))
        return 'priceFirst';
    const h = crypto.createHash('md5').update(key).digest('hex');
    const n = parseInt(h.slice(0, 4), 16);
    const pct = n / 0xffff;
    return pct < 0.1 ? 'priceFirst' : 'benefitFirst';
}
export function buildFareTitle(origin, destination, baseFare, variant, brand) {
    if (variant === 'priceFirst' && baseFare) {
        return `${origin} to ${destination} Taxi Fare from ₹${baseFare} | ${brand}`;
    }
    return `${origin} to ${destination} Taxi Fare | ${brand}`;
}
