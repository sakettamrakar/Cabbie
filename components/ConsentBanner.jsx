import { useEffect, useState } from 'react';
import { setAnalyticsConsent } from '../lib/analytics/gtag';
export default function ConsentBanner() {
    const [show, setShow] = useState(false);
    useEffect(() => {
        if (typeof document === 'undefined')
            return;
        const existing = document.cookie.split('; ').find(c => c.startsWith('a_consent='));
        if (!existing) {
            setShow(true);
        }
        else {
            setAnalyticsConsent(existing.endsWith('yes'));
        }
    }, []);
    function choose(v) {
        setAnalyticsConsent(v);
        const exp = 180 * 24 * 60 * 60; // 180d
        document.cookie = `a_consent=${v ? 'yes' : 'no'}; Path=/; Max-Age=${exp}; SameSite=Lax`;
        setShow(false);
    }
    useEffect(() => {
        if (!show)
            return;
        function onKey(e) {
            if (e.key === 'Escape') {
                setShow(false);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show]);
    if (!show)
        return null;
    return <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, background: '#0d1117', color: '#fff', padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 14 }} role="dialog" aria-modal="true" aria-label="Analytics consent">
    <span style={{ flex: 1, minWidth: 200 }}>We use minimal analytics (GA4) to improve the service. Accept?</span>
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => choose(true)} style={btn}>Accept</button>
      <button onClick={() => choose(false)} style={{ ...btn, background: '#555' }}>Decline</button>
    </div>
  </div>;
}
const btn = { background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' };
