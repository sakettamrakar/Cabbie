#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fetchRoutes, fetchCities, disconnect } from '../lib/data.js';
import { SITE_BASE_URL } from '../lib/seo.js';

// Enhanced route generation from distance matrix
function getAllProgrammaticRoutes() {
  // This includes all routes from our comprehensive distance matrix
  const knownRoutes = [
    // Major Chhattisgarh routes
    { origin: 'raipur', destination: 'bilaspur' },
    { origin: 'raipur', destination: 'ambikapur' },
    { origin: 'raipur', destination: 'durg' },
    { origin: 'raipur', destination: 'bhilai' },
    { origin: 'raipur', destination: 'korba' },
    { origin: 'raipur', destination: 'jagdalpur' },
    { origin: 'ambikapur', destination: 'surajpur' },
    { origin: 'bilaspur', destination: 'korba' },
    { origin: 'durg', destination: 'bhilai' },
    { origin: 'manendragarh', destination: 'anuppur' },
    
    // Cross-state routes
    { origin: 'raipur', destination: 'delhi' },
    { origin: 'raipur', destination: 'mumbai' },
    { origin: 'raipur', destination: 'kolkata' },
    { origin: 'raipur', destination: 'bangalore' },
    { origin: 'raipur', destination: 'hyderabad' },
    
    // Regional routes
    { origin: 'patna', destination: 'ranchi' },
    { origin: 'delhi', destination: 'mumbai' },
    { origin: 'bangalore', destination: 'chennai' },
  ];

  // Generate reverse routes
  const allRoutes = [...knownRoutes];
  knownRoutes.forEach(route => {
    if (route.origin !== route.destination) {
      allRoutes.push({ origin: route.destination, destination: route.origin });
    }
  });

  return allRoutes;
}

async function main(){
  const outDir = path.join(process.cwd(),'public');
  fs.mkdirSync(outDir,{ recursive:true });
  const today = new Date().toISOString().slice(0,10);
  
  // Get database routes and cities
  const [dbRoutes, cities] = await Promise.all([fetchRoutes(), fetchCities()]);
  
  // Get all programmatic routes
  const programmaticRoutes = getAllProgrammaticRoutes();
  
  // Combine database routes with programmatic routes
  const allRoutesCombined = [
    ...dbRoutes.map(r => ({ origin: r.origin.slug, destination: r.destination.slug })),
    ...programmaticRoutes
  ];

  // Remove duplicates
  const uniqueRoutes = Array.from(
    new Map(allRoutesCombined.map(r => [`${r.origin}-${r.destination}`, r])).values()
  );

  console.log(`Generating sitemaps for ${uniqueRoutes.length} routes...`);
  
  const citiesXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
    cities.filter(c=>c.is_active).map(c=>`<url><loc>${SITE_BASE_URL}/city/${c.slug}</loc><lastmod>${today}</lastmod></url>`).join('')+`</urlset>`;
  fs.writeFileSync(path.join(outDir,'sitemap-cities.xml'), citiesXml);
  
  const routeParts = uniqueRoutes.map(r=>{ 
    const o=r.origin; 
    const d=r.destination; 
    return [
      `<url><loc>${SITE_BASE_URL}/${o}/${d}/fare</loc><lastmod>${today}</lastmod></url>`,
      `<url><loc>${SITE_BASE_URL}/seo/${o}/${d}</loc><lastmod>${today}</lastmod></url>`
    ]; 
  }).flat();
  
  const routesXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routeParts.join('')}</urlset>`;
  fs.writeFileSync(path.join(outDir,'sitemap-routes.xml'), routesXml);
  
  const airportCities = cities.filter(c=> c.airport_code && c.is_active);
  const airportRoutes = dbRoutes.filter(r=> r.origin.airport_code || r.destination.airport_code);
  const airportXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`+
    [ ...airportCities.map(c=>`<url><loc>${SITE_BASE_URL}/city/${c.slug}</loc><lastmod>${today}</lastmod></url>`), 
      ...airportRoutes.map(r=>`<url><loc>${SITE_BASE_URL}/${r.origin.slug}/${r.destination.slug}/fare</loc><lastmod>${today}</lastmod></url>`) ].join('')+`</urlset>`;
  fs.writeFileSync(path.join(outDir,'sitemap-airports.xml'), airportXml);
  fs.writeFileSync(path.join(outDir,'sitemap-airports.xml'), airportXml);
  
  const indexXml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">`+
    ['sitemap-cities.xml','sitemap-routes.xml','sitemap-airports.xml'].map(u=>`<sitemap><loc>${SITE_BASE_URL}/${u}</loc><lastmod>${today}</lastmod></sitemap>`).join('')+`</sitemapindex>`;
  fs.writeFileSync(path.join(outDir,'sitemap.xml'), indexXml);
  await disconnect();
  console.log(`✅ Sitemaps generated successfully with ${uniqueRoutes.length} routes`);
}
main().catch(e=>{ console.error(e); process.exit(1); });