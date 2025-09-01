'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from '../../lib/schedule';
import { fetchLocationSuggestions, generateSessionToken } from '../../lib/places';
import { 
  TabType, 
  PlaceData, 
  FormErrors, 
  PickupMode, 
  HOURLY_PACKAGES, 
  PASSENGER_OPTIONS, 
  LUGGAGE_OPTIONS,
  BookingFormData,
  QuoteRequest
} from './BookingWidget.types'; 

interface BookingWidgetProps {
  initialPickup?: string;
  initialDrop?: string;
  className?: string;
}

// Generate time slots every 15 minutes
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

// Get next hour time in HH:MM format
const getNextHourTime = (): string => {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1);
  nextHour.setMinutes(0, 0, 0);
  return nextHour.toTimeString().slice(0, 5);
};

const TRIP_TABS: { id: TabType; label: string }[] = [
  { id: 'one-way', label: 'One Way' },
  { id: 'round-trip', label: 'Round Trip' },
  { id: 'airport', label: 'Airport' },
  { id: 'hourly', label: 'Hourly Rental' },
];

const TIME_SLOTS = generateTimeSlots();

export default function BookingWidget({ 
  initialPickup = '', 
  initialDrop = '', 
  className = '' 
}: BookingWidgetProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Form state
  const [activeTab, setActiveTab] = useState<TabType>('one-way');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Form data state
  const [formData, setFormData] = useState<BookingFormData>({
    tripType: 'one-way',
    pickup: { display: initialPickup },
    drop: { display: initialDrop },
    stops: [],
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTime: getNextHourTime(),
    returnDate: '',
    returnTime: '',
    passengers: 1,
    luggage: 1,
    selectedPackage: HOURLY_PACKAGES[0].id,
    pickupMode: 'city',
    flightNumber: ''
  });
  
  // Get today's date in YYYY-MM-DD format if needed elsewhere
  // const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Handle tab change - consolidated to single instance
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    
    // Reset form data based on tab
    setFormData(prev => ({
      ...prev,
      tripType: tab,
      // Reset fields based on tab type
      ...(tab === 'hourly' ? { drop: { display: '' } } : {}),
      ...(tab !== 'round-trip' ? { returnDate: '', returnTime: '' } : {}),
      ...(tab !== 'airport' ? { flightNumber: '', pickupMode: 'city' as const } : {})
    }));
  }, []);
  
  // Suggestions state for location autocomplete (pickup/drop/stops)
  const [suggestions, setSuggestions] = useState<{
    field: 'pickup' | 'drop' | `stop-${number}`;
    items: PlaceData[];
  } | null>(null);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Session token for Google Places API (should be regenerated for each search session)
  const [sessionToken] = useState(() => generateSessionToken());
  
  // Handle location input change with debounced suggestions
  const debouncedLocationSearch = useCallback(
    debounce(async (field: 'pickup' | 'drop' | `stop-${number}`, value: string) => {
      if (value.length < 2) {
        setSuggestions(null);
        return;
      }
      
      try {
        const results = await fetchLocationSuggestions(value, sessionToken);
        setSuggestions({
          field,
          items: results
        });
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions(null);
      }
    }, 300),
    [sessionToken]
  );
  
  const handleLocationInputChange = useCallback((field: 'pickup' | 'drop' | `stop-${number}`, value: string) => {
    debouncedLocationSearch(field, value);
  }, [debouncedLocationSearch]);
  
  // Handle location selection from suggestions
  const handleLocationSelect = (field: 'pickup' | 'drop' | `stop-${number}`, place: PlaceData) => {
    setFormData(prev => ({
      ...prev,
      [field]: place
    }));
    setSuggestions(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    // Validate form
    const newErrors: FormErrors = {};
    
    if (!formData.pickup.display) {
      newErrors.pickup = 'Pickup location is required';
    }
    
    if (activeTab !== 'hourly' && !formData.drop.display) {
      newErrors.drop = 'Drop location is required';
    }
    
    if (!formData.pickupDate) {
      newErrors.pickupDate = 'Pickup date is required';
    }
    
    if (!formData.pickupTime) {
      newErrors.pickupTime = 'Pickup time is required';
    }
    
    if (activeTab === 'round-trip' && !formData.returnDate) {
      newErrors.returnDate = 'Return date is required';
    }
    
    if (activeTab === 'round-trip' && !formData.returnTime) {
      newErrors.returnTime = 'Return time is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      // Prepare the request payload
      const payload = {
        trip_type: formData.tripType,
        pickup: formData.pickup.display,
        ...(formData.pickup.lat && { pickup_lat: formData.pickup.lat }),
        ...(formData.pickup.lng && { pickup_lng: formData.pickup.lng }),
        drop: formData.drop.display,
        ...(formData.drop.lat && { drop_lat: formData.drop.lat }),
        ...(formData.drop.lng && { drop_lng: formData.drop.lng }),
        pickup_date: formData.pickupDate,
        pickup_time: formData.pickupTime,
        ...(formData.returnDate && { return_date: formData.returnDate }),
        ...(formData.returnTime && { return_time: formData.returnTime }),
        ...(formData.pickupMode && { pickup_mode: formData.pickupMode }),
        ...(formData.flightNumber && { flight_number: formData.flightNumber }),
        ...(formData.tripType === 'hourly' && {
          package: {
            id: formData.selectedPackage,
            hours: HOURLY_PACKAGES.find(pkg => pkg.id === formData.selectedPackage)?.hours || 0,
            distance: HOURLY_PACKAGES.find(pkg => pkg.id === formData.selectedPackage)?.distance || 0
          }
        }),
        passengers: formData.passengers,
        luggage: formData.luggage
      };
      
      // In a real app, you would make an API call here
      console.log('Submitting form with data:', payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Build search URL parameters
      const searchParams = new URLSearchParams();
      searchParams.set('origin', formData.pickup.display);
      if (formData.drop.display) {
        searchParams.set('destination', formData.drop.display);
      }
      
      // Combine date and time for pickup_datetime
      const pickupDateTime = `${formData.pickupDate}T${formData.pickupTime}:00`;
      searchParams.set('pickup_datetime', pickupDateTime);
      
      if (formData.tripType === 'round-trip' && formData.returnDate && formData.returnTime) {
        const returnDateTime = `${formData.returnDate}T${formData.returnTime}:00`;
        searchParams.set('return_datetime', returnDateTime);
      }
      
      searchParams.set('passengers', formData.passengers.toString());
      searchParams.set('luggage', formData.luggage.toString());
      
      // Add additional parameters for different trip types
      if (formData.tripType === 'airport') {
        searchParams.set('pickup_mode', formData.pickupMode);
        if (formData.flightNumber) {
          searchParams.set('flight_number', formData.flightNumber);
        }
      }
      
      if (formData.tripType === 'hourly') {
        searchParams.set('package', formData.selectedPackage);
        searchParams.set('trip_type', 'hourly');
      } else {
        searchParams.set('trip_type', formData.tripType);
      }
      
      // Redirect to search results page
      router.push(`/search-results?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({
        general: 'An error occurred while processing your request. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render tab navigation
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 mb-6">
      {TRIP_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`py-3 px-4 font-medium text-sm transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => handleTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // Render location input field
  const renderLocationInput = (
    field: 'pickup' | 'drop' | `stop-${number}`,
    label: string,
    placeholder: string,
    error?: string
  ) => {
    const value = formData[field as keyof typeof formData] as PlaceData;
    
    return (
      <div className="relative mb-4">
        <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            id={field}
            name={field}
            value={value?.display || ''}
            onChange={(e) => {
              const newValue = { ...value, display: e.target.value };
              setFormData(prev => ({ ...prev, [field]: newValue }));
              handleLocationInputChange(field, e.target.value);
            }}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${suggestions?.field === field && suggestions.items.length > 0 ? 'rounded-b-none border-b-0' : ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${field}-error` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
          />
          {suggestions?.field === field && suggestions.items.length > 0 && (
            <ul 
              className="absolute z-50 w-full bg-white border border-gray-300 border-t-0 rounded-lg rounded-t-none shadow-xl max-h-60 overflow-auto"
              role="listbox"
              style={{ 
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderTop: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                marginTop: '0'
              }}
            >
              {suggestions.items.map((item, index) => (
                <li
                  key={item.placeId || index}
                  className="px-4 py-3 text-sm font-medium cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-150 ease-in-out hover:bg-blue-50"
                  style={{
                    color: '#1f2937',
                    backgroundColor: '#ffffff'
                  }}
                  onClick={() => handleLocationSelect(field, item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLocationSelect(field, item);
                    }
                  }}
                  role="option"
                  aria-selected="false"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {item.isAirport ? (
                          <span className="text-blue-600">✈️</span>
                        ) : item.isTransit ? (
                          <span className="text-green-600">🚂</span>
                        ) : item.types?.includes('establishment') ? (
                          <span className="text-purple-600">🏢</span>
                        ) : (
                          <span className="text-gray-600">📍</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium text-gray-900">
                          {item.mainText || item.display}
                        </div>
                        {item.secondaryText && (
                          <div className="truncate text-sm text-gray-500">
                            {item.secondaryText}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {item.isAirport && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          Airport
                        </span>
                      )}
                      {item.isTransit && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          Transit
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && (
          <p id={`${field}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  };

  // Render date input
  const renderDateInput = (
    name: 'pickupDate' | 'returnDate',
    label: string,
    minDate?: string,
    error?: string
  ) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="date"
        id={name}
        name={name}
        value={formData[name] || ''}
        min={minDate}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );

  // Render time select
  const renderTimeSelect = (
    name: 'pickupTime' | 'returnTime',
    label: string,
    error?: string
  ) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="">Select time</option>
        {TIME_SLOTS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );

  // Render passenger and luggage selectors
  const renderPassengerLuggage = () => (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
          Passengers
        </label>
        <select
          id="passengers"
          name="passengers"
          value={formData.passengers}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {PASSENGER_OPTIONS.map((num) => (
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
          value={formData.luggage}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {LUGGAGE_OPTIONS.map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'Piece' : 'Pieces'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // Render hourly package selector
  const renderHourlyPackages = () => (
    <div className="mb-4">
      <label htmlFor="package-selector" className="block text-sm font-medium text-gray-700 mb-2">
        Select Package
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="radiogroup" aria-labelledby="package-selector">
        {HOURLY_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.selectedPackage === pkg.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                selectedPackage: pkg.id,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFormData((prev) => ({
                  ...prev,
                  selectedPackage: pkg.id,
                }));
              }
            }}
            role="radio"
            aria-checked={formData.selectedPackage === pkg.id}
            tabIndex={0}
          >
            <div className="font-medium">{pkg.name}</div>
            <div className="text-sm text-gray-600">
              {pkg.hours} hours • {pkg.distance} km
            </div>
            <div className="mt-2 font-semibold">
              ₹{pkg.price.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render airport specific fields
  const renderAirportFields = () => (
    <>
      <div className="mb-4">
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Pickup From
          </legend>
          <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="pickupMode"
              value="airport"
              checked={formData.pickupMode === 'airport'}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  pickupMode: 'airport',
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-gray-700">Airport</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="pickupMode"
              value="city"
              checked={formData.pickupMode === 'city'}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  pickupMode: 'city',
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-gray-700">City</span>
          </label>
        </div>
        </fieldset>
      </div>
      <div className="mb-4">
        <label
          htmlFor="flightNumber"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Flight Number (Optional)
        </label>
        <input
          type="text"
          id="flightNumber"
          name="flightNumber"
          value={formData.flightNumber}
          onChange={handleInputChange}
          placeholder="e.g., AI 101"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </>
  );

  // Render add stop button
  const renderAddStopButton = () => {
    if (formData.stops.length >= 3 || activeTab === 'hourly') return null;
    
    return (
      <button
        type="button"
        onClick={() =>
          setFormData((prev) => ({
            ...prev,
            stops: [...prev.stops, { display: '' }],
          }))
        }
        className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Add Stop
      </button>
    );
  };

  // Render stops
  const renderStops = () => {
    if (formData.stops.length === 0) return null;
    
    return (
      <div className="mb-4">
        {formData.stops.map((stop, index) => (
          <div key={index} className="mb-3">
            {renderLocationInput(
              `stop-${index}`,
              `Stop ${index + 1}`,
              'Enter stop location',
              (errors as Record<string, string>)[`stop-${index}`]
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render call banner
  const renderCallBanner = () => (
    <div className="call-banner">
      <style jsx>{`
        .call-banner {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 0.75rem;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(239, 68, 68, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }
        
        .call-banner:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15), 0 15px 20px -3px rgba(239, 68, 68, 0.4);
        }
        
        .call-banner:focus {
          outline: none;
          border-color: #fbbf24;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
        }
        
        .call-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .call-banner:hover::before {
          left: 100%;
        }
        
        .call-icon {
          font-size: 1.5rem;
          animation: ring 2s infinite ease-in-out;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        
        .call-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        
        .call-text {
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .phone-number {
          color: #fef3c7;
          font-weight: 800;
          font-size: 1.3rem;
          letter-spacing: 0.1em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .call-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 0.25rem;
        }
        
        @keyframes ring {
          0%, 100% { 
            transform: rotate(0deg) scale(1); 
          }
          25% { 
            transform: rotate(-15deg) scale(1.1); 
          }
          75% { 
            transform: rotate(15deg) scale(1.1); 
          }
        }
        
        @media (max-width: 768px) {
          .call-banner {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
            padding: 1rem;
          }
          
          .call-content {
            gap: 0.5rem;
          }
          
          .phone-number {
            font-size: 1.2rem;
          }
        }
      `}</style>
      
      <div className="call-icon">📞</div>
      <div className="call-content">
        <div className="call-text">Call Now for Instant Booking</div>
        <div className="phone-number">+91 98765 43210</div>
        <div className="call-subtitle">Available 24/7 • Best Rates Guaranteed</div>
      </div>
    </div>
  );

  // Handle call banner click
  const handleCallClick = () => {
    // Create tel: link for mobile devices
    const phoneNumber = '+919876543210';
    window.location.href = `tel:${phoneNumber}`;
  };

  // Handle keyboard navigation for call banner
  const handleCallKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCallClick();
    }
  };

  // Render the main form
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Book Your Ride
      </h2>
      
      {/* Call Banner */}
      <div 
        onClick={handleCallClick}
        onKeyDown={handleCallKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Call +91 98765 43210 for instant booking"
      >
        {renderCallBanner()}
      </div>
      
      {renderTabs()}
      
      <form onSubmit={handleSubmit} ref={formRef}>
        <input type="hidden" name="tripType" value={activeTab} />
        
        {/* Pickup Location */}
        {renderLocationInput(
          'pickup',
          'Pickup Location',
          'Enter pickup location',
          errors.pickup
        )}
        
        {/* Stops */}
        {renderStops()}
        {renderAddStopButton()}
        
        {/* Drop Location - Hidden for hourly rentals */}
        {activeTab !== 'hourly' &&
          renderLocationInput(
            'drop',
            'Drop Location',
            'Enter drop location',
            errors.drop
          )}
        
        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {renderDateInput(
            'pickupDate',
            'Pickup Date',
            new Date().toISOString().split('T')[0],
            errors.pickupDate
          )}
          {renderTimeSelect('pickupTime', 'Pickup Time', errors.pickupTime)}
          
          {activeTab === 'round-trip' && (
            <>
              {renderDateInput(
                'returnDate',
                'Return Date',
                formData.pickupDate || new Date().toISOString().split('T')[0],
                errors.returnDate
              )}
              {renderTimeSelect('returnTime', 'Return Time', errors.returnTime)}
            </>
          )}
        </div>
        
        {/* Airport Specific Fields */}
        {activeTab === 'airport' && renderAirportFields()}
        
        {/* Hourly Package Selection */}
        {activeTab === 'hourly' && renderHourlyPackages()}
        
        {/* Passenger and Luggage */}
        {renderPassengerLuggage()}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Searching...' : 'Search Cabs'}
        </button>
        
        {errors.general && (
          <p className="mt-3 text-sm text-red-600">{errors.general}</p>
        )}
      </form>
    </div>
  );
}
