export type AnalyticsEventName = 'quote_viewed' | 'otp_sent' | 'otp_verified' | 'booking_created' | 'call_clicked';

// Base analytics parameters aligned with GA4 custom dimensions (event-scoped)
export interface BaseParams { origin?:string; destination?:string; page_type?:string; car_type?:string; fare?:number; phone_hash?:string; payment_mode?:string; booking_id_hash?:string; source?:string; medium?:string; campaign?:string; event_id?:string; }

// Hash utilities (browser & node)
export async function sha256(text:string){
  if(typeof window!=='undefined' && window.crypto?.subtle){
    const enc=new TextEncoder().encode(text);
    const hash=await window.crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  } else {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(text).digest('hex');
  }
}
