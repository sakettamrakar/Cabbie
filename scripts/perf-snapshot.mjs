#!/usr/bin/env node
import { execSync, spawn } from 'child_process';
import fs from 'fs';

// Config
const PAGES = [
  'http://localhost:3000/raipur/bilaspur/fare',
  'http://localhost:3000/raipur/raipur-to-bilaspur-taxi.html'
];
const TARGETS = {
  performance: 0.9,
  lcp: 2500, // ms
  inp: 200,  // ms experimental
  cls: 0.1,
  transferKb: 180 // total bytes /1024 for page <= ~180KB (example)
};

function waitOn(url, timeout=15000){
  const start = Date.now();
  const interval = 500;
  return new Promise((resolve,reject)=>{
    const tick = ()=>{
      try { fetch(url).then(r=>{ if(r.ok){ resolve(true); } else throw new Error('Bad'); }).catch(()=>{ if(Date.now()-start>timeout) reject(new Error('Timeout')); else setTimeout(tick,interval); }); } catch { if(Date.now()-start>timeout) reject(new Error('Timeout')); else setTimeout(tick,interval); }
    }; tick();
  });
}

async function run(){
  // Start server
  fs.mkdirSync('artifacts',{recursive:true});
  const srv = spawn(process.platform==='win32'? 'npm.cmd':'npm', ['run','lh:serve'], { stdio:'inherit' });
  try {
    await waitOn(PAGES[0]);
    const lighthouse = (await import('lighthouse')).default;
    const chromeLauncher = (await import('chrome-launcher')).default;
    const results = [];
    for(const url of PAGES){
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new','--no-sandbox'] });
      const lhr = await lighthouse(url, { port: chrome.port, preset:'mobile' });
      await chrome.kill();
      const audits = lhr.audits;
      const metrics = {
        url,
        performance: lhr.categories.performance.score,
        lcp: audits['largest-contentful-paint']?.numericValue || 0,
        inp: audits['interaction-to-next-paint']?.numericValue || 0,
        cls: audits['cumulative-layout-shift']?.numericValue || 0,
        transferKb: (audits['total-byte-weight']?.numericValue || 0)/1024
      };
      console.log('\nPage:', url);
      console.table(metrics);
      results.push(metrics);
    }
    // Evaluate thresholds
    let failed = false;
    for(const r of results){
      if(r.performance < TARGETS.performance){ console.error('Fail: performance < target', r.url); failed=true; }
      if(r.lcp > TARGETS.lcp){ console.error('Fail: LCP > target', r.url); failed=true; }
      if(r.inp > TARGETS.inp){ console.error('Fail: INP > target', r.url); failed=true; }
      if(r.cls > TARGETS.cls){ console.error('Fail: CLS > target', r.url); failed=true; }
      if(r.transferKb > TARGETS.transferKb){ console.error('Fail: transferKb > target', r.url); failed=true; }
    }
    if(failed){ process.exitCode = 1; }
  fs.writeFileSync('artifacts/perf-snapshot.json', JSON.stringify({ generatedAt: Date.now(), results, targets: TARGETS }, null, 2));
  } catch(err){
    console.error('Snapshot error', err); process.exitCode = 1;
  } finally {
    try { srv.kill(); } catch{}
  }
}
run();
