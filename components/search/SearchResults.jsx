'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
// Using native Date for formatting to avoid external deps
import NoResults from '@/components/search/NoResults';
import { useSearchResults } from '@/hooks/use-search-results';
import { saveBookingData } from '@/lib/booking-utils';
// NoResults imported from './NoResults'
export default function SearchResults({ initialData, searchParams }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(!initialData);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(initialData);
    const { filteredResults = [], filters, setFilters, sortBy, setSortBy, activeFilterCount = 0, } = useSearchResults(initialData) || {};
    // Format date and time for display
    const formatDateTime = (dateTimeString) => {
        try {
            const d = new Date(dateTimeString);
            return d.toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true,
            });
        }
        catch (e) {
            return dateTimeString;
        }
    };
    // Format distance for display (handles both string and number inputs)
    // Fetch results if not provided via SSR
    useEffect(() => {
        if (initialData)
            return;
        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const query = new URLSearchParams({
                    origin: searchParams.origin,
                    destination: searchParams.destination,
                    pickup_datetime: searchParams.pickup_datetime,
                    ...(searchParams.return_datetime && { return_datetime: searchParams.return_datetime }),
                    ...(searchParams.passengers && { passengers: searchParams.passengers }),
                    ...(searchParams.luggage && { luggage: searchParams.luggage }),
                }).toString();
                const response = await fetch(`/api/quotes?${query}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch results');
                }
                const data = await response.json();
                setResults(data);
            }
            catch (err) {
                setError(err instanceof Error ? err : new Error('An error occurred'));
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchResults();
    }, [initialData, searchParams]);
    // Format date and time for display (detailed format)
    const formatDetailedDateTime = (dateTimeString) => {
        try {
            const d = new Date(dateTimeString);
            return {
                date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
                time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }),
            };
        }
        catch (e) {
            return { date: dateTimeString, time: '' };
        }
    };
    // Handle filter changes with proper type safety
    const handleFilterChange = (newFilters) => {
        setFilters((prev) => ({
            ...prev,
            ...newFilters,
        }));
    };
    // Reset all filters
    const resetFilters = () => {
        setFilters({
            carTypes: [],
            priceRange: [0, 10000],
            minCapacity: 1,
            instantConfirmation: false,
            freeCancellation: false,
        });
        setSortBy('price_asc');
    };
    // (removed legacy handleSelectCab)
    // Format distance for display (handles both string and number inputs)
    const formatDistance = (distance, unit = 'mi') => {
        try {
            const dist = typeof distance === 'string' ? parseFloat(distance) : distance;
            return `${dist.toFixed(1)} ${unit}`;
        }
        catch (e) {
            return `${distance} ${unit}`;
        }
    };
    // Handle edit search click
    const handleEditSearch = () => {
        router.push('/');
    };
    // Get price range for filter
    const priceRange = useMemo(() => {
        var _a;
        if (!((_a = results === null || results === void 0 ? void 0 : results.cabOptions) === null || _a === void 0 ? void 0 : _a.length))
            return [0, 10000];
        const prices = results.cabOptions.map(cab => cab.price).filter(price => !isNaN(price));
        if (!prices.length)
            return [0, 10000];
        return [
            Math.floor(Math.min(...prices) / 100) * 100, // Round down to nearest 100
            Math.ceil(Math.max(...prices) / 100) * 100, // Round up to nearest 100
        ];
    }, [results]);
    // Handle error state
    if (error) {
        return (<div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error.message || 'Failed to load search results. Please try again.'}
              </p>
              <button onClick={() => window.location.reload()} className="mt-2 text-sm font-medium text-red-700 hover:text-red-600">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>);
    }
    // Show loading state
    if (isLoading) {
        return (<div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (<div key={i} className="p-4 border rounded-lg">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/4 mt-4"></div>
                </div>
              </div>))}
          </div>
        </div>
      </div>);
    }
    // Show error state
    if (error) {
        return (<div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>);
    }
    // Show no results state
    if (!results || !results.cabOptions || results.cabOptions.length === 0) {
        return (<div className="max-w-4xl mx-auto p-4">
        <NoResults onResetFilters={resetFilters}/>
      </div>);
    }
    const { origin, destination, pickupDateTime, distance, duration, cabOptions } = results;
    const formattedDateTime = formatDetailedDateTime(pickupDateTime);
    const formattedDistance = formatDistance(distance.toString());
    // Handle cab selection with proper typing
    const handleCabSelect = (cab) => {
        if (!results)
            return;
        // booking-utils.saveBookingData adds timestamp; pass required fields only
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
    // (features rendering handled inline below)
    // Format date and time for display (already defined above)
    return (<div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {origin.displayName} → {destination.displayName}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {formattedDistance}
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {duration}
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            {formattedDateTime.date} at {formattedDateTime.time}
          </div>
        </div>
        
        <button onClick={handleEditSearch} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Edit Search
        </button>
      </header>

      {/* Results */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Available Rides</h2>
        
        <div className="space-y-4">
          {cabOptions.map((cab) => (<article key={cab.id} className="border rounded-lg overflow-hidden bg-white">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">{cab.category}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {cab.carExamples.join(', ')}
                    </p>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <span className="mr-4">👤 {cab.capacity} passengers</span>
                      <span>⏱️ ~{cab.estimatedDuration}</span>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      {cab.features.map((feature, i) => (<li key={i} className="flex items-center">
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                          </svg>
                          {feature}
                        </li>))}
                    </ul>
                  </div>
                  
                  <div className="flex flex-col items-end mt-4 md:mt-0">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      ₹{cab.price.toLocaleString()}
                    </div>
                    <button onClick={() => handleCabSelect(cab)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </article>))}
        </div>
      </section>
    </div>);
}
