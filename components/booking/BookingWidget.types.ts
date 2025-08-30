export interface Location {
  display: string;
  lat?: number;
  lng?: number;
  isAirport?: boolean;
}

export interface PackageOption {
  id: string;
  name: string;
  hours: number;
  kms: number;
  price: number;
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

export type TabType = 'one-way' | 'round-trip' | 'airport' | 'hourly';
export type PickupMode = 'airport' | 'city';

export const HOURLY_PACKAGES: PackageOption[] = [
  { id: '4h40', name: '4 Hours / 40 Kms', hours: 4, kms: 40, price: 1500 },
  { id: '8h80', name: '8 Hours / 80 Kms', hours: 8, kms: 80, price: 2500 },
  { id: '12h120', name: '12 Hours / 120 Kms', hours: 12, kms: 120, price: 3500 },
];

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
    kms: number;
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
