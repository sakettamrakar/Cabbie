#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fetchRoutes, fetchCities, disconnect } from '../lib/data.js';
import { SITE_BASE_URL } from '../lib/seo.js';

async function main(){
  const outDir = path.join(process.cwd(),'public');
  fs.mkdirSync(outDir,{ recursive:true });
  const today = new Date().toISOString().slice(0,10);
  const [routes, cities] = await Promise.all([fetchRoutes(), fetchCities()]);
  const citiesXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
    cities.filter(c=>c.is_active).map(c=>`<url><loc>${SITE_BASE_URL}/city/${c.slug}</loc><lastmod>${today}</lastmod></url>`).join('')+`</urlset>`;
  fs.writeFileSync(path.join(outDir,'sitemap-cities.xml'), citiesXml);
  const routeParts = routes.map(r=>{ const o=r.origin.slug; const d=r.destination.slug; return [`<url><loc>${SITE_BASE_URL}/${o}/${d}/fare</loc><lastmod>${today}</lastmod></url>`,`<url><loc>${SITE_BASE_URL}/${o}/${o}-to-${d}-taxi.html</loc><lastmod>${today}</lastmod></url>`]; }).flat();
  const routesXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routeParts.join('')}</urlset>`;
  fs.writeFileSync(path.join(outDir,'sitemap-routes.xml'), routesXml);
  const airportCities = cities.filter(c=> c.airport_code && c.is_active);
  const airportRoutes = routes.filter(r=> r.origin.airport_code || r.destination.airport_code);
  const airportXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
    [ ...airportCities.map(c=>`<url><loc>${SITE_BASE_URL}/city/${c.slug}</loc><lastmod>${today}</lastmod></url>`), ...airportRoutes.map(r=>`<url><loc>${SITE_BASE_URL}/${r.origin.slug}/${r.destination.slug}/fare</loc><lastmod>${today}</lastmod></url>`) ].join('')+`</urlset>`;
  fs.writeFileSync(path.join(outDir,'sitemap-airports.xml'), airportXml);
  const indexXml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">`+
    ['sitemap-cities.xml','sitemap-routes.xml','sitemap-airports.xml'].map(u=>`<sitemap><loc>${SITE_BASE_URL}/${u}</loc><lastmod>${today}</lastmod></sitemap>`).join('')+`</sitemapindex>`;
  fs.writeFileSync(path.join(outDir,'sitemap.xml'), indexXml);
  await disconnect();
  console.log('Sitemaps generated');
}
main().catch(e=>{ console.error(e); process.exit(1); });