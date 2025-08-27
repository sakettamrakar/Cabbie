// GA4 thin wrapper. Loaded afterInteractive. Safe no-ops if GA not configured.
declare global { interface Window { dataLayer?: any[]; gtag?: (...args:any[])=>void; } }

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || '';

let consentGranted = true;
export function setAnalyticsConsent(granted:boolean){ consentGranted = granted; }

function dntEnabled(){
  try { return (navigator as any).doNotTrack === '1' || (window as any).doNotTrack === '1'; } catch { return false; }
}

export function gtag(...args:any[]){
  if(typeof window==='undefined') return;
  if(dntEnabled() || !consentGranted) return; // suppress client events
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
  if(typeof window.gtag === 'function'){
    try { window.gtag.apply(null,args as any); } catch {}
  }
}

export function pageview({ page_path, page_type, origin, destination }:{ page_path:string; page_type:string; origin?:string; destination?:string }){
  if(!GA4_ID) return;
  gtag('event','page_view',{ page_path, page_type, origin, destination });
}

export function event(name:string, params:Record<string,any>={}){
  if(!GA4_ID) return;
  gtag('event', name, params);
}
