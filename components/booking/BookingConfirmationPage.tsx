import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import {
  clearBookingData,
  formatPrice,
  getBookingData,
  isBookingDataValid,
  type BookingData,
} from '@/lib/booking-utils';
import { SITE_BRAND } from '@/lib/seo';
import { formatPhoneDisplay, validatePhoneNumber } from '@/lib/validate';
import styles from '@/styles/BookingConfirmation.module.css';

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

const BookingConfirmationPage = () => {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [passengerDetails, setPassengerDetails] = useState<PassengerDetails>({
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<PassengerDetails>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const savedData = getBookingData();

    if (savedData && isBookingDataValid(savedData)) {
      setBookingData(savedData);
    } else {
      router.replace('/');
    }
  }, [router]);

  const validateForm = () => {
    const newErrors: Partial<PassengerDetails> = {};

    if (!passengerDetails.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (passengerDetails.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPassengerDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof PassengerDetails]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!validateForm() || !bookingData) {
      return;
    }

    setIsLoading(true);
    setBookingError('');

    try {
      const response = await fetch('/api/bookings/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: bookingData.searchParams.origin,
          destination: bookingData.searchParams.destination,
          pickup_datetime: bookingData.searchParams.pickup_datetime,
          return_datetime: bookingData.searchParams.return_datetime,
          passengers: bookingData.searchParams.passengers || '1',
          luggage: bookingData.searchParams.luggage || '0',
          cab_id: bookingData.selectedCab.id,
          cab_category: bookingData.selectedCab.category,
          cab_type: bookingData.selectedCab.carType,
          fare: bookingData.selectedCab.price,
          estimated_duration: bookingData.selectedCab.estimatedDuration,
          estimated_distance: bookingData.selectedCab.estimatedDistance,
          passenger_name: passengerDetails.name.trim(),
          passenger_phone: passengerDetails.phone.trim(),
        }),
      });

      const data: BookingResponse = await response.json();

      if (data.success && data.booking_id) {
        setBookingId(data.booking_id);
        setIsBookingConfirmed(true);
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

  if (!bookingData) {
    return (
      <Layout>
        <Head>
          <title>Loading... | {SITE_BRAND}</title>
        </Head>
        <div className={styles.page}>
          <div className={styles.container}>
            <article className={`${styles.cardShell} card`}>
              <div className={styles.form}>
                <div className={styles.loadingState} role="status" aria-live="polite">
                  <span className={styles.loadingSpinner} aria-hidden="true" />
                  <p>Loading booking details...</p>
                </div>
              </div>
            </article>
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
    day: 'numeric',
  });
  const formattedTime = pickupDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const trimmedName = passengerDetails.name.trim();
  const trimmedPhone = passengerDetails.phone.trim();
  const phoneValidation = trimmedPhone
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
        <div className={styles.successPage}>
          <div className={styles.container}>
            <article className={`${styles.cardShell} card`}>
              <header className={styles.successHeader}>
                <div className={styles.successIconWrapper}>
                  <svg
                    className={styles.successIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    role="img"
                    aria-label="Booking confirmed"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className={styles.successTitle}>Booking Confirmed!</h1>
                <p className={styles.successSubtitle}>
                  Booking Confirmed! Your Booking ID is #{bookingId}.
                </p>
              </header>

              <div className={styles.successBody}>
                <div className={styles.bookingBadge}>
                  <p className={styles.bookingBadgeLabel}>Booking ID</p>
                  <p className={styles.bookingBadgeValue} aria-live="polite">
                    #{bookingId}
                  </p>
                </div>

                <div className={styles.successDetails}>
                  <p>
                    <span className={styles.successDetailLabel}>Passenger:</span> {passengerDetails.name}
                  </p>
                  <p>
                    <span className={styles.successDetailLabel}>Phone:</span> {displayPhone}
                  </p>
                  <p>
                    <span className={styles.successDetailLabel}>Trip:</span> {searchParams.origin} → {searchParams.destination}
                  </p>
                </div>

                <div className={styles.successActions}>
                  <button
                    type="button"
                    className={`cta ${styles.confirmButton}`}
                    onClick={() => router.push('/')}
                  >
                    Go to Home
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => router.push('/booking')}
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

      <div className={styles.page}>
        <div className={styles.container}>
          <article className={`${styles.cardShell} card`}>
            <header className={styles.cardHeader}>
              <span className={styles.stepLabel}>Step 3 of 4</span>
              <h1 className={styles.title}>Confirm Your Booking</h1>
              <p className={styles.subtitle}>
                Review your trip details and add passenger information to secure your ride.
              </p>
            </header>

            <form onSubmit={handleSubmit} className={styles.form}>
              <section className={`trip-summary ${styles.section} ${styles.tripSummarySection}`}>
                <div className={styles.tripSummaryHeader}>
                  <h2 className={styles.sectionTitle}>
                    <svg
                      className={styles.sectionTitleIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      role="img"
                      aria-label="Trip summary"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Trip Summary
                  </h2>
                  <span className={styles.fareBadge}>
                    <svg
                      className={styles.fareIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
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

                <div className={styles.routeCard}>
                  {searchParams.origin}
                  <span className={styles.routeArrow} aria-hidden="true">
                    →
                  </span>
                  {searchParams.destination}
                </div>

                <div className={styles.summaryGrid}>
                  <div className={styles.summaryRow}>
                    <span className={`${styles.summaryIconCircle} ${styles.pickupIcon}`} aria-hidden="true">
                      <svg className={styles.summaryIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M10 2a6 6 0 016 6c0 4.418-6 10-6 10S4 12.418 4 8a6 6 0 016-6zm0 8a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.summaryLabel}>Pickup</p>
                      <p className={styles.summaryValue}>{searchParams.origin}</p>
                    </div>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={`${styles.summaryIconCircle} ${styles.dropIcon}`} aria-hidden="true">
                      <svg className={styles.summaryIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M5.05 3.636a7 7 0 019.9 0C17.057 5.743 18 8.417 18 12a2 2 0 01-2 2h-1.586l-.707.707A1 1 0 0112 14.293V13a1 1 0 011-1h3c0-2.917-.743-4.9-2.05-6.364a5 5 0 00-7.9 0C4.743 7.1 4 9.083 4 12v5a1 1 0 01-1.447.894l-1-.5A1 1 0 011 16.5V12c0-3.583.943-6.257 3.05-8.364z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.summaryLabel}>Drop</p>
                      <p className={styles.summaryValue}>{searchParams.destination}</p>
                    </div>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={`${styles.summaryIconCircle} ${styles.datetimeIcon}`} aria-hidden="true">
                      <svg
                        className={styles.summaryIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h4m-4 4h2" />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.summaryLabel}>Date &amp; Time</p>
                      <p className={styles.summaryValue}>{formattedDate}</p>
                      <p className={`${styles.summaryMeta} ${styles.highlight}`}>{formattedTime}</p>
                    </div>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={`${styles.summaryIconCircle} ${styles.vehicleIcon}`} aria-hidden="true">
                      <svg
                        className={styles.summaryIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 13l1-3a4 4 0 013.8-2.8h8.4A4 4 0 0120 10l1 3v5a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1v-5z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16h0M17 16h0" />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.summaryLabel}>Vehicle Class</p>
                      <p className={styles.summaryValue}>{selectedCab.category}</p>
                      <p className={styles.summaryMeta}>{selectedCab.carExamples.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={`${styles.summaryIconCircle} ${styles.journeyIcon}`} aria-hidden="true">
                      <svg
                        className={styles.summaryIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 20h-2v-6H5l7-10 7 10h-6v6z" />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.summaryLabel}>Estimated Journey</p>
                      <p className={styles.summaryValue}>{selectedCab.estimatedDistance}</p>
                      <p className={styles.summaryMeta}>{selectedCab.estimatedDuration}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className={`passenger-form ${styles.section} ${styles.passengerSection}`}>
                <div className={styles.passengerIntro}>
                  <h2 className={styles.sectionTitle}>
                    <svg
                      className={styles.sectionTitleIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      role="img"
                      aria-label="Passenger details"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Passenger Details
                  </h2>
                  <p className={styles.passengerSubtitle}>
                    We&apos;ll use these details to share driver updates and your booking receipt.
                  </p>
                </div>

                {bookingError && (
                  <div className={styles.errorAlert} role="alert">
                    <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-7a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className={styles.errorHeadline}>{bookingError}</p>
                      <p className={styles.errorDescription}>Please review your details and try again.</p>
                    </div>
                  </div>
                )}

                <div className={styles.formFields}>
                  <div className={`form-row ${styles.formRow}`}>
                    <label htmlFor="name" className={styles.label}>
                      Full Name <span className={styles.requiredMark} aria-hidden="true">*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <svg
                        className={styles.inputIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={passengerDetails.name}
                        onChange={handleInputChange}
                        minLength={2}
                        required
                        aria-invalid={Boolean(errors.name)}
                        placeholder="Enter passenger name"
                        autoComplete="name"
                        className={styles.input}
                      />
                    </div>
                    {errors.name ? (
                      <p className={styles.errorMessage} role="alert">
                        <svg className={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-7a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.name}
                      </p>
                    ) : (
                      <p className={styles.helperText}>
                        Please enter the traveller&apos;s full name as it appears on ID.
                      </p>
                    )}
                  </div>

                  <div className={`form-row ${styles.formRow}`}>
                    <label htmlFor="phone" className={styles.label}>
                      Phone Number <span className={styles.requiredMark} aria-hidden="true">*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <svg
                        className={styles.inputIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h2.4a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.52 1.23l-1.6.64a11.05 11.05 0 006.32 6.32l.64-1.6a1 1 0 011.23-.52l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1c-7.18 0-13-5.82-13-13V5z"
                        />
                      </svg>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={passengerDetails.phone}
                        onChange={handleInputChange}
                        required
                        aria-invalid={Boolean(errors.phone)}
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="Enter phone number"
                        className={styles.input}
                      />
                    </div>
                    {errors.phone ? (
                      <p className={styles.errorMessage} role="alert">
                        <svg className={styles.buttonIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm1-7a1 1 0 00-1 1v4a1 1 0 102 0V7a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.phone}
                      </p>
                    ) : (
                      <p className={styles.helperText}>
                        We&apos;ll send your booking confirmation and driver details here.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <footer className={`confirmation-actions ${styles.actions}`}>
                <button
                  type="submit"
                  className={`cta ${styles.confirmButton}`}
                  disabled={isSubmitDisabled}
                >
                  {isLoading ? (
                    <span className={styles.buttonContent}>
                      <span className={styles.spinner} aria-hidden="true" />
                      <span>Confirming…</span>
                    </span>
                  ) : (
                    <span className={styles.buttonContent}>
                      <svg
                        className={styles.buttonIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Confirm Booking</span>
                    </span>
                  )}
                </button>
                <p className={styles.policy}>
                  By confirming, you agree to our terms, privacy policy, and cancellation guidelines.
                </p>
              </footer>
            </form>
          </article>
        </div>
      </div>
    </Layout>
  );
};

export default BookingConfirmationPage;
