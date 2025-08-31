'use client';
import React, { useCallback, useRef, useState } from 'react';
import { debounce } from '../../lib/schedule';
import { HOURLY_PACKAGES, PASSENGER_OPTIONS, LUGGAGE_OPTIONS } from './BookingWidget.types';
// Generate time slots every 15 minutes
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(time);
        }
    }
    return slots;
};
// Get next hour time in HH:MM format
const getNextHourTime = () => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1);
    nextHour.setMinutes(0, 0, 0);
    return nextHour.toTimeString().slice(0, 5);
};
const TRIP_TABS = [
    { id: 'one-way', label: 'One Way' },
    { id: 'round-trip', label: 'Round Trip' },
    { id: 'airport', label: 'Airport' },
    { id: 'hourly', label: 'Hourly Rental' },
];
const TIME_SLOTS = generateTimeSlots();
export default function BookingWidget({ initialPickup = '', initialDrop = '', className = '' }) {
    const formRef = useRef(null);
    // Form state
    const [activeTab, setActiveTab] = useState('one-way');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    // Form data state
    const [formData, setFormData] = useState({
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
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        // Reset form data based on tab
        setFormData(prev => ({
            ...prev,
            tripType: tab,
            // Reset fields based on tab type
            ...(tab === 'hourly' ? { drop: { display: '' } } : {}),
            ...(tab !== 'round-trip' ? { returnDate: '', returnTime: '' } : {}),
            ...(tab !== 'airport' ? { flightNumber: '', pickupMode: 'city' } : {})
        }));
    }, []);
    // Suggestions state for location autocomplete (pickup/drop/stops)
    const [suggestions, setSuggestions] = useState(null);
    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    // Handle location input change with debounced suggestions
    const handleLocationInputChange = useCallback(debounce(async (field, value) => {
        if (value.length < 2) {
            setSuggestions(null);
            return;
        }
        try {
            // In a real app, you would call your geocoding service here
            // For now, we'll use a mock implementation
            const mockResults = [
                { display: `${value} City Center`, placeId: '1', lat: 0, lng: 0 },
                { display: `${value} Airport`, placeId: '2', lat: 0, lng: 0, isAirport: true },
                { display: `${value} Train Station`, placeId: '3', lat: 0, lng: 0 }
            ];
            setSuggestions({
                field,
                items: mockResults
            });
        }
        catch (error) {
            console.error('Error fetching location suggestions:', error);
            setSuggestions(null);
        }
    }, 300), []);
    // Handle location selection from suggestions
    const handleLocationSelect = (field, place) => {
        setFormData(prev => ({
            ...prev,
            [field]: place
        }));
        setSuggestions(null);
    };
    // Handle form submission
    const handleSubmit = async (e) => {
        var _a, _b;
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        // Validate form
        const newErrors = {};
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
                        hours: ((_a = HOURLY_PACKAGES.find(pkg => pkg.id === formData.selectedPackage)) === null || _a === void 0 ? void 0 : _a.hours) || 0,
                        distance: ((_b = HOURLY_PACKAGES.find(pkg => pkg.id === formData.selectedPackage)) === null || _b === void 0 ? void 0 : _b.distance) || 0
                    }
                }),
                passengers: formData.passengers,
                luggage: formData.luggage
            };
            // In a real app, you would make an API call here
            console.log('Submitting form with data:', payload);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Redirect to booking page or show success message
            // router.push('/booking/confirmation');
        }
        catch (error) {
            console.error('Error submitting form:', error);
            setErrors({
                general: 'An error occurred while processing your request. Please try again.'
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    // Render tab navigation
    const renderTabs = () => (<div className="flex border-b border-gray-200 mb-6">
      {TRIP_TABS.map((tab) => (<button key={tab.id} type="button" className={`py-3 px-4 font-medium text-sm transition-colors ${activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'}`} onClick={() => handleTabChange(tab.id)}>
          {tab.label}
        </button>))}
    </div>);
    // Render location input field
    const renderLocationInput = (field, label, placeholder, error) => {
        const value = formData[field];
        return (<div className="relative mb-4">
        <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative">
          <input type="text" id={field} name={field} value={(value === null || value === void 0 ? void 0 : value.display) || ''} onChange={(e) => {
                const newValue = { ...value, display: e.target.value };
                setFormData(prev => ({ ...prev, [field]: newValue }));
                handleLocationInputChange(field, e.target.value);
            }} placeholder={placeholder} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`} aria-invalid={!!error} aria-describedby={error ? `${field}-error` : undefined}/>
          {(suggestions === null || suggestions === void 0 ? void 0 : suggestions.field) === field && suggestions.items.length > 0 && (<ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto" role="listbox">
              {suggestions.items.map((item, index) => (<li key={item.placeId || index} className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleLocationSelect(field, item)} role="option">
                  {item.display}
                </li>))}
            </ul>)}
        </div>
        {error && (<p id={`${field}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>)}
      </div>);
    };
    // Render date input
    const renderDateInput = (name, label, minDate, error) => (<div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input type="date" id={name} name={name} value={formData[name] || ''} min={minDate} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined}/>
      {error && (<p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>)}
    </div>);
    // Render time select
    const renderTimeSelect = (name, label, error) => (<div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select id={name} name={name} value={formData[name] || ''} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined}>
        <option value="">Select time</option>
        {TIME_SLOTS.map((time) => (<option key={time} value={time}>
            {time}
          </option>))}
      </select>
      {error && (<p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>)}
    </div>);
    // Render passenger and luggage selectors
    const renderPassengerLuggage = () => (<div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-1">
          Passengers
        </label>
        <select id="passengers" name="passengers" value={formData.passengers} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          {PASSENGER_OPTIONS.map((num) => (<option key={num} value={num}>
              {num} {num === 1 ? 'Passenger' : 'Passengers'}
            </option>))}
        </select>
      </div>
      <div>
        <label htmlFor="luggage" className="block text-sm font-medium text-gray-700 mb-1">
          Luggage
        </label>
        <select id="luggage" name="luggage" value={formData.luggage} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          {LUGGAGE_OPTIONS.map((num) => (<option key={num} value={num}>
              {num} {num === 1 ? 'Piece' : 'Pieces'}
            </option>))}
        </select>
      </div>
    </div>);
    // Render hourly package selector
    const renderHourlyPackages = () => (<div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Package
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {HOURLY_PACKAGES.map((pkg) => (<div key={pkg.id} className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.selectedPackage === pkg.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'}`} onClick={() => setFormData((prev) => ({
                ...prev,
                selectedPackage: pkg.id,
            }))}>
            <div className="font-medium">{pkg.name}</div>
            <div className="text-sm text-gray-600">
              {pkg.hours} hours • {pkg.distance} km
            </div>
            <div className="mt-2 font-semibold">
              ₹{pkg.price.toLocaleString()}
            </div>
          </div>))}
      </div>
    </div>);
    // Render airport specific fields
    const renderAirportFields = () => (<>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pickup From
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input type="radio" name="pickupMode" value="airport" checked={formData.pickupMode === 'airport'} onChange={() => setFormData((prev) => ({
            ...prev,
            pickupMode: 'airport',
        }))} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
            <span className="ml-2 text-gray-700">Airport</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name="pickupMode" value="city" checked={formData.pickupMode === 'city'} onChange={() => setFormData((prev) => ({
            ...prev,
            pickupMode: 'city',
        }))} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
            <span className="ml-2 text-gray-700">City</span>
          </label>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="flightNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Flight Number (Optional)
        </label>
        <input type="text" id="flightNumber" name="flightNumber" value={formData.flightNumber} onChange={handleInputChange} placeholder="e.g., AI 101" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
      </div>
    </>);
    // Render add stop button
    const renderAddStopButton = () => {
        if (formData.stops.length >= 3 || activeTab === 'hourly')
            return null;
        return (<button type="button" onClick={() => setFormData((prev) => ({
                ...prev,
                stops: [...prev.stops, { display: '' }],
            }))} className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-4">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Add Stop
      </button>);
    };
    // Render stops
    const renderStops = () => {
        if (formData.stops.length === 0)
            return null;
        return (<div className="mb-4">
        {formData.stops.map((stop, index) => (<div key={index} className="mb-3">
            {renderLocationInput(`stop-${index}`, `Stop ${index + 1}`, 'Enter stop location', errors[`stop-${index}`])}
          </div>))}
      </div>);
    };
    // Render the main form
    return (<div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Book Your Ride
      </h2>
      
      {renderTabs()}
      
      <form onSubmit={handleSubmit} ref={formRef}>
        <input type="hidden" name="tripType" value={activeTab}/>
        
        {/* Pickup Location */}
        {renderLocationInput('pickup', 'Pickup Location', 'Enter pickup location', errors.pickup)}
        
        {/* Stops */}
        {renderStops()}
        {renderAddStopButton()}
        
        {/* Drop Location - Hidden for hourly rentals */}
        {activeTab !== 'hourly' &&
            renderLocationInput('drop', 'Drop Location', 'Enter drop location', errors.drop)}
        
        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {renderDateInput('pickupDate', 'Pickup Date', new Date().toISOString().split('T')[0], errors.pickupDate)}
          {renderTimeSelect('pickupTime', 'Pickup Time', errors.pickupTime)}
          
          {activeTab === 'round-trip' && (<>
              {renderDateInput('returnDate', 'Return Date', formData.pickupDate || new Date().toISOString().split('T')[0], errors.returnDate)}
              {renderTimeSelect('returnTime', 'Return Time', errors.returnTime)}
            </>)}
        </div>
        
        {/* Airport Specific Fields */}
        {activeTab === 'airport' && renderAirportFields()}
        
        {/* Hourly Package Selection */}
        {activeTab === 'hourly' && renderHourlyPackages()}
        
        {/* Passenger and Luggage */}
        {renderPassengerLuggage()}
        
        {/* Submit Button */}
        <button type="submit" disabled={isLoading} className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}>
          {isLoading ? 'Searching...' : 'Search Cabs'}
        </button>
        
        {errors.general && (<p className="mt-3 text-sm text-red-600">{errors.general}</p>)}
      </form>
    </div>);
}
