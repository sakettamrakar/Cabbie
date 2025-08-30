import { z } from 'zod';
// Core entity schemas
export const CitySchema = z.object({ id: z.number().int().positive().optional(), name: z.string().min(2), slug: z.string().min(2), state: z.string().min(2), airport_code: z.string().optional().nullable() });
export const RouteSchema = z.object({ id: z.number().int().positive().optional(), origin_city_id: z.number().int().positive(), destination_city_id: z.number().int().positive(), distance_km: z.number().positive().nullable().optional(), duration_min: z.number().int().positive().nullable().optional(), is_active: z.boolean().optional() });
export const FareSchema = z.object({ id: z.number().int().positive().optional(), route_id: z.number().int().positive(), car_type: z.enum(['HATCHBACK', 'SEDAN', 'SUV']), base_fare_inr: z.number().int().nonnegative(), night_surcharge_pct: z.number().int().min(0).max(200).optional() });
export const BookingSchema = z.object({ id: z.number().int().positive().optional(), route_id: z.number().int().positive(), origin_text: z.string().min(2), destination_text: z.string().min(2), pickup_datetime: z.preprocess(v => new Date(String(v)), z.date()), car_type: z.enum(['HATCHBACK', 'SEDAN', 'SUV']), fare_quote_inr: z.number().int().nonnegative(), payment_mode: z.enum(['COD', 'ONLINE']).default('COD'), status: z.enum(['PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED']).default('PENDING'), customer_name: z.string().optional().nullable(), customer_phone: z.string().min(6), discount_code: z.string().optional().nullable() });
// Request body schemas per endpoint (subset examples)
export const AdminLoginSchema = z.object({ email: z.string().email(), password: z.string().min(4) });
export const CreateRouteBody = RouteSchema.omit({ id: true });
export const UpdateRouteBody = RouteSchema.partial().omit({ origin_city_id: true, destination_city_id: true });
export const CreateFareBody = FareSchema.omit({ id: true });
export const BulkFareAdjustBody = z.object({ car_type: z.enum(['HATCHBACK', 'SEDAN', 'SUV']), mode: z.enum(['PCT', 'DELTA', 'SET']), value: z.number() });
export const OfferBody = z.object({ code: z.string().min(3), title: z.string().optional().nullable(), description: z.string().optional().nullable(), discount_type: z.enum(['FLAT', 'PCT']), value: z.number().int().nonnegative(), cap_inr: z.number().int().positive().nullable().optional(), valid_from: z.string().datetime().nullable().optional(), valid_to: z.string().datetime().nullable().optional(), active: z.boolean().optional(), conditions: z.any().nullable().optional() });
export const BookingQuoteInput = z.object({
    origin_text: z.string().min(2).max(200),
    destination_text: z.string().min(2).max(200),
    pickup_datetime: z.string().datetime().refine(v => {
        const d = new Date(v);
        return d.getTime() > Date.now();
    }, 'pickup must be in future'),
    car_type: z.enum(['HATCHBACK', 'SEDAN', 'SUV']),
    discount_code: z.string().min(2).max(32).optional().nullable()
});
export const OTPIssueBody = z.object({ phone: z.string().regex(/^[0-9]{10}$/, 'phone must be 10 digits') });
export const OTPVerifyBody = z.object({ phone: z.string().regex(/^[0-9]{10}$/, 'phone must be 10 digits'), otp: z.string().length(4) });
