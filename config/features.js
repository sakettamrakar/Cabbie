const coerce = (value, fallback) => {
    if (value === undefined) {
        return fallback;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === '') {
        return fallback;
    }
    return !['false', '0', 'off', 'disabled', 'no'].includes(normalized);
};
export const features = {
    roofCarrierUI: coerce(process.env.NEXT_PUBLIC_FEATURE_ROOF_CARRIER_UI, true),
    recentSearches: coerce(process.env.NEXT_PUBLIC_FEATURE_RECENT_SEARCHES, true),
};
