import '../styles/unified-design.css';
import '../styles/professional.css';
import { useEffect } from 'react';
import Script from 'next/script';
import { GA4_ID, pageview, setAnalyticsConsent } from '../lib/analytics/gtag';
import { useRouter } from 'next/router';
export default function MyApp({ Component, pageProps }) {
    const router = useRouter();
    useEffect(() => {
        // Load the Inter font
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
        fontLink.rel = 'stylesheet';
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            document.head.appendChild(fontLink);
        }
        
        const id = 'late-css';
        if (!document.getElementById(id)) {
            const l = document.createElement('link');
            l.id = id;
            l.rel = 'stylesheet';
            l.href = '/styles/late.css';
            document.head.appendChild(l);
        }
    }, []);
    // Track page views (manual because send_page_view:false)
    useEffect(() => {
        if (!GA4_ID)
            return;
        const handleRoute = (url) => {
            const page_type = inferPageTypeFromPath(url);
            const parts = url.split('?')[0].split('/').filter(Boolean);
            const origin = parts[0];
            const destination = parts[1];
            pageview({ page_path: url, page_type, origin, destination });
        };
        handleRoute(router.asPath); // first render
        router.events.on('routeChangeComplete', handleRoute);
        return () => { router.events.off('routeChangeComplete', handleRoute); };
    }, [router.asPath, router.events]);
    useEffect(() => {
        // Initialize consent from cookie if banner already accepted earlier (mirrors banner logic)
        try {
            const c = document.cookie.split('; ').find(c => c.startsWith('a_consent='));
            if (c)
                setAnalyticsConsent(c.endsWith('yes'));
        }
        catch { }
    }, []);
    return <>
    {GA4_ID && <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive"/>}
    {GA4_ID && <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function g(){dataLayer.push(arguments);}window.gtag=g;g('js', new Date());g('config','${GA4_ID}',{ send_page_view:false });`}</Script>}
    <Component {...pageProps}/>
  </>;
}
// Infer page type from pathname heuristics
function inferPageTypeFromPath(pathname) {
    if (/\/booking/.test(pathname))
        return 'booking';
    if (/\/seo\//.test(pathname))
        return 'seo';
    if (/\/fare$/.test(pathname))
        return 'fare';
    return 'other';
}
function getSlug(kind) {
    try {
        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
            if (kind === 'origin')
                return parts[0];
            if (kind === 'destination')
                return parts[1];
        }
    }
    catch { }
    return undefined;
}
export function reportWebVitals(metric) {
    var _a;
    try {
        const payload = { metric: metric.name, value: metric.value, page_type: inferPageTypeFromPath(window.location.pathname), origin: getSlug('origin'), destination: getSlug('destination'), ts: Date.now() };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        (_a = navigator.sendBeacon) === null || _a === void 0 ? void 0 : _a.call(navigator, '/api/v1/rum', blob);
    }
    catch { /* swallow */ }
}
