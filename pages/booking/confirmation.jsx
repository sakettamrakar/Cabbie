import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { getBookingData, clearBookingData, isBookingDataValid, formatPrice } from '@/lib/booking-utils';
import { validatePhoneNumber, formatPhoneDisplay } from '@/lib/validate';
import Layout from '@/components/Layout';
export default function BookingConfirmation() {
    const router = useRouter();
    const [bookingData, setBookingData] = useState(null);
    const [passengerDetails, setPassengerDetails] = useState({
        name: '',
        phone: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
    const [bookingId, setBookingId] = useState('');
    const [bookingError, setBookingError] = useState('');
    useEffect(() => {
        // Try to get booking data from localStorage
        const savedData = getBookingData();
        if (savedData && isBookingDataValid(savedData)) {
            setBookingData(savedData);
        }
        else {
            // No valid booking data, redirect back to search
            router.replace('/');
        }
    }, [router]);
    const validateForm = () => {
        const newErrors = {};
        // Validate name
        if (!passengerDetails.name.trim()) {
            newErrors.name = 'Name is required';
        }
        else if (passengerDetails.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }
        // Validate phone
        if (!passengerDetails.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }
        else {
            const phoneValidation = validatePhoneNumber(passengerDetails.phone);
            if (!phoneValidation.isValid) {
                newErrors.phone = phoneValidation.error || 'Invalid phone number';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || !bookingData)
            return;
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
            const data = await response.json();
            if (data.success && data.booking_id) {
                setBookingId(data.booking_id);
                setIsBookingConfirmed(true);
                // Clear booking data from localStorage after successful booking
                clearBookingData();
            }
            else {
                setBookingError(data.error || data.message || 'Failed to create booking');
            }
        }
        catch (error) {
            console.error('Booking submission error:', error);
            setBookingError('Something went wrong. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPassengerDetails(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };
    if (!bookingData) {
        return (<Layout>
        <Head>
          <title>Loading... | Cabbie</title>
        </Head>
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading booking details...</p>
            </div>
          </div>
        </div>
      </Layout>);
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
    if (isBookingConfirmed) {
        return (<Layout>
        <Head>
          <title>Booking Confirmed | Cabbie</title>
          <meta name="robots" content="noindex"/>
        </Head>
        
        {/* Success Page with Company Branding */}
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
          <div className="max-w-4xl mx-auto p-4 py-8">
            
            {/* Header with Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Cabbie</h1>
              </div>
              <p className="text-gray-600 text-lg">Your Trusted Travel Partner</p>
            </div>

            {/* Success Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
              
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center text-white">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
                <p className="text-green-100 text-lg">Your cab has been successfully booked</p>
              </div>

              {/* Booking ID Section */}
              <div className="p-6 bg-gray-50 border-b">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Your Booking ID</p>
                  <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                      <path d="M8 10a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                      <path d="M8 13a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                    </svg>
                    <span className="text-xl font-bold">{bookingId}</span>
                  </div>
                </div>
              </div>

              {/* Trip Details Grid */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Trip Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Trip Details
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm text-gray-600">From</p>
                          <p className="font-semibold text-gray-900">{searchParams.origin}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm text-gray-600">To</p>
                          <p className="font-semibold text-gray-900">{searchParams.destination}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm text-gray-600">Date & Time</p>
                          <p className="font-semibold text-gray-900">{formattedDate}</p>
                          <p className="font-semibold text-green-600">{formattedTime}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger & Fare Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      Passenger Details
                    </h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold">{passengerDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{formatPhoneDisplay(passengerDetails.phone)}</span>
                      </div>
                    </div>

                    {/* Cab Details */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-8 relative">
                            <Image src={selectedCab.imageUrl || '/images/default-car.png'} alt={selectedCab.category} fill className="object-contain"/>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{selectedCab.category}</p>
                            <p className="text-xs text-gray-600">{selectedCab.carExamples.slice(0, 2).join(', ')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{formatPrice(selectedCab.price)}</p>
                          <p className="text-xs text-gray-600">{selectedCab.estimatedDistance} • {selectedCab.estimatedDuration}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-t">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        SMS with driver details will be sent shortly
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        Current status: <span className="font-semibold text-orange-600">PENDING</span> driver assignment
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                        Check your phone for updates
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => router.push('/')} className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Book Another Ride
              </button>
              <button onClick={() => window.print()} className="flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Print Details
              </button>
              <button onClick={() => {
                if (navigator.share) {
                    navigator.share({
                        title: 'Cab Booking Confirmed',
                        text: `Booking ID: ${bookingId} - From ${searchParams.origin} to ${searchParams.destination}`,
                        url: window.location.href
                    });
                }
            }} className="flex items-center justify-center px-8 py-3 bg-green-100 text-green-700 font-semibold rounded-xl hover:bg-green-200 transition-all duration-200 shadow-lg hover:shadow-xl sm:block hidden">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                </svg>
                Share Details
              </button>
            </div>
          </div>
        </div>
      </Layout>);
    }
    return (<Layout>
      <Head>
        <title>Confirm Your Booking | Cabbie</title>
        <meta name="robots" content="noindex"/>
      </Head>
      
      {/* Enhanced Booking Confirmation Form */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto p-4 py-8">
          
          {/* Header with Company Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Cabbie</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Confirm Your Booking</h2>
            <p className="text-gray-600 text-lg">Review your trip details and enter passenger information</p>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mt-6 space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">Search</span>
              </div>
              <div className="w-8 h-1 bg-green-500 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">Select</span>
              </div>
              <div className="w-8 h-1 bg-blue-500 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Confirm</span>
              </div>
              <div className="w-8 h-1 bg-gray-300 rounded"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                  4
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Complete</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Trip Summary - Left Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Trip Summary</h3>
                  <p className="text-blue-100">Review your journey details</p>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Route */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">From</p>
                        <p className="font-semibold text-gray-900 text-lg">{searchParams.origin}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-2">
                      <div className="w-0 h-8 border-l-2 border-dashed border-gray-300"></div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">To</p>
                        <p className="font-semibold text-gray-900 text-lg">{searchParams.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</p>
                        <p className="font-semibold text-gray-900">{formattedDate}</p>
                        <p className="font-semibold text-blue-600">{formattedTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Car */}
                  <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 relative">
                          <Image src={selectedCab.imageUrl || '/images/default-car.png'} alt={selectedCab.category} fill className="object-contain"/>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{selectedCab.category}</p>
                          <p className="text-sm text-gray-600">{selectedCab.carExamples.slice(0, 2).join(', ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatPrice(selectedCab.price)}</p>
                        <p className="text-xs text-gray-600">{selectedCab.estimatedDistance} • {selectedCab.estimatedDuration}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedCab.features.slice(0, 4).map((feature, index) => (<span key={index} className="px-3 py-1 bg-white text-gray-700 text-xs font-medium rounded-full border">
                          {feature}
                        </span>))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form - Right Column */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Passenger Information</h3>
                  <p className="text-indigo-100">Please provide your contact details</p>
                </div>

                <div className="p-8">
                  {bookingError && (<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                        <div>
                          <p className="text-red-800 font-medium">Booking Error</p>
                          <p className="text-red-700 text-sm mt-1">{bookingError}</p>
                        </div>
                      </div>
                    </div>)}
                  
                  <div className="space-y-6">
                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                        Full Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                        </div>
                        <input type="text" id="name" name="name" value={passengerDetails.name} onChange={handleInputChange} className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`} placeholder="Enter your full name" autoComplete="name"/>
                      </div>
                      {errors.name && (<p className="text-red-600 text-sm mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          {errors.name}
                        </p>)}
                    </div>
                    
                    {/* Phone Field */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-3">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                          </svg>
                        </div>
                        <input type="tel" id="phone" name="phone" value={passengerDetails.phone} onChange={handleInputChange} className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`} placeholder="+91 XXXXX XXXXX" autoComplete="tel"/>
                      </div>
                      {errors.phone ? (<p className="text-red-600 text-sm mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          {errors.phone}
                        </p>) : (<p className="text-gray-500 text-sm mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          We&apos;ll send booking details and driver information to this number
                        </p>)}
                    </div>
                  </div>

                  {/* Fare Summary */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-100">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                          </svg>
                          Total Fare
                        </h4>
                        <span className="text-3xl font-bold text-green-600">{formatPrice(selectedCab.price)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Includes all taxes • Cash payment on pickup
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-8">
                    <button type="submit" disabled={isLoading} className={`w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${isLoading
            ? 'opacity-75 cursor-not-allowed'
            : 'hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]'}`}>
                      {isLoading ? (<div className="flex items-center justify-center space-x-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Confirming Your Booking...</span>
                        </div>) : (<div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span>Confirm Booking</span>
                        </div>)}
                    </button>
                    
                    <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      By confirming, you agree to our terms and cancellation policy
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>);
}
