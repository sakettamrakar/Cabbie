import Head from 'next/head';
import dynamic from 'next/dynamic';
import { PrismaClient } from '@prisma/client';
import heroImage from '../src/assets/hero.jpg';

// Dynamically import modern components with fallbacks
const ModernLayout = dynamic(
  () => import('../components/ModernLayout'),
  { ssr: false }
);

const ModernBookingWidget = dynamic(
  () => import('../components/ModernBookingWidget'),
  { ssr: false }
);


export default function Home({ brandName, featuredRoutes, cityCount, routeCount }) {
  return (
    <ModernLayout brandName={brandName}>
      <Head>
        <title>{brandName} Intercity Cabs | Professional Outstation & One Way Taxi</title>
        <meta name="description" content={`Book reliable intercity ${brandName} taxis with transparent fares and instant OTP booking.`} />
      </Head>

      {/* Hero Section */}
      <section
        className="landing-hero"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(9, 14, 38, 0.82), rgba(9, 20, 52, 0.72)), url(${heroImage.src})`
        }}
      >
        <div className="container landing-hero__container">
          <div className="landing-hero__content">
            <span className="landing-hero__badge">Reliable intercity cabs</span>
            <h1 className="landing-hero__title">
              Transparent fares, instant booking across {cityCount}+ cities
            </h1>
            <p className="landing-hero__description">
              {brandName} connects you to verified drivers for one-way, round trip and airport rides. Plan ahead with live price guarantees and 24x7 support.
            </p>
            <div className="landing-hero__trust">
              <div className="landing-hero__trust-item">
                <div className="landing-hero__trust-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <p className="landing-hero__trust-title">4.6 &#9733; (1.2k reviews)</p>
                  <p className="landing-hero__trust-copy">Rated by real travellers</p>
                </div>
              </div>
              <div className="landing-hero__trust-item">
                <div className="landing-hero__trust-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 10a4 4 0 10-8 0v1" />
                    <path d="M6 19v-1a6 6 0 0112 0v1" />
                    <rect x="2" y="12" width="20" height="8" rx="4" />
                  </svg>
                </div>
                <div>
                  <p className="landing-hero__trust-title">24x7 live support</p>
                  <p className="landing-hero__trust-copy">Real-time ride assistance</p>
                </div>
              </div>
              <div className="landing-hero__trust-item">
                <div className="landing-hero__trust-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v5l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div>
                  <p className="landing-hero__trust-title">Average ETA 12 mins</p>
                  <p className="landing-hero__trust-copy">Driver assigned instantly</p>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-hero__form-wrapper" role="complementary" aria-label="Cab search">
            <ModernBookingWidget className="landing-hero__form" />
            <p className="landing-hero__footnote">
              Serving {routeCount} popular routes including airport and round trips.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-us">
        <div className="container">
          <div className="why-us__header">
            <h2>Why choose {brandName}</h2>
            <p>Trusted intercity rides with professional chauffeurs and transparent policies.</p>
          </div>
          <div className="why-us__grid">
            <article className="why-us__card">
              <div className="why-us__icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1l3 5.2 5.8.9-4.2 4.1 1 5.8-5.6-2.9-5.6 2.9 1-5.8-4.2-4.1L9 6.2z" />
                </svg>
              </div>
              <h3>Transparent pricing</h3>
              <p>Instant fare breakdown, tolls and driver allowance included upfront.</p>
            </article>
            <article className="why-us__card">
              <div className="why-us__icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" />
                  <path d="M20 21v-1a7 7 0 00-14 0v1" />
                  <path d="M4 21h16" />
                </svg>
              </div>
              <h3>Verified drivers</h3>
              <p>Background verified chauffeurs with commercial permits and ratings tracking.</p>
            </article>
            <article className="why-us__card">
              <div className="why-us__icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <h3>Free cancellation</h3>
              <p>Reschedule or cancel up to 3 hours before pickup without fee.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Featured Routes */}
      {featuredRoutes && featuredRoutes.length > 0 && (
        <section className="featured-routes">
          <div className="container">
            <div className="featured-routes__header">
              <div>
                <h2>Popular routes</h2>
                <p>Our most booked intercity journeys this week.</p>
              </div>
              <a href="/modern-routes" className="btn btn-secondary btn-sm">
                View all routes
              </a>
            </div>

            <div className="featured-routes__grid">
              {featuredRoutes.slice(0, 8).map((route) => (
                <article key={route.id} className="featured-routes__card">
                  <h3>
                    {route.origin.name} &rarr; {route.destination.name}
                  </h3>
                  <p className="featured-routes__meta">Distance: {route.distance_km} km</p>
                  <a
                    href={`/${route.origin.slug}/${route.destination.slug}/fare`}
                    className="btn btn-outline btn-sm"
                    aria-label={`Check fare for ${route.origin.name} to ${route.destination.name}`}
                  >
                    Check fare
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </ModernLayout>
  );
}

export async function getStaticProps() {
  const prisma = new PrismaClient();
  try {
    const [routes, cities] = await Promise.all([
      prisma.route.findMany({
        where: { is_active: true },
        include: { origin: true, destination: true },
        take: 8,
        orderBy: { id: 'asc' }
      }),
      prisma.city.count()
    ]);
    return {
      props: {
        brandName: process.env.BRAND_NAME || 'Raipur Cabs',
        featuredRoutes: routes.map((r) => ({
          id: r.id,
          origin: { slug: r.origin.slug, name: r.origin.name },
          destination: { slug: r.destination.slug, name: r.destination.name },
          distance_km: r.distance_km
        })),
        cityCount: cities,
        routeCount: routes.length
      },
      revalidate: 3600
    };
  } finally {
    await prisma.$disconnect();
  }
}
