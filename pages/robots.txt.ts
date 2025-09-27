import type { GetServerSideProps } from 'next';
import { SITE_BASE_URL } from '../lib/seo';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const domain = SITE_BASE_URL.replace(/https?:\/\//,'').replace(/\/$/,'');
  const body = [
    'User-agent: *',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /my-bookings',
    'Disallow: /my-bookings/',
    'Allow: /',
    `Sitemap: https://${domain}/sitemap.xml`
  ].join('\n');
  res.setHeader('Content-Type','text/plain');
  res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
  res.write(body);
  res.end();
  return { props: {} };
};

// This page just streams robots.txt; nothing to render.
export default function Robots(){ return null; }

