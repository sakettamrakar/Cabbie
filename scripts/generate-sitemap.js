// Generates public/sitemap.xml after build using current DB state.
// Usage: node scripts/generate-sitemap.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main(){
  const prisma=new PrismaClient();
  const base = process.env.SITE_BASE_URL || 'https://www.example.com';
  const [cities, routes] = await Promise.all([
    prisma.city.findMany({ orderBy:{ slug:'asc' } }),
    prisma.route.findMany({ include:{ origin:true, destination:true } })
  ]);
  const today = new Date().toISOString().split('T')[0];
  const urls = [];
  // City hubs
  for(const c of cities){
    urls.push({ loc: `${base}/city/${c.slug}`, lastmod: today });
  }
  // Route fare + SEO pages
  for(const r of routes){
    urls.push({ loc: `${base}/${r.origin.slug}/${r.destination.slug}/fare`, lastmod: today });
    urls.push({ loc: `${base}/${r.origin.slug}/${r.origin.slug}-to-${r.destination.slug}-taxi.html`, lastmod: today });
  }
  // Routes index
  urls.push({ loc: `${base}/routes.html`, lastmod: today });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n`+
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
    urls.map(u=>`  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')+
    `\n</urlset>\n`;

  const outDir = path.join(process.cwd(),'public');
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive:true });
  const outFile = path.join(outDir,'sitemap.xml');
  fs.writeFileSync(outFile, xml, 'utf-8');
  await prisma.$disconnect();
  console.log(`✅ sitemap.xml written (${urls.length} urls) -> public/sitemap.xml`);
}
main().catch(e=>{ console.error(e); process.exit(1); });