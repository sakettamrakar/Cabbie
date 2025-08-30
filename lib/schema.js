import { SITE_BASE_URL, SITE_BRAND } from './seo';
const DEV = process.env.NODE_ENV !== 'production';
function devAssert(cond, msg) { if (DEV && !cond)
    throw new Error(`schema:${msg}`); }
export function taxiServiceJsonLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'TaxiService',
        name: SITE_BRAND,
        url: SITE_BASE_URL,
        areaServed: 'India',
        serviceType: 'Outstation Cab'
    };
}
export function faqJsonLd(faqs) {
    if (!(faqs === null || faqs === void 0 ? void 0 : faqs.length))
        return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
    };
}
export function taxiServiceSchema({ origin, destination, brand = SITE_BRAND, offers = [] }) {
    devAssert(origin && destination, 'origin/destination required');
    return {
        '@context': 'https://schema.org',
        '@type': 'TaxiService',
        name: `${brand} ${origin} to ${destination} Taxi`,
        provider: { '@type': 'Organization', name: brand },
        areaServed: [origin, destination],
        serviceType: 'Intercity Cab',
        hasOfferCatalog: offers.length ? {
            '@type': 'OfferCatalog',
            name: `${origin} to ${destination} Fares`,
            itemListElement: offers.map(o => ({ '@type': 'Offer', name: o.name, priceCurrency: 'INR', price: o.priceInr }))
        } : undefined
    };
}
export function faqPageSchema(items) {
    if (!(items === null || items === void 0 ? void 0 : items.length))
        return null;
    return faqJsonLd(items);
}
export function breadcrumbSchema(segments) {
    devAssert(Array.isArray(segments) && segments.length > 0, 'breadcrumb segments required');
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: segments.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, item: s.url }))
    };
}
export function collectionPageSchema({ name, itemUrls }) {
    devAssert(name, 'collection name required');
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        hasPart: itemUrls.slice(0, 50).map(u => ({ '@type': 'WebPage', '@id': u }))
    };
}
