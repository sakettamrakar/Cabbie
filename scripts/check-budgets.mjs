#!/usr/bin/env node
/*
 Simple bundle budget checker.
 Looks for Next.js build stats (requires NEXT_JS_STATS=1 or experimental stats),
 falls back to analyzing .next/build-manifest.json and .next/app-build-manifest.json.
 Exits 1 if any configured limits exceeded.
*/
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const budgetsPath = path.join(root,'budgets.json');
if(!fs.existsSync(budgetsPath)){
  console.error('budgets.json not found');
  process.exit(1);
}
const budgets = JSON.parse(fs.readFileSync(budgetsPath,'utf8'));
const bytes = v=> typeof v==='number'? v: 0;
const kb = b=> Math.round((b/1024)*10)/10;

function gzipSizeSync(content){
  return zlib.gzipSync(Buffer.isBuffer(content)? content: Buffer.from(String(content))).length;
}

// Collect asset sizes
const nextDir = path.join(root,'.next');
if(!fs.existsSync(nextDir)){
  console.warn('.next directory not found. Run build first. Skipping checks.');
  process.exit(0);
}

function loadJsonSafe(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch{ return null; } }
const buildManifest = loadJsonSafe(path.join(nextDir,'build-manifest.json'));
const appBuildManifest = loadJsonSafe(path.join(nextDir,'app-build-manifest.json'));

// Map page -> aggregate JS size (gzipped) and CSS size (if separate css assets)
const pageAssets = {};
function addPageAsset(page, file){
  if(!pageAssets[page]) pageAssets[page] = { js: new Set(), css: new Set() };
  if(file.endsWith('.js')) pageAssets[page].js.add(file);
  if(file.endsWith('.css')) pageAssets[page].css.add(file);
}
if(buildManifest){
  Object.entries(buildManifest.pages||{}).forEach(([page, files])=>{
    files.forEach(f=> addPageAsset(page,f));
  });
}
if(appBuildManifest){
  Object.entries(appBuildManifest.pages||{}).forEach(([page, files])=>{
    files.forEach(f=> addPageAsset(page,f));
  });
}

// Read asset file sizes gzipped
function assetGzipSize(rel){
  const abs = path.join(nextDir, rel);
  if(!fs.existsSync(abs)) return 0;
  const content = fs.readFileSync(abs);
  return gzipSizeSync(content);
}

function sumSizes(set){
  let total=0; for(const f of set){ total += assetGzipSize(f); } return total;
}

const failures = [];

// Helper to check a named budget spec against a page alias resolution
function checkBudget(name, pageMatcher, spec){
  const entries = Object.entries(pageAssets).filter(([p])=> pageMatcher(p));
  if(!entries.length){ console.warn(`Budget '${name}' no matching pages.`); return; }
  // Aggregate worst (max) sizes among matches
  let maxJs=0, maxCss=0;
  for(const [p, sets] of entries){
    const jsSize = sumSizes(sets.js);
    const cssSize = sumSizes(sets.css);
    if(jsSize>maxJs) maxJs=jsSize;
    if(cssSize>maxCss) maxCss=cssSize;
  }
  if(spec.jsMaxKb && kb(maxJs) > spec.jsMaxKb){ failures.push(`${name}: js ${kb(maxJs)}kb > ${spec.jsMaxKb}kb`); }
  if(spec.cssMaxKb && kb(maxCss) > spec.cssMaxKb){ failures.push(`${name}: css ${kb(maxCss)}kb > ${spec.cssMaxKb}kb`); }
}

// Page mappings (heuristic based on project routes)
checkBudget('farePage', p=> /\/[^/]+\/[^/]+\/fare$/.test(p), budgets.farePage||{});
checkBudget('contentPage', p=> p.startsWith('/seo/') || p==='/routes', budgets.contentPage||{});
checkBudget('cityRoutesPage', p=> p.startsWith('/city/'), budgets.cityRoutesPage||{});
checkBudget('bookingIsland', p=> p==='/booking' || /\/booking\/.+/.test(p), budgets.bookingIsland||{});

// HTML & critical CSS budgets: approximate via main document + largest CSS chunk
if(budgets.htmlMaxKb || budgets.criticalCssMaxKb){
  // Use prerender-manifest for HTML paths
  const prerender = loadJsonSafe(path.join(nextDir,'prerender-manifest.json'));
  if(prerender){
    let maxHtml=0; let maxCss=0;
    Object.keys(prerender.routes||{}).forEach(route=>{
      const htmlPath = path.join(nextDir, 'server', 'pages', route === '/'? 'index.html': route.replace(/^\//,'') + '.html');
      if(fs.existsSync(htmlPath)){
        const htmlSize = gzipSizeSync(fs.readFileSync(htmlPath));
        if(htmlSize>maxHtml) maxHtml=htmlSize;
      }
    });
    // Critical CSS not easily isolated; approximate using largest css asset
    const allCss = new Set();
    Object.values(pageAssets).forEach(v=> v.css.forEach(c=> allCss.add(c)));
    for(const css of allCss){ const s = assetGzipSize(css); if(s>maxCss) maxCss=s; }
    if(budgets.htmlMaxKb && kb(maxHtml) > budgets.htmlMaxKb) failures.push(`htmlMaxKb: ${kb(maxHtml)}kb > ${budgets.htmlMaxKb}kb`);
    if(budgets.criticalCssMaxKb && kb(maxCss) > budgets.criticalCssMaxKb) failures.push(`criticalCssMaxKb: ${kb(maxCss)}kb > ${budgets.criticalCssMaxKb}kb`);
  }
}

if(failures.length){
  console.error('Bundle budget check FAILED');
  failures.forEach(f=> console.error(' - '+f));
  process.exit(1);
} else {
  console.log('Bundle budgets OK');
}
