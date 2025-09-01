'use client';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
// Using native Date for formatting to avoid external deps
import NoResults from '@/components/search/NoResults';
import { useSearchResults } from '@/hooks/use-search-results';
import { saveBookingData } from '@/lib/booking-utils';
// NoResults imported from './NoResults'
export default function SearchResults({ initialData, searchParams }) {
    const router = useRouter();
    const { results, filteredResults = [], filters, setFilters, sortBy, setSortBy, isLoading, error, activeFilterCount = 0, } = useSearchResults(initialData) || {};
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
    const formatDistance = (distance, unit = 'km') => {
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
                {error || 'Failed to load search results. Please try again.'}
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
    return (<>
      {/* Add consistent styling with the main site */}
      <style jsx global>{`
        .search-results-page {
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          min-height: 100vh;
          padding: 2rem 1rem;
        }
        
        .search-results-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .search-header-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .cab-result-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
        }
        
        .cab-result-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }
        
        .select-cab-btn {
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .select-cab-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-1px);
        }
        
        .price-display {
          color: #1e40af;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .edit-search-btn {
          color: #1e40af;
          background: none;
          border: 1px solid #1e40af;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .edit-search-btn:hover {
          background: #1e40af;
          color: white;
        }
        
        @media (min-width: 768px) {
          .search-results-page {
            padding: 4rem 1rem;
          }
          
          .search-header-card {
            padding: 2rem;
          }
        }
      `}</style>
      
      <div className="search-results-page">
        <div className="search-results-container">
          {/* Header */}
          <header className="search-header-card">
            <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1rem',
            textAlign: 'center'
        }}>
              {origin.displayName} → {destination.displayName}
            </h1>
            
            <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.875rem',
            color: '#6B7280',
            marginBottom: '1.5rem'
        }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>📍</span>
                {formattedDistance}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>⏱️</span>
                {duration}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>📅</span>
                {formattedDateTime.date} at {formattedDateTime.time}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button onClick={handleEditSearch} className="edit-search-btn">
                <span>✏️</span>
                Edit Search
              </button>
            </div>
          </header>

          {/* Results Section */}
          <section>
            <h2 style={{
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1.5rem',
            textAlign: 'center'
        }}>
              Available Cabs ({cabOptions.length} options)
            </h2>
            
            <div>
              {cabOptions.map((cab) => (<article key={cab.id} className="cab-result-card">
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                      {/* Header with Category and Price */}
                      <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                        <div>
                          <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.25rem'
            }}>
                            {cab.category}
                          </h3>
                          <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                marginBottom: '0.5rem'
            }}>
                            {cab.carExamples.join(' • ')}
                          </p>
                          <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.875rem',
                color: '#6B7280',
                marginBottom: '0.75rem'
            }}>
                            <span>� {cab.capacity} seats</span>
                            <span>⏰ {cab.estimatedDuration}</span>
                            <span>⭐ {cab.rating}</span>
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div className="price-display">
                            ₹{cab.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Features and Actions */}
                      <div>
                        <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem 1rem',
                marginBottom: '1rem'
            }}>
                          {cab.features.slice(0, 4).map((feature, i) => (<span key={i} style={{
                    fontSize: '0.75rem',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                }}>
                              <span style={{ color: '#10B981' }}>✓</span>
                              {feature}
                            </span>))}
                        </div>
                        
                        <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                          <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.75rem',
                color: '#6B7280'
            }}>
                            <span style={{
                padding: '0.25rem 0.5rem',
                background: cab.instantConfirmation ? '#DCFCE7' : '#FEF3C7',
                color: cab.instantConfirmation ? '#065F46' : '#92400E',
                borderRadius: '0.25rem'
            }}>
                              {cab.instantConfirmation ? '⚡ Instant' : '⏳ On Request'}
                            </span>
                            <span style={{
                padding: '0.25rem 0.5rem',
                background: '#F3F4F6',
                color: '#374151',
                borderRadius: '0.25rem'
            }}>
                              {cab.cancellationPolicy === 'free' ? '🆓 Free Cancel' :
                cab.cancellationPolicy === 'flexible' ? '🔄 Flexible' : '❌ Strict'}
                            </span>
                          </div>
                          
                          <button onClick={() => handleCabSelect(cab)} className="select-cab-btn">
                            Select Cab
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>))}
            </div>
          </section>
        </div>
      </div>
    </>);
}
