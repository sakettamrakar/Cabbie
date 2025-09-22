import type { NextApiRequest, NextApiResponse } from 'next';
import { getQuote } from '../../lib/quotes';
import { getMapsLanguage, getMapsRegion, getServerMapsKey, isMapsEnabled } from '../../lib/maps';

const TIMEOUT_MS = 3000;
const AVG_SPEED_KMPH = 42;

interface CoordinateInput {
  lat?: number | null;
  lng?: number | null;
  address?: string;
}

interface EtaResponse {
  distance_km: number;
  duration_min: number;
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  return null;
};

const haversineDistance = (origin: CoordinateInput, destination: CoordinateInput): number => {
  const R = 6371; // km
  const lat1 = toNumber(origin.lat);
  const lat2 = toNumber(destination.lat);
  const lon1 = toNumber(origin.lng);
  const lon2 = toNumber(destination.lng);

  if (lat1 === null || lat2 === null || lon1 === null || lon2 === null) {
    return 0;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const legacyEta = (origin: CoordinateInput, destination: CoordinateInput): EtaResponse => {
  const originText = origin.address?.trim() ?? '';
  const destinationText = destination.address?.trim() ?? '';

  if (originText && destinationText) {
    try {
      const quote = getQuote({ origin_text: originText, destination_text: destinationText, car_type: 'HATCHBACK' });
      return {
        distance_km: quote.distance_km,
        duration_min: quote.duration_min,
      };
    } catch (error) {
      console.warn('Legacy quote lookup failed, falling back to haversine', error);
    }
  }

  const distance = haversineDistance(origin, destination);
  if (distance === 0) {
    return { distance_km: 0, duration_min: 0 };
  }

  const durationHours = distance / AVG_SPEED_KMPH;
  return {
    distance_km: Number(distance.toFixed(1)),
    duration_min: Math.max(1, Math.round(durationHours * 60)),
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origin = {}, destination = {} } = (req.body || {}) as { origin?: CoordinateInput; destination?: CoordinateInput };

  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin and destination required' });
  }

  if (!isMapsEnabled('server')) {
    return res.status(200).json(legacyEta(origin, destination));
  }

  const apiKey = getServerMapsKey();
  if (!apiKey) {
    console.warn('Routes API server key missing; using legacy ETA');
    return res.status(200).json(legacyEta(origin, destination));
  }

  const latOk = toNumber(origin.lat) !== null && toNumber(origin.lng) !== null &&
    toNumber(destination.lat) !== null && toNumber(destination.lng) !== null;

  if (!latOk) {
    return res.status(200).json(legacyEta(origin, destination));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.legs',
      },
      body: JSON.stringify({
        origin: {
          location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
        },
        destination: {
          location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        departureTime: new Date().toISOString(),
        languageCode: getMapsLanguage(),
        regionCode: getMapsRegion(),
        computeAlternativeRoutes: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('Routes API request failed', response.status, await response.text().catch(() => ''));
      return res.status(200).json(legacyEta(origin, destination));
    }

    const data = await response.json();
    const route = data.routes?.[0];
    const leg = route?.legs?.[0];

    if (!route || !leg) {
      console.warn('Routes API returned empty payload');
      return res.status(200).json(legacyEta(origin, destination));
    }

    const distanceMeters = typeof route.distanceMeters === 'number'
      ? route.distanceMeters
      : typeof leg.distanceMeters === 'number'
        ? leg.distanceMeters
        : null;

    const durationString = leg.duration || route.duration;

    const distanceKm = distanceMeters ? distanceMeters / 1000 : 0;
    let durationMin = 0;
    if (typeof durationString === 'string' && durationString.endsWith('s')) {
      const seconds = Number(durationString.replace('s', ''));
      if (!Number.isNaN(seconds)) {
        durationMin = Math.max(1, Math.round(seconds / 60));
      }
    }

    if (!distanceMeters || durationMin === 0) {
      return res.status(200).json(legacyEta(origin, destination));
    }

    return res.status(200).json({
      distance_km: Number((distanceKm).toFixed(1)),
      duration_min: durationMin,
    });
  } catch (error) {
    console.warn('Routes API threw error', error);
    return res.status(200).json(legacyEta(origin, destination));
  } finally {
    clearTimeout(timeout);
  }
}
