'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { features } from '@/config/features';
import NoResults from '@/components/search/NoResults';
import { useSearchResults } from '@/hooks/use-search-results';
import { saveBookingData } from '@/lib/booking-utils';
import { resolveCarExamples } from '@/lib/car-examples';
import { toTitleCase } from '@/lib/strings';
const SORT_OPTIONS = [
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'capacity_desc', label: 'Capacity: High to Low' },
    { value: 'capacity_asc', label: 'Capacity: Low to High' },
];
function MapPinIcon(props) {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 21.75s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0c0 7.142-7.5 11.25-7.5 11.25z"/>
      <circle cx="12" cy="10.5" r="2.25"/>
    </svg>);
}
function FlagIcon(props) {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.5 3v18"/>
      <path d="M4.5 5.25l4.5-1.5 4.5 1.5v9l-4.5-1.5-4.5 1.5"/>
    </svg>);
}
function ClockIcon(props) {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7.5v5.25l3 1.5"/>
    </svg>);
}
function CarIcon(props) {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>);
}
function InfoIcon(props) {
    return (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="8"/>
      <path d="M10 10v4"/>
      <circle cx="10" cy="6.5" r="0.75" fill="currentColor" stroke="none"/>
    </svg>);
}
const formatDateParts = (dateTimeString) => {
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
    }
    catch {
        return dateTimeString;
    }
};
const formatDistance = (distance) => {
    if (distance === undefined || distance === null) {
        return 'Distance unavailable';
    }
    const value = typeof distance === 'string' ? parseFloat(distance) : distance;
    if (Number.isNaN(value)) {
        return `${distance}`;
    }
    return `${value.toFixed(1)} km`;
};
export default function SearchResults({ initialData, searchParams }) {
    var _a, _b;
    const router = useRouter();
    const { results, filteredResults = [], setFilters, sortBy, setSortBy, isLoading, error, activeFilterCount = 0, } = useSearchResults(initialData) || {};
    const originLabel = useMemo(() => {
        var _a, _b, _c;
        const fallback = (_c = (_b = (_a = results === null || results === void 0 ? void 0 : results.origin) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : searchParams.origin) !== null && _c !== void 0 ? _c : '';
        const formatted = toTitleCase(fallback);
        return formatted || fallback;
    }, [(_a = results === null || results === void 0 ? void 0 : results.origin) === null || _a === void 0 ? void 0 : _a.displayName, searchParams.origin]);
    const destinationLabel = useMemo(() => {
        var _a, _b, _c;
        const fallback = (_c = (_b = (_a = results === null || results === void 0 ? void 0 : results.destination) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : searchParams.destination) !== null && _c !== void 0 ? _c : '';
        const formatted = toTitleCase(fallback);
        return formatted || fallback;
    }, [(_b = results === null || results === void 0 ? void 0 : results.destination) === null || _b === void 0 ? void 0 : _b.displayName, searchParams.destination]);
    const { roofCarrierUI } = features;
    const summaryDate = (results === null || results === void 0 ? void 0 : results.pickupDateTime) ? formatDateParts(results.pickupDateTime) : '';
    const summaryDistance = (results === null || results === void 0 ? void 0 : results.distance) ? formatDistance(results.distance) : '';
    const displayedOptions = useMemo(() => {
        var _a;
        if (!((_a = results === null || results === void 0 ? void 0 : results.cabOptions) === null || _a === void 0 ? void 0 : _a.length))
            return [];
        if (filteredResults && filteredResults.length > 0) {
            return filteredResults;
        }
        return results.cabOptions;
    }, [filteredResults, results]);
    useEffect(() => {
        var _a;
        if (!((_a = results === null || results === void 0 ? void 0 : results.cabOptions) === null || _a === void 0 ? void 0 : _a.length)) {
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
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(analyticsEvent);
        }
        catch (err) {
            console.warn('Analytics dispatch failed', err);
        }
    }, [results, searchParams]);
    const resetFilters = () => {
        setFilters === null || setFilters === void 0 ? void 0 : setFilters({
            carTypes: [],
            priceRange: [0, 10000],
            minCapacity: 1,
            instantConfirmation: false,
            freeCancellation: false,
        });
        setSortBy === null || setSortBy === void 0 ? void 0 : setSortBy('price_asc');
    };
    const handleEditSearch = () => {
        router.push('/');
    };
    const handleCabSelect = (cab) => {
        if (!results)
            return;
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
        return (<div className="search-results__container">
        <div className="card search-results__message search-results__message--error" role="alert">
          <h2>We hit a speed bump</h2>
          <p>{error || 'Failed to load search results. Please try again.'}</p>
          <button type="button" className="cta cta--sm" onClick={() => router.refresh()}>
            Retry search
          </button>
        </div>
      </div>);
    }
    if (isLoading) {
        return (<div className="search-results__container">
        <header className="card search-results__header">
          <div>
            <div className="skeleton skeleton-text" style={{ width: '12rem' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '16rem', marginTop: '0.5rem' }}></div>
          </div>
        </header>
        <div className="search-results__list">
          {Array.from({ length: 3 }).map((_, index) => (<article key={index} className="card search-card">
              <div className="skeleton skeleton-text" style={{ width: '10rem', marginBottom: '0.75rem' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '18rem', marginBottom: '0.75rem' }}></div>
              <div className="skeleton skeleton-button" style={{ width: '8rem' }}></div>
            </article>))}
        </div>
      </div>);
    }
    if (!results || !results.cabOptions || results.cabOptions.length === 0) {
        return (<div className="search-results__container">
        <NoResults onResetFilters={resetFilters}/>
      </div>);
    }
    const displayDistance = summaryDistance ? `${summaryDistance}` : undefined;
    const distanceDurationText = [displayDistance, results === null || results === void 0 ? void 0 : results.duration]
        .filter(Boolean)
        .join(' • ');
    const pickupText = summaryDate ? `Pickup: ${summaryDate}` : '';
    return (<div className="search-results__container">
      <header className="card search-results__header" aria-live="polite">
        <div>
          <h1 className="search-results__title">
            <span className="search-results__location">
              <MapPinIcon className="icon-24"/>
              <span>{originLabel}</span>
            </span>
            <span className="search-results__arrow" aria-hidden="true">
              →
            </span>
            <span className="search-results__location">
              <FlagIcon className="icon-24"/>
              <span>{destinationLabel}</span>
            </span>
          </h1>
          <ul className="search-results__meta" role="list">
            {distanceDurationText && (<li>
                <CarIcon className="icon-20"/>
                <span>{distanceDurationText}</span>
              </li>)}
            {pickupText && (<li>
                <ClockIcon className="icon-20"/>
                <span>{pickupText}</span>
              </li>)}
          </ul>
        </div>
        <button type="button" className="pill" onClick={handleEditSearch}>
          Edit search
        </button>
      </header>

      <section className="card search-results__toolbar" aria-label="Sort search results">
        <div className="form-field">
          <label htmlFor="sortBy">Sort results</label>
          <select id="sortBy" name="sortBy" value={sortBy || 'price_asc'} onChange={(event) => setSortBy === null || setSortBy === void 0 ? void 0 : setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => (<option key={option.value} value={option.value}>
                {option.label}
              </option>))}
          </select>
        </div>
        {activeFilterCount > 0 && (<button type="button" className="pill" onClick={resetFilters}>
            Clear filters ({activeFilterCount})
          </button>)}
      </section>

      <div className="search-results__list">
        {displayedOptions.map((cab) => (<article key={cab.id} className="card search-card">
            <div className="search-card__body">
              <div className="search-card__content">
                <h2 className="search-card__title">{cab.category}</h2>
                <p className="muted">{resolveCarExamples(cab).join(' • ')}</p>
                <ul className="search-card__features">
                  <li>{cab.capacity} seats • {cab.estimatedDuration}</li>
                  {cab.features.slice(0, 3).map((feature) => (<li key={feature}>{feature}</li>))}
                </ul>
                {roofCarrierUI && (<div className="search-card__addon" role="note" title="Great for extra luggage">
                    <InfoIcon className="icon-16" focusable="false"/>
                    <span>Roof carrier available starting @ ₹158</span>
                  </div>)}
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
          </article>))}
      </div>
    </div>);
}
