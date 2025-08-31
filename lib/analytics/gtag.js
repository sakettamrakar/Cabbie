export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || '';
let consentGranted = true;
export function setAnalyticsConsent(granted) { consentGranted = granted; }
function dntEnabled() {
    try {
        return navigator.doNotTrack === '1' || window.doNotTrack === '1';
    }
    catch {
        return false;
    }
}
export function gtag(...args) {
    if (typeof window === 'undefined')
        return;
    if (dntEnabled() || !consentGranted)
        return; // suppress client events
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
    if (typeof window.gtag === 'function') {
        try {
            window.gtag.apply(null, args);
        }
        catch { }
    }
}
export function pageview({ page_path, page_type, origin, destination }) {
    if (!GA4_ID)
        return;
    gtag('event', 'page_view', { page_path, page_type, origin, destination });
}
export function event(name, params = {}) {
    if (!GA4_ID)
        return;
    gtag('event', name, params);
}
