export type CarType = 'hatchback' | 'sedan' | 'suv' | 'luxury' | 'minivan';

export interface CabOption {
  id: string;
  category: string;
  carType: CarType;
  carExamples: string[];
  capacity: number;
  features: string[];
  price: number;
  estimatedDuration: string;
  estimatedDistance: string;
  imageUrl?: string;
  rating?: number;
  totalRides?: number;
  cancellationPolicy: 'free' | 'flexible' | 'strict';
  instantConfirmation: boolean;
}

export interface SearchResultsData {
  origin: {
    displayName: string;
    coordinates?: [number, number];
  };
  destination: {
    displayName: string;
    coordinates?: [number, number];
  };
  pickupDateTime: string;
  distance: string;
  duration: string;
  cabOptions: CabOption[];
}

export interface SearchQueryParams {
  origin: string;
  destination: string;
  pickup_datetime: string;
  return_datetime?: string;
  passengers?: string;
  luggage?: string;
  car_type?: CarType;
  min_price?: string;
  max_price?: string;
  min_capacity?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'capacity_asc' | 'capacity_desc';
}

export interface SearchFilters {
  carTypes: CarType[];
  priceRange: [number, number];
  minCapacity: number;
  instantConfirmation: boolean;
  freeCancellation: boolean;
}

export interface SortOption {
  id: string;
  label: string;
  value: 'price_asc' | 'price_desc' | 'capacity_asc' | 'capacity_desc';
}

export interface SearchResultsProps {
  initialData: SearchResultsData | null;
  searchParams: SearchQueryParams;
}
