import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamically import the BookingWidget (explicitly TSX) with SSR disabled for better performance
const BookingWidget = dynamic(
  () => import('../components/booking/BookingWidget.tsx'),
  { ssr: false }
);
export default function Home({ brandName, featuredRoutes, cityCount, routeCount }) {
  return (
    <main>
      <style jsx global>{criticalCSS}</style>
      <Head>
        <title>{brandName} Intercity Cabs | Outstation & One Way Taxi</title>
        <meta name="description" content={`Book reliable intercity ${brandName} taxis with transparent fares and instant OTP booking.`} />
      </Head>
      <section data-hero className="hero-section">
        <div className="hero-content">
          <h1>{brandName} Intercity Cabs</h1>
          <p>Reliable one‑way taxi service connecting {cityCount}+ cities with transparent fares, instant booking, and professional drivers.</p>
        </div>
        
        <div className="booking-widget-container">
          <BookingWidget />
        </div>
        
        <div className="hero-cta">
          <a href="/routes" className="c-btn c-btn--secondary">Browse All Routes</a>
        </div>
      </section>
      <section className="section-pad section-narrow">
        <h2>Popular Routes</h2>
        <div className="route-grid">
          {featuredRoutes.map(r=> <a key={r.id} href={`/${r.origin.slug}/${r.destination.slug}/fare`} className="route-card">
            <span style={{fontWeight:600}}>{r.origin.name} → {r.destination.name}</span>
            <small>{r.distance_km? `${r.distance_km} km`:'Distance updating'}</small>
          </a>)}
        </div>
      </section>
      <section className="section-pad" style={{background:'#f1f5f9'}}>
        <h2>Why Choose {brandName}?</h2>
        <ul className="benefits-grid">
          {benefits.map(b=> <li key={b.t} className="benefit-card">
            <h3>{b.t}</h3>
            <p>{b.d}</p>
          </li>)}
        </ul>
      </section>
      <section className="section-pad section-narrow">
        <h2>How It Works</h2>
        <ol className="steps">
          {steps.map(s=> <li key={s.t} className="step-item"><div className="step-badge"></div><div><h3>{s.t}</h3><p>{s.d}</p></div></li>)}
        </ol>
      </section>
      <footer style={{padding:'2rem 1.5rem',textAlign:'center',fontSize:13,color:'#cbd5e1',background:'#0f172a'}}>
        © {new Date().getFullYear()} {brandName}. All rights reserved. · <a href="/routes" style={{color:'#fff',textDecoration:'underline',fontWeight:600}}>Routes</a>
      </footer>
    </main>
  );
}

// Add critical CSS for the booking widget
const criticalCSS = `
  /* Hero Section */
  .hero-section {
    padding: 2rem 1rem;
    text-align: center;
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
    color: white;
  }
  
  .hero-content {
    max-width: 800px;
    margin: 0 auto 2rem;
  }
  
  .hero-cta {
    margin-top: 1.5rem;
  }
  
  /* Booking Widget */
  .booking-widget-container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    padding: 1.5rem;
  }
  
  /* Responsive adjustments */
  @media (min-width: 768px) {
    .hero-section {
      padding: 4rem 1rem;
    }
    
    .booking-widget-container {
      padding: 2rem;
    }
  }
`;

// Removed inline style objects; replaced with class-based styling (critical + late CSS)
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

import { PrismaClient } from '@prisma/client';
export async function getStaticProps(){
  const prisma = new PrismaClient();
  try {
    const [routes,cities] = await Promise.all([
      prisma.route.findMany({ where:{ is_active:true }, include:{ origin:true, destination:true }, take:8, orderBy:{ id:'asc' } }),
      prisma.city.count()
    ]);
    return {
      props:{
        brandName: process.env.BRAND_NAME || 'Raipur Cabs',
        featuredRoutes: routes.map(r=>({ id:r.id, origin:{ slug:r.origin.slug, name:r.origin.name }, destination:{ slug:r.destination.slug, name:r.destination.name }, distance_km:r.distance_km })),
        cityCount: cities,
        routeCount: routes.length
      },
      revalidate: 3600
    };
  } finally {
    await prisma.$disconnect();
  }
}
