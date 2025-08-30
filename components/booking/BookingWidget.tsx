'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Format date as YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];
// Format time as HH:MM
const formatTime = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

type TabType = 'one-way' | 'round-trip' | 'airport' | 'hourly';

interface Location {
  display: string;
  lat?: number;
  lng?: number;
  isAirport?: boolean;
}

interface Package {
  id: string;
  name: string;
  hours: number;
  kms: number;
  price: number;
}

const HOURLY_PACKAGES: Package[] = [
  { id: '4h40', name: '4 Hours / 40 Kms', hours: 4, kms: 40, price: 1500 },
  { id: '8h80', name: '8 Hours / 80 Kms', hours: 8, kms: 80, price: 2500 },
  { id: '12h120', name: '12 Hours / 120 Kms', hours: 12, kms: 120, price: 3500 },
];

export default function BookingWidget() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('one-way');
  const [formValid, setFormValid] = useState(false);
  
  // Form state
  const [pickup, setPickup] = useState<Location>({ display: '' });
  const [drop, setDrop] = useState<Location>({ display: '' });
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupMode, setPickupMode] = useState<'airport' | 'city'>('city');
  const [flightNumber, setFlightNumber] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string>(HOURLY_PACKAGES[0].id);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(1);

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('bookingFormData');
    if (savedData) {
      try {
        const { pickup, drop } = JSON.parse(savedData);
        if (pickup) setPickup(pickup);
        if (drop) setDrop(drop);
      } catch (e) {
        console.error('Failed to load saved form data', e);
      }
    }
    
    // Set default date and time
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const defaultDate = formatDate(now);
    const defaultTime = formatTime(oneHourLater);
    
    setPickupDate(defaultDate);
    setPickupTime(defaultTime);
    setReturnTime(defaultTime);
  }, []);

  // Save pickup/drop to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bookingFormData', JSON.stringify({ pickup, drop }));
  }, [pickup, drop]);

  // Validate form
  useEffect(() => {
    let isValid = Boolean(
      pickup.display && 
      drop.display &&
      pickupDate &&
      pickupTime
    );

    if (activeTab === 'round-trip') {
      isValid = isValid && Boolean(returnDate && returnTime);
    }
    
    if (activeTab === 'airport') {
      isValid = isValid && Boolean(
        pickupMode === 'city' || (pickupMode === 'airport' && flightNumber)
      );
    }

    setFormValid(isValid);
  }, [pickup, drop, pickupDate, pickupTime, returnDate, returnTime, activeTab, pickupMode, flightNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      
      // Add additional data
      const payload = {
        ...data,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        trip_type: activeTab,
        passengers: Number(passengers),
        luggage: Number(luggage),
        ...(activeTab === 'hourly' && {
          package: HOURLY_PACKAGES.find(pkg => pkg.id === selectedPackage)
        }),
        ...(activeTab === 'airport' && {
          pickup_mode: pickupMode,
          flight_number: pickupMode === 'airport' ? flightNumber : undefined
        })
      };
      
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get quotes');
      }
      
      const result = await response.json();
      
      // Redirect with search params
      const searchParams = new URLSearchParams({
        from: pickup.display,
        to: drop.display,
        date: pickupDate,
        time: pickupTime,
        ...(activeTab === 'round-trip' && {
          return_date: returnDate,
          return_time: returnTime,
        }),
        ...(activeTab === 'hourly' && {
          package: selectedPackage,
        }),
        ...(activeTab === 'airport' && {
          pickup_mode: pickupMode,
          ...(pickupMode === 'airport' && { flight_number: flightNumber }),
        }),
      });
      
      router.push(`/search-results?${searchParams.toString()}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Booking error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'one-way', label: 'One Way' },
    { id: 'round-trip', label: 'Round Trip' },
    { id: 'airport', label: 'Airport' },
    { id: 'hourly', label: 'Hourly' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tab Navigation */}
        <div 
          role="tablist" 
          aria-label="Trip type"
          className="flex flex-wrap gap-2 border-b border-gray-200 mb-4"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <input type="hidden" name="trip_type" value={activeTab} />
        </div>

        {/* Pickup Location */}
        <div>
          <label htmlFor="pickup" className="block text-sm font-medium text-gray-700 mb-1">
            Pickup Location {activeTab === 'airport' ? '/ Airport' : ''}
          </label>
          <input
            type="text"
            id="pickup"
            name="pickup"
            value={pickup.display}
            onChange={(e) => setPickup({ ...pickup, display: e.target.value })}
            placeholder="Enter pickup location"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            aria-required="true"
          />
          <input type="hidden" name="pickup_lat" value={pickup.lat || ''} />
          <input type="hidden" name="pickup_lng" value={pickup.lng || ''} />
        </div>

        {/* Drop Location */}
        <div>
          <label htmlFor="drop" className="block text-sm font-medium text-gray-700 mb-1">
            {activeTab === 'airport' 
              ? pickupMode === 'airport' ? 'To (City/Hotel)' : 'From Airport'
              : 'Drop Location'}
          </label>
          <input
            type="text"
            id="drop"
            name="drop"
            value={drop.display}
            onChange={(e) => setDrop({ ...drop, display: e.target.value })}
            placeholder={
              activeTab === 'airport'
                ? pickupMode === 'airport'
                  ? 'Enter hotel or destination'
                  : 'Enter airport name'
                : 'Enter drop location'
            }
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            aria-required="true"
          />
          <input type="hidden" name="drop_lat" value={drop.lat || ''} />
          <input type="hidden" name="drop_lng" value={drop.lng || ''} />
        </div>

        {/* Airport Pickup Mode */}
        {activeTab === 'airport' && (
          <div className="space-y-4">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Pickup Mode</p>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="pickup_mode"
                    checked={pickupMode === 'city'}
                    onChange={() => setPickupMode('city')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">City to Airport</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="pickup_mode"
                    checked={pickupMode === 'airport'}
                    onChange={() => setPickupMode('airport')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Airport to City</span>
                </label>
              </div>
            </div>

            {pickupMode === 'airport' && (
              <div>
                <label htmlFor="flightNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Flight Number (Optional)
                </label>
                <input
                  type="text"
                  id="flightNumber"
                  name="flight_number"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="e.g., AI101"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {/* Hourly Package Selection */}
        {activeTab === 'hourly' && (
          <div>
            <label htmlFor="package" className="block text-sm font-medium text-gray-700 mb-1">
              Select Package
            </label>
            <select
              id="package"
              name="package"
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {HOURLY_PACKAGES.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - ₹{pkg.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Date
            </label>
            <input
              type="date"
              id="pickupDate"
              name="pickup_date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-md"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Time
            </label>
            <input
              type="time"
              id="pickupTime"
              name="pickup_time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
              required
              aria-required="true"
            />
          </div>
        </div>

        {/* Return Date & Time (only for round trip) */}
        {activeTab === 'round-trip' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
                Return Date
              </label>
              <input
                type="date"
                id="returnDate"
                name="return_date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={pickupDate || new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="returnTime" className="block text-sm font-medium text-gray-700 mb-1">
                Return Time
              </label>
              <input
                type="time"
                id="returnTime"
                name="return_time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
                aria-required="true"
              />
            </div>
          </div>
        )}

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
              Passengers
            </label>
            <select
              id="passengers"
              name="passengers"
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="luggage" className="block text-sm font-medium text-gray-700 mb-1">
              Luggage
            </label>
            <select
              id="luggage"
              name="luggage"
              value={luggage}
              onChange={(e) => setLuggage(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Piece' : 'Pieces'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!formValid || isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors flex items-center justify-center ${
              !formValid || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-disabled={!formValid || isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                {activeTab === 'one-way' && 'Book One Way Trip'}
                {activeTab === 'round-trip' && 'Book Round Trip'}
                {activeTab === 'airport' && 'Book Airport Transfer'}
                {activeTab === 'hourly' && 'Book Hourly Service'}
              </>
            )}
          </button>
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}. Please try again.
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
