import { getBrowserMapsKey, getMapsLanguage, getMapsRegion, getServerMapsKey, isMapsEnabled } from '../../../lib/maps';
const TIMEOUT_MS = 3000;
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { input, sessiontoken } = req.query;
    if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: 'Input parameter is required' });
    }
    if (input.length < 2) {
        return res.status(400).json({ error: 'Input must be at least 2 characters' });
    }
    const apiKey = getServerMapsKey() || getBrowserMapsKey();
    if (!apiKey || !isMapsEnabled('server')) {
        // Return empty results instead of hardcoded suggestions
        return res.status(200).json({
            predictions: [],
            status: 'OK'
        });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
        url.searchParams.set('input', input);
        url.searchParams.set('key', apiKey);
        url.searchParams.set('types', 'geocode');
        url.searchParams.set('components', 'country:in');
        url.searchParams.set('language', getMapsLanguage());
        url.searchParams.set('region', getMapsRegion().toLowerCase());
        if (sessiontoken && typeof sessiontoken === 'string') {
            url.searchParams.set('sessiontoken', sessiontoken);
        }
        const response = await fetch(url.toString(), { signal: controller.signal });
        const data = await response.json();
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API error:', data.status);
            return res.status(500).json({ error: 'Failed to fetch suggestions' });
        }
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Error calling Google Places API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        clearTimeout(timeout);
    }
}
