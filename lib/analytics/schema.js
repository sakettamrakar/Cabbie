// Hash utilities (browser & node)
export async function sha256(text) {
    var _a;
    if (typeof window !== 'undefined' && ((_a = window.crypto) === null || _a === void 0 ? void 0 : _a.subtle)) {
        const enc = new TextEncoder().encode(text);
        const hash = await window.crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    else {
        const { createHash } = await import('crypto');
        return createHash('sha256').update(text).digest('hex');
    }
}
