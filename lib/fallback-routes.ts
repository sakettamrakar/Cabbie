// Fallback data generation for programmatic routes
import { SITE_BRAND } from './seo';

export interface FallbackRouteData {
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  fares: Array<{ car_type: string; base: number }>;
  highlights: string[];
  faqs: Array<{ q: string; a: string }>;
  related: Array<{ origin: string; destination: string }>;
  routeId: number;
}

/**
 * Generate fallback route data using distance matrix and programmatic content
 */
export function generateFallbackRouteData(origin: string, destination: string): FallbackRouteData | null {
  const distance = getDistanceFromMatrix(origin, destination);
  if (!distance) return null;

  const duration = calculateDuration(distance);
  const baseFare = calculateBaseFare(distance);
  
  return {
    origin,
    destination,
    distance,
    duration,
    fares: [
      { car_type: 'HATCHBACK', base: baseFare },
      { car_type: 'SEDAN', base: Math.round(baseFare * 1.3) },
      { car_type: 'SUV', base: Math.round(baseFare * 1.7) },
      { car_type: 'LUXURY', base: Math.round(baseFare * 2.4) }
    ],
    highlights: generateHighlights(origin, destination, distance),
    faqs: generateFAQs(origin, destination, distance, baseFare),
    related: generateRelatedRoutes(origin, destination),
    routeId: generateRouteId(origin, destination)
  };
}

/**
 * Get distance from comprehensive distance matrix
 */
function getDistanceFromMatrix(origin: string, destination: string): number | null {
  const routes: Record<string, number> = {
    // Chhattisgarh routes
    'raipur-bilaspur': 120, 'raipur-ambikapur': 350, 'raipur-durg': 35,
    'raipur-bhilai': 25, 'raipur-korba': 200, 'raipur-jagdalpur': 300,
    'ambikapur-surajpur': 30, 'bilaspur-korba': 85, 'durg-bhilai': 10,
    'manendragarh-anuppur': 110,
    
    // Cross-state routes  
    'raipur-delhi': 1130, 'raipur-mumbai': 820, 'raipur-kolkata': 480,
    'raipur-bangalore': 900, 'raipur-hyderabad': 400,
    
    // Major routes
    'patna-ranchi': 340, 'delhi-mumbai': 1400, 'bangalore-chennai': 350,
  };

  const key = `${origin}-${destination}`;
  const reverseKey = `${destination}-${origin}`;
  
  return routes[key] || routes[reverseKey] || null;
}

function calculateDuration(distance: number): number {
  if (distance <= 50) return Math.round(distance * 1.5); // ~40 km/h
  if (distance <= 200) return Math.round(distance * 1.2); // ~50 km/h  
  if (distance <= 500) return Math.round(distance * 1.0); // ~60 km/h
  return Math.round(distance * 0.9); // ~65 km/h
}

function calculateBaseFare(distance: number): number {
  const baseRate = 10; // ₹10 per km
  let fare = distance * baseRate;
  
  // Add toll for longer routes
  if (distance > 100) {
    fare += distance * 2;
  }
  
  // Apply Chhattisgarh discount (5%)
  fare = Math.round(fare * 0.95);
  
  // Minimum fare
  fare = Math.max(fare, 300);
  
  return Math.round(fare / 10) * 10;
}

function generateHighlights(origin: string, destination: string, distance: number): string[] {
  const base = [
    `Professional drivers with ${origin} to ${destination} route expertise`,
    '24/7 customer support and live GPS tracking',
    'All-inclusive pricing with tolls and taxes included'
  ];

  if (distance > 100) {
    base.push('Scheduled rest breaks for passenger comfort');
  }

  if (distance > 300) {
    base.push('Overnight parking and driver accommodation handled');
  }

  return base;
}

function generateFAQs(origin: string, destination: string, distance: number, fare: number): Array<{ q: string; a: string }> {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  return [
    {
      q: `What is the distance from ${cap(origin)} to ${cap(destination)}?`,
      a: `The distance from ${cap(origin)} to ${cap(destination)} is approximately ${distance} km via the most efficient route.`
    },
    {
      q: `How much does a taxi cost from ${cap(origin)} to ${cap(destination)}?`,
      a: `Taxi fare from ${cap(origin)} to ${cap(destination)} starts from ₹${fare} for economy cars. The price includes tolls, taxes, and driver charges.`
    },
    {
      q: `How long does it take to travel from ${cap(origin)} to ${cap(destination)}?`,
      a: `The journey from ${cap(origin)} to ${cap(destination)} typically takes ${Math.floor(calculateDuration(distance)/60)} hours, depending on traffic and road conditions.`
    },
    {
      q: `Are there any additional charges for ${cap(origin)} to ${cap(destination)} taxi?`,
      a: `No, our taxi fares are all-inclusive. The quoted price covers tolls, state taxes, driver charges, and fuel. No hidden charges.`
    }
  ];
}

function generateRelatedRoutes(origin: string, destination: string): Array<{ origin: string; destination: string }> {
  // Simple related routes logic
  const commonRoutes = [
    { origin: 'raipur', destination: 'bilaspur' },
    { origin: 'raipur', destination: 'durg' },
    { origin: 'delhi', destination: 'mumbai' },
    { origin: 'bangalore', destination: 'chennai' }
  ];

  return commonRoutes
    .filter(r => r.origin !== origin || r.destination !== destination)
    .slice(0, 3);
}

function generateRouteId(origin: string, destination: string): number {
  // Generate a consistent ID based on route
  let hash = 0;
  const str = `${origin}-${destination}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100000 + 10000; // 5-digit ID
}
