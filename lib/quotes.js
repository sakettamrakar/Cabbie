// Simple programmatic fare quote utility.
// getQuote({ origin_text, destination_text, car_type }) -> { fare_quote_inr, distance_km, duration_min }
// Distances are mocked (must stay in sync with seeded routes). If a pair is missing, a fallback heuristic is used.
// Mock distance/duration matrix (km, minutes)
// NOTE: Add both directions for asymmetric lookups.
const ROUTE_MATRIX = {
    'raipur|bilaspur': { d: 120, t: 150 }, 'bilaspur|raipur': { d: 120, t: 150 },
    'raipur|bhilai': { d: 35, t: 60 }, 'bhilai|raipur': { d: 35, t: 60 },
    'raipur|durg': { d: 40, t: 70 }, 'durg|raipur': { d: 40, t: 70 },
    'raipur|rajnandgaon': { d: 75, t: 120 }, 'rajnandgaon|raipur': { d: 75, t: 120 },
    'raipur|raigarh': { d: 250, t: 300 }, 'raigarh|raipur': { d: 250, t: 300 },
    'raipur|korba': { d: 200, t: 240 }, 'korba|raipur': { d: 200, t: 240 },
    'raipur|jagdalpur': { d: 280, t: 420 }, 'jagdalpur|raipur': { d: 280, t: 420 },
    'raipur|nagpur': { d: 290, t: 360 }, 'nagpur|raipur': { d: 290, t: 360 },
    'raipur|vizag': { d: 530, t: 660 }, 'vizag|raipur': { d: 530, t: 660 },
};
function norm(s) { return s.trim().toLowerCase(); }
function baseFare(distanceKm) {
    // Base fare formula (aligning with seed): distance * 12 + 100 rounded.
    return Math.round(distanceKm * 12 + 100);
}
function applyCarTypeMultiplier(base, car_type) {
    switch (car_type) {
        case 'SEDAN': return Math.round(base * 1.20);
        case 'SUV': return Math.round(base * 1.60);
        default: return base; // HATCHBACK or unknown -> base
    }
}
export function getQuote({ origin_text, destination_text, car_type }) {
    const o = norm(origin_text);
    const d = norm(destination_text);
    const key = `${o}|${d}`;
    let rec = ROUTE_MATRIX[key];
    if (!rec) {
        // Fallback heuristic: approximate distance via string length diff * 5 + 80 (arbitrary), duration  = distance * 1.25 minutes.
        const approxDist = 80 + Math.abs(o.length - d.length) * 5;
        rec = { d: approxDist, t: Math.round(approxDist * 1.25) };
    }
    const base = baseFare(rec.d);
    const fare_quote_inr = applyCarTypeMultiplier(base, car_type);
    return { fare_quote_inr, distance_km: rec.d, duration_min: rec.t };
}
// Example (dev only):
// console.log(getQuote({ origin_text:'Raipur', destination_text:'Bilaspur', car_type:'SEDAN' }));
