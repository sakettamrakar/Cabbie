import React, { useState } from 'react';

interface BookingWidgetProps {
  className?: string;
}

export default function ModernBookingWidget({ className = "" }: BookingWidgetProps) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pickupDate: '',
    pickupTime: '',
    passengers: '2'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Booking data:', formData);
  };

  return (
    <div className={`booking-widget ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Book Your Ride</h2>
        <p className="text-neutral-600">Professional intercity taxi service with instant booking</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        {/* Origin and Destination */}
        <div className="booking-form-row">
          <div className="form-group">
            <label htmlFor="origin" className="form-label">
              <svg className="w-4 h-4 inline mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              From (Pickup Location)
            </label>
            <input
              type="text"
              id="origin"
              name="origin"
              value={formData.origin}
              onChange={handleInputChange}
              placeholder="Enter pickup city"
              className="form-input form-input-lg"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination" className="form-label">
              <svg className="w-4 h-4 inline mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              To (Drop Location)
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              placeholder="Enter destination city"
              className="form-input form-input-lg"
              required
            />
          </div>
        </div>

        {/* Date and Time */}
        <div className="booking-form-row">
          <div className="form-group">
            <label htmlFor="pickupDate" className="form-label">
              <svg className="w-4 h-4 inline mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Pickup Date
            </label>
            <input
              type="date"
              id="pickupDate"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleInputChange}
              className="form-input form-input-lg"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pickupTime" className="form-label">
              <svg className="w-4 h-4 inline mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pickup Time
            </label>
            <input
              type="time"
              id="pickupTime"
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleInputChange}
              className="form-input form-input-lg"
              required
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="form-group">
          <label htmlFor="passengers" className="form-label">
            <svg className="w-4 h-4 inline mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Number of Passengers
          </label>
          <select
            id="passengers"
            name="passengers"
            value={formData.passengers}
            onChange={handleInputChange}
            className="form-select form-input-lg"
          >
            <option value="1">1 Passenger</option>
            <option value="2">2 Passengers</option>
            <option value="3">3 Passengers</option>
            <option value="4">4 Passengers</option>
            <option value="5">5+ Passengers</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-xl w-full mt-6 group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Available Cabs
        </button>
      </form>

      {/* Features */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-neutral-600 font-medium">Instant Booking</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <span className="text-xs text-neutral-600 font-medium">Fair Pricing</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs text-neutral-600 font-medium">Live Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
