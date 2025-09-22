import type { NextApiRequest, NextApiResponse } from 'next';
import { getMapsLanguage, getMapsRegion, getServerMapsKey, isMapsEnabled } from '../../lib/maps';

const TIMEOUT_MS = 3000;

interface ResolvePlaceRequestBody {
  place_id?: string | null;
  rawText?: string;
  sessionToken?: string;
}

const resolvePlaceFallback = (rawText: string, placeId?: string | null) => ({
  place_id: placeId ?? null,
  address: rawText,
  lat: null,
  lng: null,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { place_id, rawText = '', sessionToken }: ResolvePlaceRequestBody = req.body || {};

  if (!rawText && !place_id) {
    return res.status(400).json({ error: 'place_id or rawText required' });
  }

  if (!isMapsEnabled('server')) {
    return res.status(200).json(resolvePlaceFallback(rawText, place_id));
  }

  const apiKey = getServerMapsKey();
  if (!apiKey) {
    console.warn('Google Maps server key missing; using fallback place resolution');
    return res.status(200).json(resolvePlaceFallback(rawText, place_id));
  }

  if (!place_id) {
    return res.status(200).json(resolvePlaceFallback(rawText));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(place_id)}`);
    url.searchParams.set('languageCode', getMapsLanguage());
    url.searchParams.set('regionCode', getMapsRegion());
    if (sessionToken) {
      url.searchParams.set('sessionToken', sessionToken);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,formattedAddress,location',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('Google Places resolve failed', response.status, await response.text().catch(() => ''));
      return res.status(200).json(resolvePlaceFallback(rawText, place_id));
    }

    const data = await response.json();
    const location = data.location || {};
    const resolved = {
      place_id: data.id ?? place_id ?? null,
      address: data.formattedAddress ?? rawText,
      lat: typeof location.latitude === 'number' ? location.latitude : null,
      lng: typeof location.longitude === 'number' ? location.longitude : null,
    };

    return res.status(200).json(resolved);
  } catch (error) {
    console.warn('Google Places resolve encountered error', error);
    return res.status(200).json(resolvePlaceFallback(rawText, place_id));
  } finally {
    clearTimeout(timeout);
  }
}
