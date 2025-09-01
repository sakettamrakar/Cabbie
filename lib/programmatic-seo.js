// Programmatic SEO service for generating route pages from distance matrix
/**
 * Extract all available routes from the distance matrix
 */
export function getAllAvailableRoutes() {
    const routes = [];
    // This would normally read from the distance matrix file
    // For now, we'll use the comprehensive Chhattisgarh routes we know exist
    const knownRoutes = [
        // Major Chhattisgarh routes
        { origin: 'raipur', destination: 'bilaspur', distance: 120 },
        { origin: 'raipur', destination: 'ambikapur', distance: 350 },
        { origin: 'raipur', destination: 'durg', distance: 35 },
        { origin: 'raipur', destination: 'bhilai', distance: 25 },
        { origin: 'raipur', destination: 'korba', distance: 200 },
        { origin: 'raipur', destination: 'jagdalpur', distance: 300 },
        { origin: 'ambikapur', destination: 'surajpur', distance: 30 },
        { origin: 'bilaspur', destination: 'korba', distance: 85 },
        { origin: 'durg', destination: 'bhilai', distance: 10 },
        { origin: 'manendragarh', destination: 'anuppur', distance: 110 },
        // Cross-state routes
        { origin: 'raipur', destination: 'delhi', distance: 1130 },
        { origin: 'raipur', destination: 'mumbai', distance: 820 },
        { origin: 'raipur', destination: 'kolkata', distance: 480 },
        { origin: 'raipur', destination: 'bangalore', distance: 900 },
        { origin: 'raipur', destination: 'hyderabad', distance: 400 },
        // Regional routes
        { origin: 'patna', destination: 'ranchi', distance: 340 },
        { origin: 'delhi', destination: 'mumbai', distance: 1400 },
        { origin: 'bangalore', destination: 'chennai', distance: 350 },
    ];
    knownRoutes.forEach(({ origin, destination, distance }) => {
        const duration = calculateDuration(distance);
        const estimatedFare = calculateEstimatedFare(distance);
        // Add main route
        routes.push({
            origin,
            destination,
            distance,
            duration,
            estimatedFare,
            features: getRouteFeatures(distance),
            isAvailable: true
        });
        // Add reverse route if different
        if (origin !== destination) {
            routes.push({
                origin: destination,
                destination: origin,
                distance,
                duration,
                estimatedFare,
                features: getRouteFeatures(distance),
                isAvailable: true
            });
        }
    });
    return routes;
}
/**
 * Generate SEO-optimized information for a specific route
 */
export function generateSEOForRoute(origin, destination) {
    const routes = getAllAvailableRoutes();
    const route = routes.find(r => r.origin === origin && r.destination === destination);
    if (!route) {
        return null;
    }
    const originCap = capitalize(origin);
    const destCap = capitalize(destination);
    return {
        route,
        title: `${originCap} to ${destCap} Taxi | Book One Way Cab from ₹${route.estimatedFare}`,
        metaDescription: `Book ${originCap} to ${destCap} cab at fixed fare ₹${route.estimatedFare}. ${route.distance}km, ${Math.floor(route.duration / 60)}h journey. Toll & GST included, doorstep pickup.`,
        h1: `${originCap} to ${destCap} Taxi Service`,
        h2: `Book ${originCap} to ${destCap} Cab - Fixed Fare ₹${route.estimatedFare}`,
        h3: `Why Choose ${originCap} to ${destCap} Taxi?`,
        canonical: `https://www.example.com/${origin}/${destination}/fare`,
        alternateUrl: `https://www.example.com/${destination}/${origin}/fare`
    };
}
/**
 * Calculate estimated duration based on distance (Indian road conditions)
 */
function calculateDuration(distance) {
    if (distance <= 50)
        return distance * 1.5; // City/local roads: ~40 km/h
    if (distance <= 200)
        return distance * 1.2; // State highways: ~50 km/h  
    if (distance <= 500)
        return distance * 1.0; // National highways: ~60 km/h
    return distance * 0.9; // Expressways: ~65 km/h
}
/**
 * Calculate estimated fare based on distance (economy category)
 */
function calculateEstimatedFare(distance) {
    const baseRate = 10; // ₹10 per km for economy
    let fare = distance * baseRate;
    // Add toll charges for longer routes
    if (distance > 100) {
        fare += distance * 2; // ₹2 per km toll
    }
    // Minimum fare
    fare = Math.max(fare, 300);
    // Round to nearest 10
    return Math.round(fare / 10) * 10;
}
/**
 * Get relevant features based on route distance
 */
function getRouteFeatures(distance) {
    const baseFeatures = ['Professional Driver', '24/7 Support', 'GPS Tracking'];
    if (distance > 100) {
        baseFeatures.push('Toll Included', 'Rest Breaks');
    }
    if (distance > 300) {
        baseFeatures.push('Overnight Parking', 'Driver Allowance');
    }
    return baseFeatures;
}
/**
 * Capitalize first letter of string
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
/**
 * Generate all possible route combinations for sitemap
 */
export function generateAllRouteSlugs() {
    const routes = getAllAvailableRoutes();
    return routes.map(r => ({ origin: r.origin, destination: r.destination }));
}
/**
 * Check if a route exists in our data
 */
export function routeExists(origin, destination) {
    const routes = getAllAvailableRoutes();
    return routes.some(r => r.origin === origin && r.destination === destination);
}
/**
 * Get related routes for a given route (same origin or destination)
 */
export function getRelatedRoutes(origin, destination, limit = 5) {
    const routes = getAllAvailableRoutes();
    const related = routes.filter(r => (r.origin === origin && r.destination !== destination) ||
        (r.destination === destination && r.origin !== origin) ||
        (r.origin === destination && r.destination !== origin) // reverse route
    );
    return related.slice(0, limit);
}
