/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  experimental: {
    esmExternals: false
  },
  env: {
    MAPS_ENABLED: process.env.MAPS_ENABLED || 'false',
    GOOGLE_MAPS_BROWSER_KEY: process.env.GOOGLE_MAPS_BROWSER_KEY || '',
    MAPS_REGION: process.env.MAPS_REGION || 'IN',
    MAPS_LANGUAGE: process.env.MAPS_LANGUAGE || 'en',
    ADMIN_LINK_ENABLED: process.env.ADMIN_KEY ? 'true' : 'false',
  }
};

module.exports = nextConfig;
