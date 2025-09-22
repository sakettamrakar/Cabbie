import Head from 'next/head';
import ModernBookingWidget from '../components/ModernBookingWidget';
import { SITE_BRAND } from '../lib/seo';

// Sample data for benefits and steps
const benefits = [
  { t:'Transparent Pricing', d:'Inclusive fares—no hidden taxes or surge.' },
  { t:'Professional Drivers', d:'Experienced, verified intercity chauffeurs.' },
  { t:'Clean AC Cars', d:'Maintained hatchbacks, sedans & SUVs.' },
  { t:'Instant Booking', d:'Quick OTP verification and confirmation.' },
  { t:'Reliable Support', d:'Status tracking & SMS confirmations.' },
  { t:'Smart Discounts', d:'Automatic validation of active offers.' }
];

const steps = [
  { t:'Enter Trip Details', d:'Choose origin, destination & pickup time.' },
  { t:'Verify Phone', d:'Secure OTP verification to proceed.' },
  { t:'Apply Offer', d:'Optional code validated instantly.' },
  { t:'Get Confirmation', d:'Driver assigned & details shared.' }
];

export default function Home({ featuredRoutes, cityCount, routeCount }) {
  const brandName = SITE_BRAND;
  return (
    <main>
      <Head>
        <title>{brandName} Intercity Cabs | Outstation & One Way Taxi</title>
        <meta name="description" content={`Book reliable intercity ${brandName} taxis with transparent fares and instant OTP booking.`} />
      </Head>
      
      <section className="hero bg-pattern">
        <div className="hero-content">
          <h1 className="hero-title">{brandName} Intercity Cabs</h1>
          <p className="hero-subtitle">Reliable one‑way taxi service connecting {cityCount}+ cities with transparent fares, instant booking, and professional drivers.</p>
          
          <div className="booking-widget-container">
            <ModernBookingWidget />
          </div>
          
          <div className="hero-cta">
            <a href="/routes" className="btn btn-secondary">Browse All Routes</a>
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Routes</h2>
          <div className="route-grid">
            {featuredRoutes.map(r=> 
              <a key={r.id} href={`/${r.origin.slug}/${r.destination.slug}/fare`} className="route-card">
                <div className="route-card-title">{r.origin.name} → {r.destination.name}</div>
                <div className="text-sm text-neutral-600">{r.distance_km? `${r.distance_km} km`:'Distance updating'}</div>
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="section-pad bg-neutral-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose {SITE_BRAND}?</h2>
          <ul className="benefits-grid">
            {benefits.map(b=> 
              <li key={b.t} className="benefit-card">
                <h3 className="text-xl font-semibold mb-4">{b.t}</h3>
                <p className="text-neutral-600">{b.d}</p>
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-narrow">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => 
              <div key={step.t} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 text-white text-2xl font-bold mb-4">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.t}</h3>
                <p className="text-neutral-600 text-sm">{step.d}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Server-side props function
export async function getServerSideProps() {
  // This would normally fetch from your database
  const cityCount = 50;
  const routeCount = 200;
  
  const featuredRoutes = [
    { id: 1, origin: { name: 'Mumbai', slug: 'mumbai' }, destination: { name: 'Pune', slug: 'pune' }, distance_km: 150 },
    { id: 2, origin: { name: 'Delhi', slug: 'delhi' }, destination: { name: 'Jaipur', slug: 'jaipur' }, distance_km: 280 },
    { id: 3, origin: { name: 'Bangalore', slug: 'bangalore' }, destination: { name: 'Chennai', slug: 'chennai' }, distance_km: 350 },
    { id: 4, origin: { name: 'Kolkata', slug: 'kolkata' }, destination: { name: 'Bhubaneswar', slug: 'bhubaneswar' }, distance_km: 450 },
    { id: 5, origin: { name: 'Ahmedabad', slug: 'ahmedabad' }, destination: { name: 'Udaipur', slug: 'udaipur' }, distance_km: 260 },
    { id: 6, origin: { name: 'Hyderabad', slug: 'hyderabad' }, destination: { name: 'Vijayawada', slug: 'vijayawada' }, distance_km: 270 }
  ];

  return {
    props: {
      featuredRoutes,
      cityCount,
      routeCount,
    },
  };
}
