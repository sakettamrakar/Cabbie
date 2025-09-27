import { PrismaClient, Booking, City, Route } from '@prisma/client';

export interface SimpleBookingPayload {
  origin: string;
  destination: string;
  pickup_datetime: string;
  return_datetime?: string;
  passengers?: string;
  luggage?: string;
  cab_id: string;
  cab_category?: string;
  cab_type?: string;
  fare: number;
  estimated_duration: string;
  estimated_distance: string;
  passenger_name: string;
  passenger_phone: string;
}

const DEFAULT_STATE = 'Unknown';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'city';
}

function parseCity(raw: string): { name: string; state: string } {
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const name = parts[0] || raw.trim() || 'Unknown City';
  const state = parts[1] || DEFAULT_STATE;
  return { name, state };
}

async function ensureCity(prisma: PrismaClient, raw: string): Promise<City> {
  const { name, state } = parseCity(raw);
  const slug = slugify(name);
  const existing = await prisma.city.findUnique({ where: { slug } });
  if (existing) {
    return existing;
  }
  return prisma.city.create({
    data: {
      name,
      slug,
      state,
      airport_code: null,
      airport_city_slug: null,
      lat: null,
      lon: null,
    },
  });
}

async function ensureRoute(prisma: PrismaClient, origin: City, destination: City): Promise<Route> {
  const existing = await prisma.route.findFirst({
    where: {
      origin_city_id: origin.id,
      destination_city_id: destination.id,
    },
  });
  if (existing) {
    return existing;
  }
  return prisma.route.create({
    data: {
      origin_city_id: origin.id,
      destination_city_id: destination.id,
      is_airport_route: false,
      distance_km: null,
      duration_min: null,
    },
  });
}

export async function persistSimpleBooking(
  prisma: PrismaClient,
  payload: SimpleBookingPayload,
): Promise<Booking> {
  const origin = await ensureCity(prisma, payload.origin);
  const destination = await ensureCity(prisma, payload.destination);
  const route = await ensureRoute(prisma, origin, destination);

  const carType =
    typeof payload.cab_type === 'string' && payload.cab_type.trim().length > 0
      ? payload.cab_type.trim().toUpperCase()
      : 'UNKNOWN';

  return prisma.booking.create({
    data: {
      route_id: route.id,
      origin_text: payload.origin.trim(),
      destination_text: payload.destination.trim(),
      pickup_datetime: new Date(payload.pickup_datetime),
      car_type: carType,
      fare_quote_inr: Math.round(payload.fare),
      fare_locked_inr: Math.round(payload.fare),
      payment_mode: 'COD',
      status: 'PENDING',
      customer_name: payload.passenger_name?.trim() || null,
      customer_phone: payload.passenger_phone,
    },
  });
}
