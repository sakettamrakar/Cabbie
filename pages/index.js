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
        <div className="container py-20 text-center text-white">
          <h1 className="text-5xl font-bold mb-6">
            {brandName} Intercity Cabs
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-primary-100">
            Reliable one-way taxi service connecting {cityCount}+ cities with transparent fares, instant booking, and professional drivers.
          </p>
          
          <div className="max-w-2xl mx-auto mb-8">
            <ModernBookingWidget />
          </div>
          
          <div className="space-x-4">
            <a href="/modern-routes" className="btn btn-secondary">
              Browse All Routes
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose {brandName}?
            </h2>
            <p className="text-lg text-gray-600">
              Experience the difference with our professional intercity taxi service
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚗</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Drivers</h3>
              <p className="text-gray-600">Experienced, licensed drivers who know the routes well</p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-gray-600">No hidden fees, upfront pricing with detailed breakdowns</p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
              <p className="text-gray-600">Quick OTP-based booking with instant confirmation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Routes */}
      {featuredRoutes && featuredRoutes.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Popular Routes
              </h2>
              <p className="text-lg text-gray-600">
                Our most booked intercity routes
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredRoutes.slice(0, 8).map((route) => (
                <div key={route.id} className="card hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">
                    {route.origin.name} → {route.destination.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Distance: {route.distance_km} km
                  </p>
                  <a 
                    href={`/${route.origin.slug}/${route.destination.slug}/fare`}
                    className="btn btn-outline btn-sm w-full"
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
