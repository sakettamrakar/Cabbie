const { PrismaClient } = require('@prisma/client');
(async()=>{
  const p = new PrismaClient();
  try {
    const routes = await p.route.findMany({ include:{ origin:true, destination:true, fares:true } });
    for(const r of routes){
      console.log(`${r.origin.slug} -> ${r.destination.slug} | dist=${r.distance_km}km dur=${r.duration_min}m fares=${r.fares.length}`);
    }
  } finally {
    await p.$disconnect();
  }
})();
