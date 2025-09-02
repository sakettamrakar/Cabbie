import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ModernLayout from '../components/ModernLayout';

export default function SearchResultsPage() {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCab, setSelectedCab] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    phone: ''
  });
  
  const { 
    origin, 
    destination, 
    pickup_datetime, 
    return_datetime,
    passengers = 1,
    luggage = 1,
    trip_type = 'one-way',
    package: selectedPackage,
    pickup_mode,
    flight_number
  } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    
    async function fetchSearchResults() {
      try {
        setLoading(true);
        setError(null);
        
        // Build API URL with query parameters
        const apiUrl = new URL('/api/search-results', window.location.origin);
        Object.entries(router.query).forEach(([key, value]) => {
          if (value) apiUrl.searchParams.set(key, value.toString());
        });
        
        console.log('Fetching search results from:', apiUrl.toString());
        
        const response = await fetch(apiUrl.toString());
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Search results data:', data);
        
        // The API returns data in this format: { origin: {}, destination: {}, cabOptions: [] }
        setSearchResults(data.cabOptions || []);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (origin) {
      fetchSearchResults();
    }
  }, [router.isReady, router.query, origin]);

  const handleBookCab = (cab) => {
    setSelectedCab(cab);
    setShowBookingModal(true);
  };

  const handlePassengerDetailsChange = (e) => {
    const { name, value } = e.target;
    setPassengerDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!passengerDetails.name.trim() || !passengerDetails.phone.trim()) {
      alert('Please fill in all passenger details');
      return;
    }

    setBookingLoading(true);

    try {
      const bookingData = {
        origin,
        destination,
        pickup_datetime,
        return_datetime,
        passengers: parseInt(passengers) || 1,
        luggage: parseInt(luggage) || 1,
        cab_id: selectedCab.id,
        cab_category: selectedCab.category,
        cab_type: selectedCab.carType,
        fare: selectedCab.price,
        estimated_duration: selectedCab.estimatedDuration,
        estimated_distance: selectedCab.estimatedDistance,
        passenger_name: passengerDetails.name.trim(),
        passenger_phone: passengerDetails.phone.trim()
      };

      console.log('Submitting booking:', bookingData);

      const response = await fetch('/api/bookings/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Redirect to booking confirmation
        router.push(`/booking/${result.booking_id}`);
      } else {
        throw new Error(result.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  if (!router.isReady) {
    return (
      <ModernLayout>
        <div className="container py-8">
          <div className="text-center">Loading search parameters...</div>
        </div>
      </ModernLayout>
    );
  }

  if (!origin) {
    return (
      <ModernLayout>
        <Head>
          <title>Search Results | Cabbie</title>
        </Head>
        <div className="container py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Invalid Search</h2>
            <p className="text-red-700">Please provide valid search parameters.</p>
            <button 
              onClick={() => router.push('/')}
              className="btn btn-primary mt-4"
            >
              Back to Home
            </button>
          </div>
        </div>
      </ModernLayout>
    );
  }

  const pageTitle = destination 
    ? `Cabs from ${origin} to ${destination} | Cabbie`
    : `Cabs from ${origin} | Cabbie`;

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch {
      return dateTimeString;
    }
  };

  return (
    <ModernLayout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={`Find and book cabs from ${origin}${destination ? ` to ${destination}` : ''}. Compare prices and book your ride.`} />
      </Head>
      
      {/* Search Summary */}
      <section className="bg-primary-50 py-6">
        <div className="container">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {destination ? `${origin} → ${destination}` : `From ${origin}`}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>📅 {formatDateTime(pickup_datetime)}</span>
                  {return_datetime && <span>🔄 Return: {formatDateTime(return_datetime)}</span>}
                  <span>👥 {passengers} passenger{parseInt(passengers) !== 1 ? 's' : ''}</span>
                  <span>🧳 {luggage} luggage</span>
                  {trip_type && <span>🚗 {trip_type.replace('-', ' ')}</span>}
                </div>
              </div>
              <button 
                onClick={() => router.push('/')}
                className="btn btn-outline"
              >
                Modify Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-8">
        <div className="container">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Searching for available cabs...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Search Error</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && searchResults.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Results Found</h3>
              <p className="text-yellow-700 mb-4">
                No cabs are available for your search criteria. Try adjusting your search parameters.
              </p>
              <button 
                onClick={() => router.push('/')}
                className="btn btn-primary"
              >
                New Search
              </button>
            </div>
          )}

          {!loading && !error && searchResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">
                Available Cabs ({searchResults.length})
              </h2>
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div key={result.id || index} className="card hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {result.category} - {result.carType?.toUpperCase()}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                              ⭐ {result.rating}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {result.carExamples?.join(', ')} or similar
                          </p>
                          <p className="text-gray-600 text-sm mb-3">
                            {result.features?.join(' • ')}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>📍 {result.estimatedDistance}</span>
                            <span>⏱️ {result.estimatedDuration}</span>
                            <span>👥 Up to {result.capacity} passengers</span>
                            <span>🚗 {result.totalRides} rides completed</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600">
                            ₹{result.price}
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            Total fare
                          </p>
                          <div className="space-y-2">
                            {result.instantConfirmation && (
                              <div className="text-xs text-green-600 font-medium">✅ Instant confirmation</div>
                            )}
                            <button 
                              onClick={() => handleBookCab(result)}
                              className="btn btn-primary w-full"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && selectedCab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Complete Your Booking</h3>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                {selectedCab.category} - {selectedCab.carType?.toUpperCase()}
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>📍 {origin} → {destination}</div>
                <div>📅 {formatDateTime(pickup_datetime)}</div>
                <div>💰 ₹{selectedCab.price} total fare</div>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="passenger_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Passenger Name *
                  </label>
                  <input
                    type="text"
                    id="passenger_name"
                    name="name"
                    value={passengerDetails.name}
                    onChange={handlePassengerDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter passenger name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="passenger_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="passenger_phone"
                    name="phone"
                    value={passengerDetails.phone}
                    onChange={handlePassengerDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className={`flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors ${bookingLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Payment: Cash on Delivery (COD) • No online payment required
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
