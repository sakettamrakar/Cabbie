export type TabType = 'one-way' | 'round-trip' | 'airport' | 'hourly';
export type PickupMode = 'airport' | 'city';

export interface PlaceData {
  display: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  isAirport?: boolean;
  isTransit?: boolean;
  mainText?: string;
  secondaryText?: string;
  types?: string[];
}

export interface PackageOption {
  id: string;
  name: string;
  hours: number;
  distance: number;
  price: number;
}

export interface BookingFormData {
  tripType: TabType;
  pickup: PlaceData;
  drop: PlaceData;
  stops: PlaceData[];
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  passengers: number;
  luggage: number;
  selectedPackage: string;
  pickupMode: PickupMode;
  flightNumber: string;
}

export interface FormErrors {
  pickup?: string;
  drop?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  flightNumber?: string;
  general?: string;
}

export const HOURLY_PACKAGES: PackageOption[] = [
  { id: '4h-40km', name: '4 Hours / 40 KM', hours: 4, distance: 40, price: 1499 },
  { id: '8h-80km', name: '8 Hours / 80 KM', hours: 8, distance: 80, price: 2499 },
  { id: '12h-120km', name: '12 Hours / 120 KM', hours: 12, distance: 120, price: 3499 },
];

export const PASSENGER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1);
export const LUGGAGE_OPTIONS = Array.from({ length: 5 }, (_, i) => i);

/**
 * Example payload structure for /api/quotes
 */
export interface QuoteRequest {
  // Trip details
  trip_type: TabType;
  pickup: string;
  pickup_lat?: number;
  pickup_lng?: number;
  drop: string;
  drop_lat?: number;
  drop_lng?: number;
  pickup_date: string;  // YYYY-MM-DD
  pickup_time: string;  // HH:MM
  
  // Round-trip specific
  return_date?: string; // YYYY-MM-DD
  return_time?: string; // HH:MM
  
  // Airport specific
  pickup_mode?: PickupMode;
  flight_number?: string;
  
  // Hourly specific
  package?: {
    id: string;
    hours: number;
    distance: number;
  };
  
  // Passenger info
  passengers: number;
  luggage: number;
  
  // Metadata
  user_agent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}
