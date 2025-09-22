import { CabOption, SearchQueryParams } from '@/types/search.types';

const BOOKING_STORAGE_KEY = 'raipurtocabs_booking_data';

export interface BookingData {
  selectedCab: CabOption;
  searchParams: SearchQueryParams;
  timestamp: number;
}

// Save booking data to localStorage
export const saveBookingData = (data: Omit<BookingData, 'timestamp'>) => {
  if (typeof window === 'undefined') return;
  
  const bookingData: BookingData = {
    ...data,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingData));};

// Get booking data from localStorage
export const getBookingData = (): BookingData | null => {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem(BOOKING_STORAGE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as BookingData;
  } catch (error) {
    console.error('Error parsing booking data:', error);
    return null;
  }
};

// Clear booking data from localStorage
export const clearBookingData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(BOOKING_STORAGE_KEY);
};

// Check if booking data is valid (less than 1 hour old)
export const isBookingDataValid = (data: BookingData): boolean => {
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  return Date.now() - data.timestamp < ONE_HOUR;
};

// Format price with currency and thousands separator
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

// Format duration from minutes to human-readable format
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
