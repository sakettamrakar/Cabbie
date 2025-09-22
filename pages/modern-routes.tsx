import React, { useState } from 'react';
import ModernLayout from '../components/ModernLayout';
import { SITE_BRAND } from '../lib/seo';

interface Route {
  id: number;
  origin: { name: string; slug: string };
  destination: { name: string; slug: string };
  distance_km: number;
  base_price: number;
  duration_hours: number;
  car_types: Array<{
    type: 'HATCHBACK' | 'SEDAN' | 'SUV';
    price: number;
    features: string[];
  }>;
}

// Sample route data - replace with your actual data fetching
const routes: Route[] = [
  {
    id: 1,
    origin: { name: 'Mumbai', slug: 'mumbai' },
    destination: { name: 'Pune', slug: 'pune' },
    distance_km: 150,
    base_price: 2500,
    duration_hours: 3,
    car_types: [
      { type: 'HATCHBACK', price: 2500, features: ['4 Seats', 'AC', 'Basic'] },
      { type: 'SEDAN', price: 3200, features: ['4 Seats', 'AC', 'Comfortable'] },
      { type: 'SUV', price: 4500, features: ['6-7 Seats', 'AC', 'Spacious'] }
    ]
  },
  {
    id: 2,
    origin: { name: 'Delhi', slug: 'delhi' },
    destination: { name: 'Jaipur', slug: 'jaipur' },
    distance_km: 280,
    base_price: 4200,
    duration_hours: 5,
    car_types: [
      { type: 'HATCHBACK', price: 4200, features: ['4 Seats', 'AC', 'Basic'] },
      { type: 'SEDAN', price: 5400, features: ['4 Seats', 'AC', 'Comfortable'] },
      { type: 'SUV', price: 7200, features: ['6-7 Seats', 'AC', 'Spacious'] }
    ]
  },
  {
    id: 3,
    origin: { name: 'Bangalore', slug: 'bangalore' },
    destination: { name: 'Chennai', slug: 'chennai' },
    distance_km: 350,
    base_price: 5200,
    duration_hours: 6,
    car_types: [
      { type: 'HATCHBACK', price: 5200, features: ['4 Seats', 'AC', 'Basic'] },
      { type: 'SEDAN', price: 6800, features: ['4 Seats', 'AC', 'Comfortable'] },
      { type: 'SUV', price: 9100, features: ['6-7 Seats', 'AC', 'Spacious'] }
    ]
  },
  {
    id: 4,
    origin: { name: 'Kolkata', slug: 'kolkata' },
    destination: { name: 'Bhubaneswar', slug: 'bhubaneswar' },
    distance_km: 450,
    base_price: 6800,
    duration_hours: 7,
    car_types: [
      { type: 'HATCHBACK', price: 6800, features: ['4 Seats', 'AC', 'Basic'] },
      { type: 'SEDAN', price: 8800, features: ['4 Seats', 'AC', 'Comfortable'] },
      { type: 'SUV', price: 11700, features: ['6-7 Seats', 'AC', 'Spacious'] }
    ]
  },
  {
    id: 5,
    origin: { name: 'Ahmedabad', slug: 'ahmedabad' },
    destination: { name: 'Udaipur', slug: 'udaipur' },
    distance_km: 260,
    base_price: 3900,
    duration_hours: 4.5,
    car_types: [
      { type: 'HATCHBACK', price: 3900, features: ['4 Seats', 'AC', 'Basic'] },
      { type: 'SEDAN', price: 5100, features: ['4 Seats', 'AC', 'Comfortable'] },
      { type: 'SUV', price: 6800, features: ['6-7 Seats', 'AC', 'Spacious'] }
    ]
  },
  {
    id: 6,
    origin: { name: 'Hyderabad', slug: 'hyderabad' },
    destination: { name: 'Vijayawada', slug: 'vijayawada' },
    distance_km: 270,
    base_price: 4100,
    duration_hours: 4,
    car_types: [
      { type: 'HATCHBACK', price: 4100, features: ['4 Seats', 'AC', 'Basic'] },
      { type: 'SEDAN', price: 5300, features: ['4 Seats', 'AC', 'Comfortable'] },
      { type: 'SUV', price: 7100, features: ['6-7 Seats', 'AC', 'Spacious'] }
    ]
  }
];

export default function ModernRoutes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarType, setSelectedCarType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'name'>('name');

  const filteredRoutes = routes
    .filter(route => {
      const searchMatch = !searchTerm || 
        route.origin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destination.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const carTypeMatch = selectedCarType === 'ALL' || 
        route.car_types.some(ct => ct.type === selectedCarType);
      
      return searchMatch && carTypeMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance_km - b.distance_km;
        case 'price':
          return a.base_price - b.base_price;
        case 'name':
        default:
          return a.origin.name.localeCompare(b.origin.name);
      }
    });

  return (
    <ModernLayout
      title={`All Routes - ${SITE_BRAND} Intercity Taxi Service`}
      description={`Browse all available intercity taxi routes with ${SITE_BRAND}. Transparent pricing and instant booking.`}
    >
      {/* Header Section */}
      <section className="bg-neutral-900 text-white py-12 lg:py-16">
        <div className="container text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            All Available Routes
          </h1>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            Choose from our extensive network of intercity routes with professional drivers and competitive pricing.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white border-b border-neutral-200">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search routes (city names)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10 w-full"
                />
              </div>
            </div>

            {/* Car Type Filter */}
            <div>
              <select
                value={selectedCarType}
                onChange={(e) => setSelectedCarType(e.target.value)}
                className="form-select"
              >
                <option value="ALL">All Car Types</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'distance' | 'price' | 'name')}
                className="form-select"
              >
                <option value="name">Sort by Name</option>
                <option value="distance">Sort by Distance</option>
                <option value="price">Sort by Price</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-neutral-600">
            Showing {filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </div>
      </section>

      {/* Routes Grid */}
      <section className="py-12 bg-neutral-50">
        <div className="container">
          <div className="grid-3 route-grid">
            {filteredRoutes.map(route => (
              <article key={route.id} className="card route-card">
                <header className="route-card__header">
                  <div>
                    <h2 className="route-card__title">{route.origin.name} → {route.destination.name}</h2>
                    <p className="route-card__meta">
                      <span>{route.distance_km} km</span>
                      <span>~{route.duration_hours} hrs</span>
                    </p>
                  </div>
                  <div className="route-card__price">
                    <strong>₹{route.base_price.toLocaleString()}</strong>
                    <span className="muted">Starting fare</span>
                  </div>
                </header>

                <div className="route-card__body">
                  <h3>Available car types</h3>
                  <div className="route-card__car-grid">
                    {route.car_types.map(carType => (
                      <div key={carType.type} className="route-card__car">
                        <div className="route-card__car-title">
                          {carType.type.charAt(0) + carType.type.slice(1).toLowerCase()}
                        </div>
                        <div className="route-card__car-price">₹{carType.price.toLocaleString()}</div>
                        <ul>
                          {carType.features.map(feature => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <footer className="route-card__footer">
                  <a
                    href={`/${route.origin.slug}/${route.destination.slug}/fare`}
                    className="cta cta--sm route-card__cta"
                  >
                    See fare &amp; book
                  </a>
                  <a
                    href={`/${route.destination.slug}/${route.origin.slug}/fare`}
                    className="pill route-card__secondary"
                    title={`${route.destination.name} to ${route.origin.name}`}
                  >
                    Route details
                  </a>
                </footer>
              </article>
            ))}
          </div>

          {filteredRoutes.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291.94-5.709 2.291" />
              </svg>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No routes found</h3>
              <p className="text-neutral-600 mb-4">
            Try adjusting your search terms or filters.
          </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCarType('ALL');
                }}
                className="btn btn-primary"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-primary-600 text-white">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4">Don&apos;t see your route?</h2>
          <p className="text-primary-100 mb-6">
            Contact us to check availability for other intercity routes or custom travel plans.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <a href="/contact" className="btn bg-white text-primary-600 hover:bg-neutral-100">
              Contact Us
            </a>
            <a href="/book" className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600">
              Custom Booking
            </a>
          </div>
        </div>
      </section>
    </ModernLayout>
  );
}
