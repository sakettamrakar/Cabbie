import { extractSessionToken, loadGoogleMapsScript } from './maps-client';
import { getMapsLanguage, getMapsRegion, isMapsEnabled } from './maps';

export interface PlaceData {
  display: string;
  placeId: string;
  lat?: number;
  lng?: number;
  isAirport?: boolean;
  isTransit?: boolean;
  mainText?: string;
  secondaryText?: string;
  types?: string[];
}

export interface PlacesApiResponse {
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    types: string[];
  }>;
  status: string;
}

export interface ResolvePlacePayload {
  placeId?: string | null;
  rawText: string;
  sessionToken?: string;
}

export interface ResolvedPlace {
  place_id: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
}

const RAIPUR_BIAS = { lat: 21.2514, lng: 81.6296, radius: 20000 };

const buildAutocompleteBias = (googleNs: any) => {
  if (!googleNs?.maps?.Circle) {
    return undefined;
  }
  const circle = new googleNs.maps.Circle({
    center: { lat: RAIPUR_BIAS.lat, lng: RAIPUR_BIAS.lng },
    radius: RAIPUR_BIAS.radius,
  });
  return circle.getBounds?.();
};

// Generate a session token for Google Places API (string fallback for legacy flows)
export const generateSessionToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Transform Google Places API response to our PlaceData format
export const transformPlacesResponse = (response: PlacesApiResponse): PlaceData[] => {
  return response.predictions.map(prediction => ({
    display: prediction.description,
    placeId: prediction.place_id,
    mainText: prediction.structured_formatting.main_text,
    secondaryText: prediction.structured_formatting.secondary_text,
    types: prediction.types,
    isAirport: prediction.types.includes('airport'),
    isTransit: prediction.types.includes('transit_station') ||
               prediction.types.includes('subway_station') ||
               prediction.types.includes('train_station'),
  }));
};

const fetchSuggestionsFromService = async (
  input: string,
  sessionToken?: any
): Promise<PlaceData[]> => {
  const googleNs = await loadGoogleMapsScript();
  if (!googleNs?.maps?.places) {
    return [];
  }

  const autocompleteService = new googleNs.maps.places.AutocompleteService();
  const biasBounds = buildAutocompleteBias(googleNs);

  return new Promise((resolve) => {
    const request: any = {
      input,
      sessionToken,
      componentRestrictions: { country: ['in'] },
      language: getMapsLanguage(),
      region: getMapsRegion(),
    };
    if (biasBounds) {
      request.bounds = biasBounds;
    }
    autocompleteService.getPlacePredictions(request, (predictions: any[], status: string) => {
      if (status !== googleNs.maps.places.PlacesServiceStatus.OK || !predictions) {
        resolve([]);
        return;
      }
      const mapped: PlaceData[] = predictions.map((prediction) => ({
        display: prediction.description,
        placeId: prediction.place_id,
        mainText: prediction.structured_formatting?.main_text,
        secondaryText: prediction.structured_formatting?.secondary_text,
        types: prediction.types,
        isAirport: prediction.types?.includes('airport'),
        isTransit: prediction.types?.includes('transit_station') ||
          prediction.types?.includes('subway_station') ||
          prediction.types?.includes('train_station'),
      }));
      resolve(mapped);
    });
  });
};

// Fetch location suggestions from our API (fallback when JS API unavailable)
export const fetchLocationSuggestions = async (
  input: string,
  sessionToken?: string
): Promise<PlaceData[]> => {
  if (input.length < 2) {
    return [];
  }

  if (isMapsEnabled('client')) {
    try {
      const googleNs = await loadGoogleMapsScript();
      if (googleNs?.maps?.places) {
        const tokenObj = sessionToken ? { token: sessionToken } : undefined;
        const results = await fetchSuggestionsFromService(input, tokenObj);
        if (results.length > 0) {
          return results;
        }
      }
    } catch (error) {
      console.warn('Falling back to legacy suggestions after Maps JS failure', error);
    }
  }

  try {
    const url = new URL('/api/places/autocomplete', window.location.origin);
    url.searchParams.set('input', input);
    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PlacesApiResponse = await response.json();
    return transformPlacesResponse(data);
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    throw error;
  }
};

export const resolvePlaceDetails = async (
  payload: ResolvePlacePayload
): Promise<ResolvedPlace> => {
  try {
    const response = await fetch('/api/resolve-place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Resolve place failed: ${response.status}`);
    }

    const data: ResolvedPlace = await response.json();
    return data;
  } catch (error) {
    console.warn('Falling back to raw text for place resolution', error);
    return {
      place_id: payload.placeId ?? null,
      address: payload.rawText,
      lat: null,
      lng: null,
    };
  }
};

export const ensureSessionTokenObject = async (existing?: any) => {
  const googleNs = await loadGoogleMapsScript();
  if (!googleNs?.maps?.places) {
    return { object: undefined, token: undefined };
  }
  const tokenObject = existing || new googleNs.maps.places.AutocompleteSessionToken();
  return {
    object: tokenObject,
    token: extractSessionToken(tokenObject),
  };
};
