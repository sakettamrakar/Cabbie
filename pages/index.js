import Head from 'next/head';
import dynamic from 'next/dynamic';
import { PrismaClient } from '@prisma/client';

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
    <ModernLayout>
      <Head>
        <title>{brandName} Intercity Cabs | Professional Outstation & One Way Taxi</title>
        <meta name="description" content={`Book reliable intercity ${brandName} taxis with transparent fares and instant OTP booking.`} />
      </Head>
      
      {/* Hero Section */}
      <section className="hero-gradient">
        <div className="container py-20 text-center" style={{ color: 'white' }}>
          <h1 className="animate-slideDown" style={{ 
            fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))',
            fontWeight: 'var(--font-extrabold)',
            marginBottom: 'var(--space-6)',
            letterSpacing: '-0.025em',
            color: 'white'
          }}>
            {brandName} Intercity Cabs
          </h1>
          <p className="animate-fadeIn" style={{ 
            fontSize: 'var(--text-xl)', 
            marginBottom: 'var(--space-8)', 
            maxWidth: 'var(--container-3xl)', 
            marginLeft: 'auto',
            marginRight: 'auto',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: 'var(--leading-relaxed)'
          }}>
            Reliable one-way taxi service connecting {cityCount}+ cities with transparent fares, instant booking, and professional drivers.
          </p>
          
          <div className="animate-slideUp" style={{ 
            maxWidth: 'var(--container-2xl)', 
            margin: '0 auto var(--space-8) auto' 
          }}>
            <ModernBookingWidget />
          </div>
          
          <div className="animate-fadeIn" style={{ 
            display: 'flex', 
            gap: 'var(--space-4)', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a href="/modern-routes" className="btn btn-secondary btn-lg">
              Browse All Routes
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16" style={{ background: 'white' }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 style={{ 
              fontSize: 'clamp(var(--text-2xl), 4vw, var(--text-4xl))',
              fontWeight: 'var(--font-bold)',
              color: 'var(--neutral-900)',
              marginBottom: 'var(--space-4)'
            }}>
              Why Choose {brandName}?
            </h2>
            <p style={{ 
              fontSize: 'var(--text-lg)', 
              color: 'var(--neutral-600)',
              maxWidth: 'var(--container-2xl)',
              margin: '0 auto'
            }}>
              Experience the difference with our professional intercity taxi service
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
              <div className="icon-container mx-auto">
                <span style={{ fontSize: 'var(--text-2xl)' }}>🚗</span>
              </div>
              <h3 style={{ 
                fontSize: 'var(--text-xl)', 
                fontWeight: 'var(--font-semibold)', 
                marginBottom: 'var(--space-3)',
                color: 'var(--neutral-900)'
              }}>Professional Drivers</h3>
              <p style={{ 
                color: 'var(--neutral-600)',
                lineHeight: 'var(--leading-relaxed)',
                margin: 0
              }}>Experienced, licensed drivers who know the routes well</p>
            </div>
            
            <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
              <div className="icon-container mx-auto">
                <span style={{ fontSize: 'var(--text-2xl)' }}>💰</span>
              </div>
              <h3 style={{ 
                fontSize: 'var(--text-xl)', 
                fontWeight: 'var(--font-semibold)', 
                marginBottom: 'var(--space-3)',
                color: 'var(--neutral-900)'
              }}>Transparent Pricing</h3>
              <p style={{ 
                color: 'var(--neutral-600)',
                lineHeight: 'var(--leading-relaxed)',
                margin: 0
              }}>No hidden fees, upfront pricing with detailed breakdowns</p>
            </div>
            
            <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
              <div className="icon-container mx-auto">
                <span style={{ fontSize: 'var(--text-2xl)' }}>⚡</span>
              </div>
              <h3 style={{ 
                fontSize: 'var(--text-xl)', 
                fontWeight: 'var(--font-semibold)', 
                marginBottom: 'var(--space-3)',
                color: 'var(--neutral-900)'
              }}>Instant Booking</h3>
              <p style={{ 
                color: 'var(--neutral-600)',
                lineHeight: 'var(--leading-relaxed)',
                margin: 0
              }}>Quick OTP-based booking with instant confirmation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Routes */}
      {featuredRoutes && featuredRoutes.length > 0 && (
        <section className="py-16" style={{ background: 'var(--neutral-50)' }}>
          <div className="container">
            <div className="text-center mb-12">
              <h2 style={{ 
                fontSize: 'clamp(var(--text-2xl), 4vw, var(--text-4xl))',
                fontWeight: 'var(--font-bold)',
                color: 'var(--neutral-900)',
                marginBottom: 'var(--space-4)'
              }}>
                Popular Routes
              </h2>
              <p style={{ 
                fontSize: 'var(--text-lg)', 
                color: 'var(--neutral-600)',
                maxWidth: 'var(--container-2xl)',
                margin: '0 auto'
              }}>
                Our most booked intercity routes
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredRoutes.slice(0, 8).map((route) => (
                <div key={route.id} className="card" style={{ 
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <h3 style={{ 
                    fontWeight: 'var(--font-semibold)', 
                    fontSize: 'var(--text-lg)', 
                    marginBottom: 'var(--space-3)',
                    color: 'var(--neutral-900)'
                  }}>
                    {route.origin.name} → {route.destination.name}
                  </h3>
                  <p style={{ 
                    color: 'var(--neutral-600)', 
                    fontSize: 'var(--text-sm)', 
                    marginBottom: 'var(--space-4)',
                    flex: 1
                  }}>
                    Distance: {route.distance_km} km
                  </p>
                  <a 
                    href={`/${route.origin.slug}/${route.destination.slug}/fare`}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%' }}
                  >
                    Check Fare
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </ModernLayout>
  );
}

export async function getStaticProps(){
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
        featuredRoutes: routes.map(r => ({ 
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
