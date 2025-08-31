import { PrismaClient } from '@prisma/client';
import { getQuote } from './quotes';
const prisma = new PrismaClient();
export async function getPricingQuote(args) {
    const { origin_text, destination_text, car_type, discount_code } = args;
    // Attempt to resolve existing route for SEO linking
    const originCity = await prisma.city.findFirst({ where: { slug: origin_text.toLowerCase() } });
    const destCity = await prisma.city.findFirst({ where: { slug: destination_text.toLowerCase() } });
    let route = null;
    if (originCity && destCity) {
        const found = await prisma.route.findFirst({ where: { origin_city_id: originCity.id, destination_city_id: destCity.id } });
        if (found)
            route = { id: found.id };
    }
    const raw = getQuote({ origin_text, destination_text, car_type });
    let fare = raw.fare_quote_inr;
    let applied = null;
    let discount_valid = undefined;
    if (discount_code) {
        const offer = await prisma.offer.findFirst({ where: { code: discount_code.toUpperCase(), active: true } });
        if (offer) {
            const now = Date.now();
            const within = (!offer.valid_from || offer.valid_from.getTime() <= now) && (!offer.valid_to || offer.valid_to.getTime() >= now);
            if (within) {
                if (offer.discount_type === 'FLAT') {
                    const amt = Math.min(fare, offer.value);
                    fare -= amt;
                    applied = { code: offer.code, amount_inr: amt };
                    discount_valid = true;
                }
                else { // PCT
                    const pct = Math.round(fare * (offer.value / 100));
                    const capped = offer.cap_inr ? Math.min(pct, offer.cap_inr) : pct;
                    fare -= capped;
                    applied = { code: offer.code, amount_inr: capped };
                    discount_valid = true;
                }
            }
            else {
                discount_valid = false;
            }
        }
        else {
            discount_valid = false;
        }
    }
    // Night surcharge heuristic 22:00 - 05:00 add 20%
    const pick = new Date(args.pickup_datetime);
    let night = false;
    const hr = pick.getHours();
    if (hr >= 22 || hr < 5) {
        fare = Math.round(fare * 1.2);
        night = true;
    }
    return { route_id: route ? route.id : null, distance_km: raw.distance_km, duration_min: raw.duration_min, fare_base_inr: raw.fare_quote_inr, fare_after_discount_inr: fare, applied_discount: applied, night_surcharge_applied: night, discount_code_attempted: discount_code || null, discount_valid };
}
