import { extractSessionToken, loadGoogleMapsScript } from './maps-client';
import { getMapsLanguage, getMapsRegion, isMapsEnabled } from './maps';
const RAIPUR_BIAS = { lat: 21.2514, lng: 81.6296, radius: 20000 };
const buildAutocompleteBias = (googleNs) => {
    var _a, _b;
    if (!((_a = googleNs === null || googleNs === void 0 ? void 0 : googleNs.maps) === null || _a === void 0 ? void 0 : _a.Circle)) {
        return undefined;
    }
    const circle = new googleNs.maps.Circle({
        center: { lat: RAIPUR_BIAS.lat, lng: RAIPUR_BIAS.lng },
        radius: RAIPUR_BIAS.radius,
    });
    return (_b = circle.getBounds) === null || _b === void 0 ? void 0 : _b.call(circle);
};
// Generate a session token for Google Places API (string fallback for legacy flows)
export const generateSessionToken = () => {
    return (Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15));
};
// Transform Google Places API response to our PlaceData format
export const transformPlacesResponse = (response) => {
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
const fetchSuggestionsFromService = async (input, sessionToken) => {
    var _a;
    const googleNs = await loadGoogleMapsScript();
    if (!((_a = googleNs === null || googleNs === void 0 ? void 0 : googleNs.maps) === null || _a === void 0 ? void 0 : _a.places)) {
        return [];
    }
    const autocompleteService = new googleNs.maps.places.AutocompleteService();
    const biasBounds = buildAutocompleteBias(googleNs);
    return new Promise((resolve) => {
        const request = {
            input,
            sessionToken,
            componentRestrictions: { country: ['in'] },
            language: getMapsLanguage(),
            region: getMapsRegion(),
        };
        if (biasBounds) {
            request.bounds = biasBounds;
        }
        autocompleteService.getPlacePredictions(request, (predictions, status) => {
            if (status !== googleNs.maps.places.PlacesServiceStatus.OK || !predictions) {
                resolve([]);
                return;
            }
            const mapped = predictions.map((prediction) => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    display: prediction.description,
                    placeId: prediction.place_id,
                    mainText: (_a = prediction.structured_formatting) === null || _a === void 0 ? void 0 : _a.main_text,
                    secondaryText: (_b = prediction.structured_formatting) === null || _b === void 0 ? void 0 : _b.secondary_text,
                    types: prediction.types,
                    isAirport: (_c = prediction.types) === null || _c === void 0 ? void 0 : _c.includes('airport'),
                    isTransit: ((_d = prediction.types) === null || _d === void 0 ? void 0 : _d.includes('transit_station')) ||
                        ((_e = prediction.types) === null || _e === void 0 ? void 0 : _e.includes('subway_station')) ||
                        ((_f = prediction.types) === null || _f === void 0 ? void 0 : _f.includes('train_station')),
                });
            });
            resolve(mapped);
        });
    });
};
// Fetch location suggestions from our API (fallback when JS API unavailable)
export const fetchLocationSuggestions = async (input, sessionToken) => {
    var _a;
    if (input.length < 2) {
        return [];
    }
    if (isMapsEnabled('client')) {
        try {
            const googleNs = await loadGoogleMapsScript();
            if ((_a = googleNs === null || googleNs === void 0 ? void 0 : googleNs.maps) === null || _a === void 0 ? void 0 : _a.places) {
                const tokenObj = sessionToken ? { token: sessionToken } : undefined;
                const results = await fetchSuggestionsFromService(input, tokenObj);
                if (results.length > 0) {
                    return results;
                }
            }
        }
        catch (error) {
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
        const data = await response.json();
        return transformPlacesResponse(data);
    }
    catch (error) {
        console.error('Error fetching location suggestions:', error);
        throw error;
    }
};
export const resolvePlaceDetails = async (payload) => {
    var _a;
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
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.warn('Falling back to raw text for place resolution', error);
        return {
            place_id: (_a = payload.placeId) !== null && _a !== void 0 ? _a : null,
            address: payload.rawText,
            lat: null,
            lng: null,
        };
    }
};
export const ensureSessionTokenObject = async (existing) => {
    var _a;
    const googleNs = await loadGoogleMapsScript();
    if (!((_a = googleNs === null || googleNs === void 0 ? void 0 : googleNs.maps) === null || _a === void 0 ? void 0 : _a.places)) {
        return { object: undefined, token: undefined };
    }
    const tokenObject = existing || new googleNs.maps.places.AutocompleteSessionToken();
    return {
        object: tokenObject,
        token: extractSessionToken(tokenObject),
    };
};
