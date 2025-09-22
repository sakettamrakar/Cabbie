import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { IconDestination, IconLocation } from './icons';
import { SITE_BRAND } from '../lib/seo';

const todayISO = () => new Date().toISOString().split('T')[0];

export default function ModernBookingWidget({ className = '' }) {
  const router = useRouter();
  const [tripType, setTripType] = useState('one-way');
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pickupDate: todayISO(),
    pickupTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isDisabled = useMemo(() => {
    return (
      !formData.origin.trim() ||
      !formData.destination.trim() ||
      !formData.pickupDate ||
      !formData.pickupTime ||
      isSubmitting
    );
  }, [formData, isSubmitting]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isDisabled) {
      setErrorMessage('Please fill in pickup, drop, date, and time to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { origin, destination, pickupDate, pickupTime } = formData;
      const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);

      if (Number.isNaN(pickupDateTime.getTime())) {
        setErrorMessage('Enter a valid pickup date and time.');
        setIsSubmitting(false);
        return;
      }

      const params = new URLSearchParams({
        origin: origin.trim(),
        destination: destination.trim(),
        pickup_datetime: pickupDateTime.toISOString(),
      });

      if (tripType === 'round-trip') {
        params.set('trip_type', 'round-trip');
      }

      await router.push(`/search-results?${params.toString()}`);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Failed to initiate search', error);
      setErrorMessage('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`booking-widget card ${className}`} aria-label={`${SITE_BRAND} booking widget`}>
      <header className="booking-widget__header">
        <h2>Plan your next ride</h2>
        <p className="muted">Instant fares and verified chauffeurs across Chhattisgarh.</p>
      </header>

      <div className="booking-widget__tabs" role="tablist" aria-label="Trip type">
        {[
          { id: 'one-way', label: 'One way' },
          { id: 'round-trip', label: 'Round trip' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tripType === tab.id}
            className={`booking-widget__tab ${tripType === tab.id ? 'is-active' : ''}`}
            onClick={() => setTripType(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form className="booking-widget__form" onSubmit={handleSubmit} noValidate>
        <div className="form-row grid-2">
          <div className="form-field">
            <label htmlFor="origin">Pickup location</label>
            <div className="form-control with-icon">
              <IconLocation className="icon-24" />
              <input
                id="origin"
                name="origin"
                type="text"
                autoComplete="off"
                placeholder="e.g. Raipur Airport"
                value={formData.origin}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="destination">Drop location</label>
            <div className="form-control with-icon">
              <IconDestination className="icon-24" />
              <input
                id="destination"
                name="destination"
                type="text"
                autoComplete="off"
                placeholder="e.g. Bilaspur Railway Station"
                value={formData.destination}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-row grid-2">
          <div className="form-field">
            <label htmlFor="pickupDate">Pickup date</label>
            <input
              id="pickupDate"
              name="pickupDate"
              type="date"
              value={formData.pickupDate}
              onChange={handleInputChange}
              min={todayISO()}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="pickupTime">Pickup time</label>
            <input
              id="pickupTime"
              name="pickupTime"
              type="time"
              value={formData.pickupTime}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <p className="form-footnote" aria-live="polite">
          {tripType === 'round-trip'
            ? 'Return journey support is launching soon. We will confirm both legs over a call.'
            : 'Secure your cab instantly. Modify or cancel up to 3 hours before pickup.'}
        </p>

        {errorMessage && (
          <p className="form-error" role="alert" aria-live="polite">
            {errorMessage}
          </p>
        )}

        <div className="booking-widget__cta">
          <button
            type="submit"
            className="cta"
            disabled={isDisabled}
          >
            {isSubmitting ? 'Searching…' : 'Search available cabs'}
          </button>
        </div>
      </form>
    </section>
  );
}
