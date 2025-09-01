/**
 * EXAMPLE: BookingForm component migrated to use the new design system
 * 
 * This demonstrates how to convert from inline styles and scoped CSS
 * to using the comprehensive theme system we just implemented.
 * 
 * Key changes:
 * 1. Replaced inline styles with utility classes
 * 2. Used CSS custom properties from theme
 * 3. Applied consistent form controls (44px inputs, 48px buttons)
 * 4. Used typography and spacing scales
 * 5. Applied semantic color tokens
 */

import { useState, useEffect } from 'react';

// ... same imports and logic as original ...

export default function BookingForm({
  originText, setOriginText,
  destinationText, setDestinationText,
  pickupDt, setPickupDt,
  carType, setCarType,
  customerPhone, setCustomerPhone,
  customerName, setCustomerName,
  discountCode, setDiscountCode,
  quote, farePreview, errors,
  otpStatus, otpMessage, otp, setOtp,
  canResend, submitting,
  submit, sendOtp, verify,
  offerStatus, validOffers,
  setOfferStatus, recalcDiscountPreview
}) {
  
  return (
    <form 
      aria-labelledby="bookingHeading" 
      noValidate 
      onSubmit={submit} 
      className="form-grid form-container"
    >
      <h2 id="bookingHeading" className="heading-lg mb-xs">Book this Route</h2>
      
      <div className="form-field">
        <label htmlFor="origin_text" className="form-label">Origin</label>
        <input 
          id="origin_text" 
          name="origin_text" 
          value={originText} 
          onChange={e => { const v = e.target.value; setOriginText(v); }} 
          required 
          type="text" 
          autoComplete="address-level2"
          className="form-input"
        />
      </div>
      
      <div className="form-field">
        <label htmlFor="destination_text" className="form-label">Destination</label>
        <input 
          id="destination_text" 
          name="destination_text" 
          value={destinationText} 
          onChange={e => { const v = e.target.value; setDestinationText(v); }} 
          required 
          type="text" 
          autoComplete="address-level2"
          className="form-input"
        />
      </div>
      
      <div className="form-field">
        <label htmlFor="pickup_datetime" className="form-label">Pickup Date/Time</label>
        <input 
          id="pickup_datetime" 
          name="pickup_datetime" 
          type="datetime-local" 
          value={pickupDt} 
          onChange={e => setPickupDt(e.target.value)} 
          required
          className="form-input"
        />
      </div>
      
      <fieldset className="form-fieldset">
        <legend className="form-legend">Car Type</legend>
        <div className="button-group">
          {['HATCHBACK', 'SEDAN', 'SUV'].map(ct => {
            const active = carType === ct;
            return (
              <button 
                key={ct} 
                type="button" 
                onClick={() => setCarType(ct)} 
                aria-pressed={active}
                className={`btn btn-outline flex-1 ${active ? 'btn-active' : ''}`}
              >
                {ct}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="car_type" value={carType}/>
      </fieldset>
      
      <div className="form-field">
        <label htmlFor="customer_phone" className="form-label">Phone</label>
        <input 
          id="customer_phone" 
          name="customer_phone" 
          value={customerPhone} 
          onChange={e => setCustomerPhone(e.target.value)} 
          required 
          pattern="[0-9]{10}" 
          inputMode="tel" 
          type="tel" 
          aria-describedby="phoneHelp" 
          aria-invalid={errors.customer_phone ? 'true' : undefined}
          className={`form-input ${errors.customer_phone ? 'form-input-error' : ''}`}
        />
        <small id="phoneHelp" className="form-help">10 digit mobile number (numbers only)</small>
        {errors.customer_phone && (
          <div 
            id="phone_error" 
            role="alert" 
            aria-live="assertive" 
            className="form-error"
          >
            {errors.customer_phone}
          </div>
        )}
      </div>
      
      <div className="form-field">
        <label htmlFor="customer_name" className="form-label">Name (optional)</label>
        <input 
          id="customer_name" 
          name="customer_name" 
          value={customerName} 
          onChange={e => setCustomerName(e.target.value)} 
          type="text" 
          autoComplete="name"
          className="form-input"
        />
      </div>
      
      <div className="form-field">
        <label htmlFor="discount_code" className="form-label">Offer Code</label>
        <input 
          id="discount_code" 
          name="discount_code" 
          value={discountCode} 
          onChange={e => { 
            const v = e.target.value.trim(); 
            setDiscountCode(v); 
            scheduleMicrotask(() => { 
              if (!v) {
                setOfferStatus('');
                recalcDiscountPreview('');
              } else {
                const ok = validOffers.includes(v.toUpperCase());
                setOfferStatus(ok ? 'Applied' : 'Invalid');
                recalcDiscountPreview(v);
              } 
            }); 
          }} 
          placeholder="Enter code" 
          type="text" 
          aria-describedby="discountHelp"
          className="form-input"
        />
        <small className={`form-status ${offerStatus === 'Applied' ? 'text-success' : 'text-error'}`}>
          {offerStatus}
        </small>
      </div>
      
      {quote && (
        <div className="fare-preview" aria-live="polite">
          <strong>Estimated Fare:</strong> ₹{quote.fare_quote_inr}
          {farePreview != null && farePreview !== quote.fare_quote_inr && (
            <> → <span className="text-primary">₹{farePreview}</span></>
          )}
          <div className="fare-details text-sm mt-xs">
            Distance ~ {quote.distance_km} km • Duration ~ {quote.duration_min} min
          </div>
        </div>
      )}
      
      {otpStatus !== 'verified' && (
        <div className="otp-section" aria-describedby="otpHelp">
          <div className="flex flex-wrap gap-sm">
            <button 
              type="button" 
              onClick={sendOtp} 
              disabled={(!canResend && otpStatus === 'sent') || !/^[0-9]{10}$/.test(customerPhone)} 
              aria-controls="otp_input"
              className="btn btn-secondary"
            >
              {otpStatus === 'sent' ? (canResend ? 'Resend OTP' : 'OTP Sent') : 'Send OTP'}
            </button>
            
            {otpStatus === 'sent' && (
              <div className="flex gap-xs align-center">
                <label htmlFor="otp_input" className="visually-hidden">One Time Password</label>
                <input 
                  id="otp_input" 
                  name="otp" 
                  placeholder="OTP" 
                  aria-required="true" 
                  aria-describedby="otpHelp" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  pattern="[0-9]{4}" 
                  inputMode="numeric" 
                  maxLength={4}
                  className="form-input otp-input"
                />
                <button 
                  type="button" 
                  onClick={verify} 
                  disabled={otp.length !== 4} 
                  aria-label="Verify OTP"
                  className="btn btn-secondary"
                >
                  Verify
                </button>
              </div>
            )}
          </div>
          
          <div id="otpHelp" className="form-help mt-xs">
            {otpStatus === 'sent' 
              ? 'Enter the 4 digit code sent to your phone.' 
              : 'Enter phone number then press Send OTP.'
            }
          </div>
        </div>
      )}
      
      <div 
        aria-live="polite" 
        role={otpStatus === 'error' ? 'alert' : undefined}
        className={`otp-message ${otpStatus === 'error' ? 'text-error' : 'text-success'}`}
      >
        {otpMessage}
      </div>
      
      <button 
        type="submit" 
        disabled={otpStatus !== 'verified' || submitting}
        className="btn btn-primary btn-lg w-full"
      >
        {submitting ? 'Booking...' : 'Confirm Booking (Cash)'}
      </button>

      <style jsx>{`
        /* Custom styles specific to this component that use the theme system */
        .form-container {
          max-width: 400px;
        }
        
        .form-grid {
          display: grid;
          gap: var(--space-sm);
        }
        
        .button-group {
          display: flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
        }
        
        .fare-preview {
          background: var(--color-neutral-50);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
        }
        
        .fare-details {
          margin-top: var(--space-xs);
        }
        
        .otp-section {
          display: grid;
          gap: var(--space-xs);
        }
        
        .otp-input {
          width: 90px;
          text-align: center;
        }
        
        .otp-message {
          min-height: 18px;
          font-size: var(--font-size-sm);
        }
        
        /* Responsive adjustments */
        @media (max-width: 480px) {
          .form-container {
            max-width: 100%;
            padding: 0 var(--space-xs);
          }
          
          .button-group {
            flex-direction: column;
          }
          
          .button-group .btn {
            flex: none;
          }
        }
      `}</style>
    </form>
  );
}
