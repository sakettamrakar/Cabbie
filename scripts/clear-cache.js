// Removes build caches (.next) and generated sitemaps so next build regenerates everything.
const fs = require('fs');
const path = require('path');

function rm(p){
  if(fs.existsSync(p)){
    fs.rmSync(p,{ recursive:true, force:true });
    console.log('Removed', p);
  }
}

rm(path.join(process.cwd(),'.next'));
rm(path.join(process.cwd(),'public','sitemap.xml'));
rm(path.join(process.cwd(),'public','sitemap-cities.xml'));
rm(path.join(process.cwd(),'public','sitemap-routes.xml'));
rm(path.join(process.cwd(),'public','sitemap-airports.xml'));
console.log('✅ Cache cleared. Run `npm run build` next.');