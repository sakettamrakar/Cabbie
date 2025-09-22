import React from 'react';
import Head from 'next/head';
import ModernLayout from '../components/ModernLayout';
import ModernBookingWidget from '../components/ModernBookingWidget';
import { SITE_BRAND } from '../lib/seo';

// Sample data - replace with your actual data
const featuredRoutes = [
  { id: 1, origin: { name: 'Mumbai', slug: 'mumbai' }, destination: { name: 'Pune', slug: 'pune' }, distance_km: 150, price: 2500 },
  { id: 2, origin: { name: 'Delhi', slug: 'delhi' }, destination: { name: 'Jaipur', slug: 'jaipur' }, distance_km: 280, price: 4200 },
  { id: 3, origin: { name: 'Bangalore', slug: 'bangalore' }, destination: { name: 'Chennai', slug: 'chennai' }, distance_km: 350, price: 5200 },
  { id: 4, origin: { name: 'Kolkata', slug: 'kolkata' }, destination: { name: 'Bhubaneswar', slug: 'bhubaneswar' }, distance_km: 450, price: 6800 },
  { id: 5, origin: { name: 'Ahmedabad', slug: 'ahmedabad' }, destination: { name: 'Udaipur', slug: 'udaipur' }, distance_km: 260, price: 3900 },
  { id: 6, origin: { name: 'Hyderabad', slug: 'hyderabad' }, destination: { name: 'Vijayawada', slug: 'vijayawada' }, distance_km: 270, price: 4100 }
];

const benefits = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Safe & Reliable',
    description: 'Professional drivers with verified licenses and insurance coverage for your peace of mind.'
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    title: 'Transparent Pricing',
    description: 'No hidden fees or surge pricing. Know the exact fare before you book with our upfront pricing.'
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '24/7 Available',
    description: 'Round-the-clock service with instant booking confirmation and customer support when you need it.'
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      </svg>
    ),
    title: 'Live Tracking',
    description: 'Real-time GPS tracking so you can monitor your ride and share your journey with family.'
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Instant Booking',
    description: 'Quick OTP-based booking process that gets you confirmed rides in under 60 seconds.'
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: 'Premium Comfort',
    description: 'Well-maintained, air-conditioned vehicles with comfortable seating for a pleasant journey.'
  }
];

const steps = [
  {
    number: '01',
    title: 'Search Routes',
    description: 'Enter your pickup and drop locations to see available routes and pricing.',
    color: 'text-blue-600'
  },
  {
    number: '02', 
    title: 'Choose Cab Type',
    description: 'Select from sedan, hatchback, or SUV based on your group size and preference.',
    color: 'text-green-600'
  },
  {
    number: '03',
    title: 'Confirm Booking',
    description: 'Complete OTP verification and confirm your booking with instant confirmation.',
    color: 'text-purple-600'
  },
  {
    number: '04',
    title: 'Enjoy Your Ride',
    description: 'Track your cab in real-time and enjoy a comfortable, safe journey to your destination.',
    color: 'text-orange-600'
  }
];

export default function ModernHomePage() {
  return (
    <ModernLayout>
      {/* Hero Section */}
      <section className="hero bg-pattern">
        <div className="hero-content text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="hero-title">
              Professional Intercity
              <span className="block text-secondary-400">Taxi Service</span>
            </h1>
            <p className="hero-subtitle">
              Reliable, safe, and comfortable rides connecting cities across India. 
              Book instantly with transparent pricing and professional drivers.
            </p>
          </div>
          
          {/* Booking Widget */}
          <div className="mt-12 max-w-2xl mx-auto">
            <ModernBookingWidget />
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              Popular Routes
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Choose from our most traveled intercity routes with competitive pricing and reliable service.
            </p>
          </div>
          
          <div className="route-grid">
            {featuredRoutes.map(route => (
              <a 
                key={route.id} 
                href={`/${route.origin.slug}/${route.destination.slug}/fare`}
                className="route-card"
              >
                <div className="route-card-header">
                  <div>
                    <h3 className="route-card-title">
                      {route.origin.name} → {route.destination.name}
                    </h3>
                    <div className="route-card-details">
                      <p>Distance: ~{route.distance_km} km</p>
                      <p>Duration: ~{Math.round(route.distance_km / 60 * 1.2)} hours</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="route-card-price">₹{route.price.toLocaleString()}</div>
                    <div className="text-sm text-neutral-500">Starting from</div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
                  <span>View Details</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <a href="/routes" className="btn btn-outline btn-lg">
              View All Routes
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              Why Choose {SITE_BRAND}?
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Experience the difference with our professional intercity taxi service designed for your comfort and safety.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="card card-hover text-center">
                <div className="text-primary-600 mb-4 flex justify-center">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-neutral-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-neutral-600">
              Book your intercity ride in 4 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 ${step.color} text-2xl font-bold mb-4`}>
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Book Your Next Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust {SITE_BRAND} for their intercity travel needs.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <a href="/book" className="btn bg-white text-primary-600 hover:bg-neutral-100 btn-lg">
              Book Now
            </a>
            <a href="/contact" className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </ModernLayout>
  );
}
