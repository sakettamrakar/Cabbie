import { SITE_BASE_URL, SITE_BRAND } from './seo';

const DEV = process.env.NODE_ENV !== 'production';
function devAssert(cond: any, msg: string){ if(DEV && !cond) throw new Error(`schema:${msg}`); }

export function taxiServiceJsonLd(){
  return {
    '@context':'https://schema.org',
    '@type':'TaxiService',
    name: SITE_BRAND,
    url: SITE_BASE_URL,
    areaServed: 'India',
    serviceType: 'Outstation Cab'
  };
}

export function faqJsonLd(faqs:{q:string;a:string;}[]){
  if(!faqs?.length) return null;
  return {
    '@context':'https://schema.org',
    '@type':'FAQPage',
    mainEntity: faqs.map(f=>({
      '@type':'Question',
      name: f.q,
      acceptedAnswer: { '@type':'Answer', text: f.a }
    }))
  };
}

// --- New schema helpers ---
interface TaxiServiceSchemaInput { origin:string; destination:string; brand?:string; offers?:{ name:string; priceInr:number }[] }
export function taxiServiceSchema({ origin, destination, brand=SITE_BRAND, offers=[] }: TaxiServiceSchemaInput){
  devAssert(origin && destination, 'origin/destination required');
  return {
    '@context':'https://schema.org',
    '@type':'TaxiService',
    name: `${brand} ${origin} to ${destination} Taxi`,
    provider: { '@type':'Organization', name: brand },
    areaServed: [ origin, destination ],
    serviceType: 'Intercity Cab',
    hasOfferCatalog: offers.length ? {
      '@type':'OfferCatalog',
      name: `${origin} to ${destination} Fares`,
      itemListElement: offers.map(o=>({ '@type':'Offer', name:o.name, priceCurrency:'INR', price:o.priceInr }))
    } : undefined
  };
}

export function faqPageSchema(items:{ q:string; a:string }[]){
  if(!items?.length) return null;
  return faqJsonLd(items as any);
}

interface BreadcrumbSegment { name:string; url:string }
export function breadcrumbSchema(segments: BreadcrumbSegment[]){
  devAssert(Array.isArray(segments) && segments.length>0, 'breadcrumb segments required');
  return {
    '@context':'https://schema.org',
    '@type':'BreadcrumbList',
    itemListElement: segments.map((s,i)=>({ '@type':'ListItem', position: i+1, name: s.name, item: s.url }))
  };
}

interface CollectionPageSchemaInput { name:string; itemUrls:string[] }
export function collectionPageSchema({ name, itemUrls }: CollectionPageSchemaInput){
  devAssert(name,'collection name required');
  return {
    '@context':'https://schema.org',
    '@type':'CollectionPage',
    name,
    hasPart: itemUrls.slice(0,50).map(u=>({ '@type':'WebPage', '@id': u }))
  };
}

export type { TaxiServiceSchemaInput, BreadcrumbSegment, CollectionPageSchemaInput };
