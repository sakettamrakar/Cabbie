/** @type {import('next').NextConfig} */
let nextConfig = {
  reactStrictMode:true,
  async rewrites(){
    return [
      {
        source:'/:origin/:originSlug-to-:destination-taxi.html',
        destination:'/seo/:origin/:destination'
      }
    ];
  },
  async headers(){
    return [
  // Global Content Security Policy (simplified)
  { source: '/:path*', headers: [ { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com; img-src 'self' data: https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'" } ] },
      // Fare pages (example city slugs) – ISR HTML: 24h CDN cache with SWR
      { source: '/(raipur|bhilai|bilaspur)/:path*/fare', headers: [ { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400' } ] },
      // Public route status JSON (example endpoint) – 5m cache
      { source: '/api/v1/routes/:origin/:destination', headers: [ { key: 'Cache-Control', value: 'public, max-age=300' } ] },
      // Quotes & sensitive endpoints – no-store
      { source: '/api/v1/quotes', headers: [ { key: 'Cache-Control', value: 'no-store' } ] },
      { source: '/api/v1/otp/:path*', headers: [ { key: 'Cache-Control', value: 'no-store' } ] },
      { source: '/api/v1/bookings/:path*', headers: [ { key: 'Cache-Control', value: 'no-store' } ] }
    ];
  }
};

if(process.env.ANALYZE === 'true'){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled:true, openAnalyzer:false, analyzerMode:'static', reportFilename:'../analyze/bundle.html', generateStatsFile:true, statsFilename:'../analyze/stats.json' });
  nextConfig = withBundleAnalyzer(nextConfig);
}

module.exports = nextConfig;
