import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  getBookingData, 
  clearBookingData, 
  isBookingDataValid,
  formatPrice,
  type BookingData
} from '@/lib/booking-utils';
import { validatePhoneNumber, formatPhoneDisplay } from '@/lib/validate';
import Layout from '@/components/Layout';
import { SITE_BRAND } from '@/lib/seo';

interface PassengerDetails {
  name: string;
  phone: string;
}

interface BookingResponse {
  success: boolean;
  booking_id?: string;
  message?: string;
  error?: string;
}

export default function BookingConfirmation() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [passengerDetails, setPassengerDetails] = useState<PassengerDetails>({
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<PassengerDetails>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [bookingError, setBookingError] = useState<string>('');

  useEffect(() => {
    // Try to get booking data from localStorage
    const savedData = getBookingData();
    
    if (savedData && isBookingDataValid(savedData)) {
      setBookingData(savedData);
    } else {
      // No valid booking data, redirect back to search
      router.replace('/');
    }
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PassengerDetails> = {};

    // Validate name
    if (!passengerDetails.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (passengerDetails.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate phone
    if (!passengerDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneValidation = validatePhoneNumber(passengerDetails.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || 'Invalid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !bookingData) return;

    setIsLoading(true);
    setBookingError('');

    try {
      const response = await fetch('/api/bookings/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Trip details
          origin: bookingData.searchParams.origin,
          destination: bookingData.searchParams.destination,
          pickup_datetime: bookingData.searchParams.pickup_datetime,
          return_datetime: bookingData.searchParams.return_datetime,
          passengers: bookingData.searchParams.passengers || '1',
          luggage: bookingData.searchParams.luggage || '0',
          
          // Selected cab details
          cab_id: bookingData.selectedCab.id,
          cab_category: bookingData.selectedCab.category,
          cab_type: bookingData.selectedCab.carType,
          fare: bookingData.selectedCab.price,
          estimated_duration: bookingData.selectedCab.estimatedDuration,
          estimated_distance: bookingData.selectedCab.estimatedDistance,
          
          // Passenger details
          passenger_name: passengerDetails.name.trim(),
          passenger_phone: passengerDetails.phone.trim(),
        }),
      });

      const data: BookingResponse = await response.json();

      if (data.success && data.booking_id) {
        setBookingId(data.booking_id);
        setIsBookingConfirmed(true);
        // Clear booking data from localStorage after successful booking
        clearBookingData();
      } else {
        setBookingError(data.error || data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      setBookingError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPassengerDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof PassengerDetails]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  if (!bookingData) {
    return (
      <Layout>
        <Head>
          <title>Loading... | {SITE_BRAND}</title>
        </Head>
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading booking details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { selectedCab, searchParams } = bookingData;
  const pickupDate = new Date(searchParams.pickup_datetime);
  const formattedDate = pickupDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = pickupDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const trimmedName = passengerDetails.name.trim();
  const trimmedPhone = passengerDetails.phone.trim();
  const phoneValidation: ReturnType<typeof validatePhoneNumber> = trimmedPhone
    ? validatePhoneNumber(trimmedPhone)
    : { isValid: false, error: 'Phone number is required' };
  const isFormReady = trimmedName.length >= 2 && phoneValidation.isValid;
  const isSubmitDisabled = isLoading || !isFormReady;

  if (isBookingConfirmed) {
    const displayPhone = trimmedPhone ? formatPhoneDisplay(trimmedPhone) : '';
    return (
      <Layout>
        <Head>
          <title>Booking Confirmed | {SITE_BRAND}</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="min-h-screen bg-slate-50 px-4 py-12">
          <div className="mx-auto flex w-full max-w-xl items-center justify-center">
            <article className="card w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
              <header
                className="px-6 py-8 text-center text-white sm:px-8"
                style={{
                  background:
                    'linear-gradient(135deg, var(--brand-primary, #2563eb), var(--brand-secondary, #0ea5e9))'
                }}
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Booking confirmed"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-semibold leading-tight">Booking Confirmed!</h1>
                <p className="mt-2 text-sm font-medium text-white/80">
                  Booking Confirmed! Your Booking ID is #{bookingId}.
                </p>
              </header>
              <div className="space-y-6 px-6 py-8 sm:px-8">
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center">
                  <p className="text-sm font-medium text-slate-600">Booking ID</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900" aria-live="polite">
                    #{bookingId}
                  </p>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">Passenger:</span>{' '}
                    {passengerDetails.name}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Phone:</span> {displayPhone}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Trip:</span> {searchParams.origin} →{' '}
                    {searchParams.destination}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => router.push('/')}
                    type="button"
                    className="cta inline-flex w-full items-center justify-center rounded-xl border border-transparent bg-[var(--brand-primary,#2563eb)] px-5 py-3 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary,#2563eb)] hover:bg-[var(--brand-primary-dark,#1d4ed8)] active:translate-y-px"
                  >
                    Go to Home
                  </button>
                  <button
                    onClick={() => router.push('/booking')}
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--brand-primary,#2563eb)] px-5 py-3 text-sm font-semibold text-[var(--brand-primary,#2563eb)] transition hover:bg-[var(--brand-primary,#2563eb)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary,#2563eb)] active:translate-y-px"
                  >
                    View My Bookings
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Confirm Your Booking | {SITE_BRAND}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <article className="card overflow-hidden rounded-3xl bg-white shadow-2xl">
            <header
              className="px-6 py-8 text-white sm:px-8"
              style={{
                background:
                  'linear-gradient(135deg, var(--brand-primary, #2563eb), var(--brand-secondary, #0ea5e9))'
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Step 3 of 4</p>
              <h1 className="mt-3 text-3xl font-semibold leading-snug">Confirm Your Booking</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Review your trip details and add passenger information to secure your ride.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8 px-6 py-8 sm:px-8">
              <section className="trip-summary space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <svg
                      className="h-6 w-6 text-[var(--brand-primary,#2563eb)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Trip summary"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Trip Summary
                  </h2>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Total fare"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    {formatPrice(selectedCab.price)}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  {searchParams.origin} <span className="text-slate-400">→</span> {searchParams.destination}
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-[32px,1fr] items-start gap-4">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                      role="img"
                      aria-label="Pickup location"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M10 2a6 6 0 016 6c0 4.418-6 10-6 10S4 12.418 4 8a6 6 0 016-6zm0 8a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pickup</p>
                      <p className="text-base font-medium text-slate-900">{searchParams.origin}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[32px,1fr] items-start gap-4">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600"
                      role="img"
                      aria-label="Drop-off location"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M5.05 3.636a7 7 0 019.9 0C17.057 5.743 18 8.417 18 12a2 2 0 01-2 2h-1.586l-.707.707A1 1 0 0112 14.293V13a1 1 0 011-1h3c0-2.917-.743-4.9-2.05-6.364a5 5 0 00-7.9 0C4.743 7.1 4 9.083 4 12v5a1 1 0 01-1.447.894l-1-0.5A1 1 0 011 16.5V12c0-3.583.943-6.257 3.05-8.364z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drop</p>
                      <p className="text-base font-medium text-slate-900">{searchParams.destination}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[32px,1fr] items-start gap-4">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600"
                      role="img"
                      aria-label="Pickup date and time"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h4m-4 4h2" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date &amp; Time</p>
                      <p className="text-base font-medium text-slate-900">{formattedDate}</p>
                      <p className="text-sm font-semibold text-[var(--brand-primary,#2563eb)]">{formattedTime}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[32px,1fr] items-start gap-4">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600"
                      role="img"
                      aria-label="Vehicle class"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 13l1-3a4 4 0 013.8-2.8h8.4A4 4 0 0120 10l1 3v5a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1v-5z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16h0M17 16h0" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle Class</p>
                      <p className="text-base font-medium text-slate-900">{selectedCab.category}</p>
                      <p className="text-sm text-slate-600">{selectedCab.carExamples.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[32px,1fr] items-start gap-4">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"
                      role="img"
                      aria-label="Estimated distance and duration"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 20h-2v-6H5l7-10 7 10h-6v6z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Journey</p>
                      <p className="text-sm font-medium text-slate-900">{selectedCab.estimatedDistance}</p>
                      <p className="text-sm text-slate-600">{selectedCab.estimatedDuration}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="passenger-form space-y-6 border-t border-slate-200 pt-6">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <svg
                      className="h-6 w-6 text-[var(--brand-primary,#2563eb)]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Passenger details"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Passenger Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    We&apos;ll use these details to share driver updates and your booking receipt.
                  </p>
                </div>

                {bookingError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4" role="alert">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-200 text-rose-700" role="img" aria-label="Error">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-7a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-rose-700">{bookingError}</p>
                        <p className="text-rose-600">Please review your details and try again.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="form-row space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      Full Name <span className="text-rose-500" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-[var(--brand-secondary,#0ea5e9)]"
                        role="img"
                        aria-label="Full name"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={passengerDetails.name}
                        onChange={handleInputChange}
                        minLength={2}
                        required
                        aria-invalid={Boolean(errors.name)}
                        className={`min-h-[44px] w-full rounded-lg border px-3 pl-11 pr-3 text-base text-slate-900 placeholder:text-slate-400 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary,#2563eb)] ${
                          errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                        placeholder="Enter passenger name"
                        autoComplete="name"
                      />
                    </div>
                    {errors.name ? (
                      <p className="flex items-center gap-2 text-sm text-rose-600" role="alert">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-7a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.name}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">Please enter the traveller&apos;s full name as it appears on ID.</p>
                    )}
                  </div>

                  <div className="form-row space-y-2">
                    <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      Phone Number <span className="text-rose-500" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-[var(--brand-secondary,#0ea5e9)]"
                        role="img"
                        aria-label="Phone number"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 5a2 2 0 012-2h2.4a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.52 1.23l-1.6.64a11.05 11.05 0 006.32 6.32l.64-1.6a1 1 0 011.23-.52l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1c-7.18 0-13-5.82-13-13V5z"
                          />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={passengerDetails.phone}
                        onChange={handleInputChange}
                        required
                        aria-invalid={Boolean(errors.phone)}
                        autoComplete="tel"
                        inputMode="tel"
                        className={`min-h-[44px] w-full rounded-lg border px-3 pl-11 pr-3 text-base text-slate-900 placeholder:text-slate-400 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary,#2563eb)] ${
                          errors.phone ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.phone ? (
                      <p className="flex items-center gap-2 text-sm text-rose-600" role="alert">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-7a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">We&apos;ll send your booking confirmation and driver details here.</p>
                    )}
                  </div>
                </div>
              </section>

              <footer className="confirmation-actions space-y-4 border-t border-slate-200 pt-6">
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="cta w-full min-h-[48px] rounded-xl bg-[var(--brand-primary,#2563eb)] px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[var(--brand-primary-dark,#1d4ed8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary,#2563eb)] active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                        aria-hidden="true"
                      ></span>
                      <span>Confirming…</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="Confirm booking"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Confirm Booking</span>
                    </span>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500">
                  By confirming, you agree to our terms, privacy policy, and cancellation guidelines.
                </p>
              </footer>
            </form>
          </article>
        </div>
      </div>
    </Layout>
  );
}
