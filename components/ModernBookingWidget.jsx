import React, { useState } from 'react';

const citySuggestions = [
  'Raipur',
  'Bhilai',
  'Bilaspur',
  'Nagpur',
  'Bhopal',
  'Jabalpur',
  'Durg',
  'Hyderabad',
  'Visakhapatnam',
  'Mumbai',
  'Pune',
  'Delhi'
];

const tripOptions = [
  { id: 'one-way', label: 'One Way', helper: 'Point to point ride' },
  { id: 'round-trip', label: 'Round Trip', helper: 'Return on a later date' },
  { id: 'local', label: 'Local', helper: 'City sightseeing or hourly' },
  { id: 'airport', label: 'Airport', helper: 'Pickups & drops' }
];

export default function ModernBookingWidget({ className = "" }) {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pickupDate: today,
    pickupTime: '',
    passengers: '2',
    tripType: 'one-way'
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTripTypeChange = (tripType) => {
    setFormData((prev) => ({ ...prev, tripType }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Booking data:', formData);
  };

  return (
    <div className={`booking-panel ${className}`}>
      <div className="booking-panel__heading">
        <p className="booking-panel__eyebrow">Plan your ride</p>
        <h2 className="booking-panel__title">Book an intercity cab</h2>
        <p className="booking-panel__subtitle">
          Transparent fares, curated drivers and instant confirmation.
        </p>
      </div>

      <div className="booking-panel__tabs" role="tablist" aria-label="Select trip type">
        {tripOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={formData.tripType === option.id}
            aria-controls="booking-panel-form"
            tabIndex={formData.tripType === option.id ? 0 : -1}
            className={`booking-panel__tab${formData.tripType === option.id ? ' is-active' : ''}`}
            onClick={() => handleTripTypeChange(option.id)}
          >
            <span className="booking-panel__tab-label">{option.label}</span>
            <span className="booking-panel__tab-helper">{option.helper}</span>
          </button>
        ))}
      </div>

      <form id="booking-panel-form" onSubmit={handleSubmit} className="booking-panel__form">
        <input type="hidden" name="tripType" value={formData.tripType} />
        <div className="booking-panel__grid">
          <div className="form-group" id="pickup-panel">
            <label htmlFor="pickup-city" className="form-label">
              Pickup city
            </label>
            <input
              id="pickup-city"
              name="origin"
              list="pickup-city-options"
              value={formData.origin}
              onChange={handleInputChange}
              placeholder="Select or type city"
              className="form-input form-input-lg"
              required
              aria-required="true"
            />
            <datalist id="pickup-city-options">
              {citySuggestions.map((city) => (
                <option value={city} key={city} />
              ))}
            </datalist>
          </div>

          <div className="form-group" id="drop-panel">
            <label htmlFor="drop-city" className="form-label">
              Drop city
            </label>
            <input
              id="drop-city"
              name="destination"
              list="drop-city-options"
              value={formData.destination}
              onChange={handleInputChange}
              placeholder="Select or type city"
              className="form-input form-input-lg"
              required
              aria-required="true"
            />
            <datalist id="drop-city-options">
              {citySuggestions.map((city) => (
                <option value={city} key={`${city}-drop`} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="pickupDate" className="form-label">
              Pickup date
            </label>
            <input
              type="date"
              id="pickupDate"
              name="pickupDate"
              value={formData.pickupDate}
              min={today}
              onChange={handleInputChange}
              className="form-input form-input-lg"
              required
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pickupTime" className="form-label">
              Pickup time
            </label>
            <input
              type="time"
              id="pickupTime"
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleInputChange}
              className="form-input form-input-lg"
              required
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="passengers" className="form-label">
              Travellers
            </label>
            <select
              id="passengers"
              name="passengers"
              value={formData.passengers}
              onChange={handleInputChange}
              className="form-select form-input-lg"
              aria-label="Select number of passengers"
            >
              <option value="1">1 Passenger</option>
              <option value="2">2 Passengers</option>
              <option value="3">3 Passengers</option>
              <option value="4">4 Passengers</option>
              <option value="5">5+ Passengers</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-xl booking-panel__submit"
          aria-label="Search cabs"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search cabs
        </button>
      </form>
    </div>
  );
}
