import type { NextApiRequest, NextApiResponse } from 'next';
import { SearchResultsData, CabOption } from '../../types/search.types';

// Mock cab options for demonstration
const MOCK_CAB_OPTIONS: CabOption[] = [
  {
    id: 'hatchback-1',
    category: 'Economy',
    carType: 'hatchback',
    carExamples: ['Maruti Swift', 'Maruti WagonR'],
    capacity: 4,
    features: ['AC', 'Music System', 'Clean Interior'],
    price: 0, // Will be calculated based on distance
    estimatedDuration: '0 mins',
    estimatedDistance: '0 km',
    rating: 4.2,
    totalRides: 1250,
    cancellationPolicy: 'free',
    instantConfirmation: true,
  },
  {
    id: 'sedan-1',
    category: 'Comfort',
    carType: 'sedan',
    carExamples: ['Maruti Swift Dzire', 'Toyota Etios', 'Hyundai Aura'],
    capacity: 4,
    features: ['AC', 'Music System', 'Comfortable Seats', 'Extra Legroom'],
    price: 0, // Will be calculated
    estimatedDuration: '0 mins',
    estimatedDistance: '0 km',
    rating: 4.5,
    totalRides: 890,
    cancellationPolicy: 'flexible',
    instantConfirmation: true,
  },
  {
    id: 'suv-1',
    category: 'Premium — 7 Seater',
    carType: 'suv',
    carExamples: ['Maruti Ertiga'],
    capacity: 7,
    features: ['AC', 'Music System', 'Spacious Interior', 'Premium Comfort', 'Extra Luggage Space'],
    price: 0, // Will be calculated
    estimatedDuration: '0 mins',
    estimatedDistance: '0 km',
    rating: 4.7,
    totalRides: 445,
    cancellationPolicy: 'flexible',
    instantConfirmation: true,
  },
  {
    id: 'luxury-1',
    category: 'Luxury — 7 Seater',
    carType: 'luxury',
    carExamples: ['Toyota Innova'],
    capacity: 7,
    features: ['Premium AC', 'Premium Music System', 'Leather Seats', 'Chauffeur Service', 'Complimentary Water'],
    price: 0, // Will be calculated
    estimatedDuration: '0 mins',
    estimatedDistance: '0 km',
    rating: 4.9,
    totalRides: 156,
    cancellationPolicy: 'strict',
    instantConfirmation: false,
  }
];

// Calculate distance and duration using the new distance matrix API
async function calculateDistanceAndDuration(origin: string, destination: string): Promise<{distance: number, duration: number}> {
  try {
    // Call our new distance matrix API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/distance/matrix?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
    
    if (!response.ok) {
      throw new Error('Distance API failed');
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return {
        distance: data.distance,
        duration: data.duration
      };
    } else {
      throw new Error('No route found');
    }
  } catch (error) {
    console.error('Error calling distance matrix API:', error);
    
    // Fallback to the old method if API fails
    const distance = calculateDistanceFallback(origin, destination);
    const duration = calculateDuration(distance);
    
    return { distance, duration };
  }
}

// Keep the old calculation as a fallback
function calculateDistanceFallback(origin: string, destination: string): number {
  // Enhanced distance calculations based on Chhattisgarh and surrounding areas
  const cityDistances: { [key: string]: number } = {
    // Delhi routes
    'delhi-mumbai': 1400,
    'delhi-bangalore': 2150,
    'delhi-kolkata': 1500,
    'delhi-chennai': 2180,
    'delhi-hyderabad': 1570,
    'delhi-pune': 1420,
    'delhi-ahmedabad': 950,
    'delhi-jaipur': 280,
    'delhi-agra': 230,
    'delhi-lucknow': 550,
    'delhi-raipur': 1130,
    
    // Mumbai routes
    'mumbai-bangalore': 980,
    'mumbai-pune': 150,
    'mumbai-ahmedabad': 530,
    'mumbai-goa': 460,
    'mumbai-chennai': 1340,
    'mumbai-hyderabad': 710,
    'mumbai-kolkata': 1960,
    'mumbai-raipur': 820,
    'mumbai-nagpur': 530,
    
    // Bangalore routes
    'bangalore-chennai': 350,
    'bangalore-hyderabad': 570,
    'bangalore-kochi': 460,
    'bangalore-mysore': 150,
    'bangalore-raipur': 900,
    
    // Central India
    'nagpur-raipur': 290,
    'bhopal-raipur': 350,
    'indore-raipur': 470,
    'jabalpur-raipur': 260,
    
    // CHHATTISGARH COMPREHENSIVE COVERAGE
    
    // Raipur (Capital) - All major connections  
    'raipur-bilaspur': 120,
    'raipur-korba': 200,
    'raipur-durg': 35,
    'raipur-bhilai': 25,
    'raipur-rajnandgaon': 70,
    'raipur-jagdalpur': 300,
    'raipur-ambikapur': 350,
    'raipur-dhamtari': 70,
    'raipur-mahasamund': 60,
    'raipur-gariaband': 90,
    'raipur-balodabazar': 30,
    'raipur-janjgir': 110,
    'raipur-champa': 130,
    'raipur-raigarh': 220,
    'raipur-jashpur': 400,
    'raipur-surajpur': 380,
    'raipur-manendragarh': 420,
    'raipur-bemetara': 40,
    'raipur-mungeli': 80,
    'raipur-sakti': 160,
    'raipur-kondagaon': 200,
    'raipur-narayanpur': 180,
    'raipur-kanker': 140,
    'raipur-bastar': 250,
    'raipur-sukma': 350,
    'raipur-bijapur': 380,
    'raipur-dantewada': 320,
    'raipur-anuppur': 280,
    
    // Bilaspur connections
    'bilaspur-korba': 80,
    'bilaspur-raigarh': 100,
    'bilaspur-janjgir': 45,
    'bilaspur-champa': 25,
    'bilaspur-mungeli': 50,
    'bilaspur-sakti': 60,
    'bilaspur-ambikapur': 230,
    'bilaspur-surajpur': 260,
    'bilaspur-manendragarh': 300,
    'bilaspur-jashpur': 280,
    'bilaspur-anuppur': 160,
    'bilaspur-jabalpur': 380,
    
    // Ambikapur and northern region
    'ambikapur-surajpur': 30,
    'ambikapur-manendragarh': 70,
    'ambikapur-jashpur': 50,
    'ambikapur-raigarh': 170,
    'ambikapur-anuppur': 120,
    'ambikapur-ranchi': 300,
    'ambikapur-patna': 380,
    
    // Korba industrial area
    'korba-raigarh': 180,
    'korba-janjgir': 120,
    'korba-champa': 100,
    'korba-ambikapur': 310,
    'korba-anuppur': 240,
    
    // Durg-Bhilai twin cities
    'durg-bhilai': 10,
    'durg-rajnandgaon': 35,
    'durg-balodabazar': 65,
    'durg-bemetara': 75,
    
    // Jagdalpur and Bastar region
    'jagdalpur-kondagaon': 100,
    'jagdalpur-narayanpur': 120,
    'jagdalpur-kanker': 160,
    'jagdalpur-bastar': 50,
    'jagdalpur-sukma': 50,
    'jagdalpur-bijapur': 80,
    'jagdalpur-dantewada': 70,
    'jagdalpur-hyderabad': 250,
    'jagdalpur-visakhapatnam': 200,
    
    // Border connections
    'raigarh-jharsuguda': 50,
    'raigarh-sambalpur': 80,
    'raigarh-ranchi': 200,
    'anuppur-jabalpur': 120,
    'anuppur-shahdol': 80,
    'jashpur-ranchi': 250,
    
    // Other common routes
    'chennai-hyderabad': 630,
    'kolkata-bhubaneswar': 440,
    'pune-goa': 460,
    'patna-ranchi': 340,
  };
  
  // Normalize city names
  const normalizeCity = (city: string) => city.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
  
  const originKey = normalizeCity(origin);
  const destinationKey = normalizeCity(destination);
  
  // Try both directions
  const route1 = `${originKey}-${destinationKey}`;
  const route2 = `${destinationKey}-${originKey}`;
  
  if (cityDistances[route1]) {
    return cityDistances[route1];
  } else if (cityDistances[route2]) {
    return cityDistances[route2];
  }
  
  // Fallback: estimate based on string similarity and common patterns
  const baseDistance = Math.abs(origin.length - destination.length) * 50;
  const randomFactor = Math.random() * 200 + 300; // 300-500 km base for unknown routes
  return Math.round(baseDistance + randomFactor);
}

// Calculate estimated duration (in minutes)
function calculateDuration(distance: number): number {
  // More realistic average speeds based on Indian road conditions
  let avgSpeed: number;
  
  if (distance < 100) {
    avgSpeed = 35; // City traffic + short highways
  } else if (distance < 500) {
    avgSpeed = 45; // Mix of highways and state roads
  } else if (distance < 1000) {
    avgSpeed = 55; // Mostly highways
  } else {
    avgSpeed = 60; // Long distance highways with stops
  }
  
  const hours = distance / avgSpeed;
  return Math.round(hours * 60); // Convert to minutes
}

// Calculate price based on distance and car type with Chhattisgarh-specific pricing
function calculatePrice(distance: number, carType: string): number {
  // Enhanced pricing structure for Indian taxi services with regional variations
  const pricingStructure = {
    hatchback: {
      baseFare: 150,
      ratePerKm: distance > 300 ? 7 : distance > 100 ? 9 : 11, // Slightly lower for CG region
      nightSurcharge: 0.1,
    },
    sedan: {
      baseFare: 200,
      ratePerKm: distance > 300 ? 9 : distance > 100 ? 11 : 14,
      nightSurcharge: 0.1,
    },
    suv: {
      baseFare: 300,
      ratePerKm: distance > 300 ? 11 : distance > 100 ? 14 : 17,
      nightSurcharge: 0.15,
    },
    luxury: {
      baseFare: 500,
      ratePerKm: distance > 300 ? 16 : distance > 100 ? 20 : 23, // Adjusted for smaller cities
      nightSurcharge: 0.2,
    },
  };
  
  const config = pricingStructure[carType as keyof typeof pricingStructure] || pricingStructure.hatchback;
  
  // Calculate base price
  let totalPrice = config.baseFare + (distance * config.ratePerKm);
  
  // Add driver allowance for long distance (>300km)
  if (distance > 300) {
    const days = Math.ceil(distance / 400); // Assume 400km per day
    totalPrice += days * 500; // ₹500 driver allowance per day
  }
  
  // Add toll charges for highways (adjusted for CG region)
  if (distance > 100) {
    // Lower toll rates for state highways in Chhattisgarh
    const tollRate = distance > 500 ? 0.4 : 0.3; // ₹0.3-0.4 per km for tolls
    totalPrice += Math.round(distance * tollRate);
  }
  
  // Regional price adjustment for Chhattisgarh (slightly lower than metro rates)
  if (distance < 500) {
    totalPrice = totalPrice * 0.95; // 5% discount for regional routes
  }
  
  // Round to nearest 10
  return Math.round(totalPrice / 10) * 10;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Search results API called with:', req.query);
  
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origin, destination, pickup_datetime, passengers, luggage } = req.query;

  // Validate required parameters
  if (!origin || !destination || !pickup_datetime) {
    console.log('Missing required parameters:', { origin, destination, pickup_datetime });
    return res.status(400).json({ 
      error: 'Missing required parameters: origin, destination, pickup_datetime' 
    });
  }

  try {
    console.log('Processing search for:', { origin, destination, pickup_datetime });
    
    // Calculate distance and duration using the enhanced API
    const { distance, duration } = await calculateDistanceAndDuration(origin as string, destination as string);
    
    console.log('Calculated distance and duration:', { distance, duration });
    
    // Generate cab options with calculated prices
    const cabOptions = MOCK_CAB_OPTIONS.map(option => ({
      ...option,
      price: calculatePrice(distance, option.carType),
      estimatedDuration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      estimatedDistance: `${distance} km`,
    }));

    // Filter by passenger capacity if specified
    const passengerCount = passengers ? parseInt(passengers as string) : 1;
    const filteredOptions = cabOptions.filter(option => option.capacity >= passengerCount);
    
    console.log(`Filtered ${filteredOptions.length} options for ${passengerCount} passengers`);

    const searchResults: SearchResultsData = {
      origin: {
        displayName: origin as string,
      },
      destination: {
        displayName: destination as string,
      },
      pickupDateTime: pickup_datetime as string,
      distance: `${distance} km`,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
      cabOptions: filteredOptions,
    };

    console.log('Returning search results:', searchResults);
    res.status(200).json(searchResults);
  } catch (error) {
    console.error('Error generating search results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
