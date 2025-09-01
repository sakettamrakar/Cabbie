// Generate a session token for Google Places API
export const generateSessionToken = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
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
// Fetch location suggestions from our API
export const fetchLocationSuggestions = async (input, sessionToken) => {
    if (input.length < 2) {
        return [];
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
