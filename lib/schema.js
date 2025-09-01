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
export function taxiServiceSchema({ origin, destination, brand = SITE_BRAND, offers = [], distance, duration, features = [] }) {
    devAssert(origin && destination, 'origin/destination required');
    const cap = (v) => v.charAt(0).toUpperCase() + v.slice(1);
    const baseSchema = {
        '@context': 'https://schema.org',
        '@type': 'TaxiService',
        name: `${brand} ${cap(origin)} to ${cap(destination)} Taxi`,
        provider: {
            '@type': 'Organization',
            name: brand,
            url: SITE_BASE_URL
        },
        areaServed: [
            {
                '@type': 'City',
                name: cap(origin),
                addressCountry: 'IN'
            },
            {
                '@type': 'City',
                name: cap(destination),
                addressCountry: 'IN'
            }
        ],
        serviceType: 'Intercity Cab Service',
        description: `Professional taxi service from ${cap(origin)} to ${cap(destination)} with transparent pricing and reliable drivers.`,
        url: `${SITE_BASE_URL}/${origin}/${destination}/fare`
    };
    // Add distance if available
    if (distance) {
        baseSchema.distance = {
            '@type': 'Distance',
            value: distance,
            unitCode: 'KMT'
        };
    }
    // Add duration if available
    if (duration) {
        baseSchema.estimatedDuration = `PT${duration}M`; // ISO 8601 duration format
    }
    // Add features if available
    if (features.length > 0) {
        baseSchema.amenityFeature = features.map(feature => ({
            '@type': 'LocationFeatureSpecification',
            name: feature
        }));
    }
    // Add offers if available
    if (offers.length > 0) {
        baseSchema.hasOfferCatalog = {
            '@type': 'OfferCatalog',
            name: `${cap(origin)} to ${cap(destination)} Taxi Fares`,
            itemListElement: offers.map(o => ({
                '@type': 'Offer',
                name: `${o.name} Taxi`,
                priceCurrency: 'INR',
                price: o.priceInr,
                description: `${o.name} taxi from ${cap(origin)} to ${cap(destination)}`
            }))
        };
    }
    return baseSchema;
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
