'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import NoResults from '@/components/search/NoResults';
import { useSearchResults } from '@/hooks/use-search-results';
import { saveBookingData } from '@/lib/booking-utils';
import type {
  SearchResultsData,
  SearchQueryParams,
  SearchFilters,
  CabOption,
} from '@/types/search.types';

type SortValue = 'price_asc' | 'price_desc' | 'capacity_asc' | 'capacity_desc';

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'capacity_desc', label: 'Capacity: High to Low' },
  { value: 'capacity_asc', label: 'Capacity: Low to High' },
];

interface SearchResultsProps {
  initialData: SearchResultsData | null;
  searchParams: SearchQueryParams;
}

const formatDateParts = (dateTimeString: string) => {
  try {
    const d = new Date(dateTimeString);
    const formatted = d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatted;
  } catch {
    return dateTimeString;
  }
};

const formatDistance = (distance: string | number) => {
  if (distance === undefined || distance === null) {
    return 'Distance unavailable';
  }
  const value = typeof distance === 'string' ? parseFloat(distance) : distance;
  if (Number.isNaN(value)) {
    return `${distance}`;
  }
  return `${value.toFixed(1)} km`;
};

export default function SearchResults({ initialData, searchParams }: SearchResultsProps) {
  const router = useRouter();
  const {
    results,
    filteredResults = [],
    setFilters,
    sortBy,
    setSortBy,
    isLoading,
    error,
    activeFilterCount = 0,
  } = useSearchResults(initialData) || {};

  const summaryDate = results?.pickupDateTime ? formatDateParts(results.pickupDateTime) : '';
  const summaryDistance = results?.distance ? formatDistance(results.distance) : '';

  const displayedOptions = useMemo(() => {
    if (!results?.cabOptions?.length) return [] as CabOption[];
    if (filteredResults && filteredResults.length > 0) {
      return filteredResults;
    }
    return results.cabOptions;
  }, [filteredResults, results]);

  useEffect(() => {
    if (!results?.cabOptions?.length) {
      return;
    }
    try {
      const analyticsEvent = {
        event: 'quote_viewed',
        origin: searchParams.origin,
        destination: searchParams.destination,
        pickup_datetime: searchParams.pickup_datetime,
        option_count: results.cabOptions.length,
      };
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push(analyticsEvent);
    } catch (err) {
      console.warn('Analytics dispatch failed', err);
    }
  }, [results, searchParams]);

  const resetFilters = () => {
    setFilters?.({
      carTypes: [],
      priceRange: [0, 10000],
      minCapacity: 1,
      instantConfirmation: false,
      freeCancellation: false,
    } as SearchFilters);
    setSortBy?.('price_asc');
  };

  const handleEditSearch = () => {
    router.push('/');
  };

  const handleCabSelect = (cab: CabOption) => {
    if (!results) return;
    saveBookingData({
      selectedCab: cab,
      searchParams: {
        origin: searchParams.origin,
        destination: searchParams.destination,
        pickup_datetime: searchParams.pickup_datetime,
        ...(searchParams.return_datetime && { return_datetime: searchParams.return_datetime }),
        ...(searchParams.passengers && { passengers: searchParams.passengers }),
        ...(searchParams.luggage && { luggage: searchParams.luggage }),
      },
    });
    router.push(`/booking/confirmation?cabId=${encodeURIComponent(cab.id)}`);
  };

  if (error) {
    return (
      <div className="search-results__container">
        <div className="card search-results__message search-results__message--error" role="alert">
          <h2>We hit a speed bump</h2>
          <p>{error || 'Failed to load search results. Please try again.'}</p>
          <button type="button" className="cta cta--sm" onClick={() => router.refresh()}>
            Retry search
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="search-results__container">
        <header className="card search-results__header">
          <div>
            <div className="skeleton skeleton-text" style={{ width: '12rem' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '16rem', marginTop: '0.5rem' }}></div>
          </div>
        </header>
        <div className="search-results__list">
          {Array.from({ length: 3 }).map((_, index) => (
            <article key={index} className="card search-card">
              <div className="skeleton skeleton-text" style={{ width: '10rem', marginBottom: '0.75rem' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '18rem', marginBottom: '0.75rem' }}></div>
              <div className="skeleton skeleton-button" style={{ width: '8rem' }}></div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (!results || !results.cabOptions || results.cabOptions.length === 0) {
    return (
      <div className="search-results__container">
        <NoResults onResetFilters={resetFilters} />
      </div>
    );
  }

  const displayDistance = summaryDistance ? `${summaryDistance}` : undefined;

  return (
    <div className="search-results__container">
      <header className="card search-results__header" aria-live="polite">
        <div>
          <h1 className="search-results__title">
            {results.origin.displayName} → {results.destination.displayName}
          </h1>
          <p className="search-results__meta">
            {displayDistance && <span>{displayDistance}</span>}
            {results.duration && <span>{results.duration}</span>}
            {summaryDate && <span>{summaryDate}</span>}
          </p>
        </div>
        <button type="button" className="pill" onClick={handleEditSearch}>
          Edit search
        </button>
      </header>

      <section className="card search-results__toolbar" aria-label="Sort search results">
        <div className="form-field">
          <label htmlFor="sortBy">Sort results</label>
          <select
            id="sortBy"
            name="sortBy"
            value={sortBy || 'price_asc'}
            onChange={(event) => setSortBy?.(event.target.value as SortValue)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {activeFilterCount > 0 && (
          <button type="button" className="pill" onClick={resetFilters}>
            Clear filters ({activeFilterCount})
          </button>
        )}
      </section>

      <div className="search-results__list">
        {displayedOptions.map((cab) => (
          <article key={cab.id} className="card search-card">
            <div className="search-card__body">
              <div className="search-card__content">
                <h2 className="search-card__title">{cab.category}</h2>
                <p className="muted">{cab.carExamples.join(' • ')}</p>
                <ul className="search-card__features">
                  <li>{cab.capacity} seats • {cab.estimatedDuration}</li>
                  {cab.features.slice(0, 3).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="search-card__tags">
                  <span className="pill">{cab.instantConfirmation ? 'Instant confirmation' : 'On request'}</span>
                  <span className="pill">
                    {cab.cancellationPolicy === 'free'
                      ? 'Free cancellation'
                      : cab.cancellationPolicy === 'flexible'
                        ? 'Flexible cancellation'
                        : 'Strict cancellation'}
                  </span>
                </div>
              </div>
              <div className="search-card__meta">
                <div className="pill">{cab.capacity} seats</div>
                <div className="search-card__price">₹{cab.price.toLocaleString()}</div>
                <button type="button" className="cta cta--sm" onClick={() => handleCabSelect(cab)}>
                  Select
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
