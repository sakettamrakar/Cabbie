#!/usr/bin/env node
/*
 SEO Audit Script
 Checks:
 1. Unique <title> & <meta name=description>
 2. Canonical present & resolves 200
 3. JSON-LD present & parseable
 4. /sitemap.xml references child sitemaps; each URL appears in exactly one child list
 5. robots.txt exists & lists sitemap
 Exits non-zero on violations.
*/
import http from 'http';
import https from 'https';
import { JSDOM } from 'jsdom';

// Simple fetch (node18+ global fetch maybe not available depending on env)
function fetchUrl(url){
  return new Promise((res,rej)=>{
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, r=>{
      const chunks=[]; r.on('data',c=>chunks.push(c)); r.on('end',()=>{
        res({ status:r.statusCode, text: Buffer.concat(chunks).toString('utf8'), headers:r.headers });
      });
    });
    req.on('error',rej);
    req.setTimeout(15000,()=>{ req.destroy(new Error('Timeout')); });
  });
}

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
const fail = (msg)=>{ console.error('\nSEO AUDIT FAILURE:', msg); failures.push(msg); };
const info = (...a)=> console.log('[seo]', ...a);
const failures = [];

async function getInternalRoutePaths(){
  // Use sitemap routes child if exists; else fallback to small in-memory seed list.
  const siteIdx = await fetchUrl(`${BASE}/sitemap.xml`).catch(()=>null);
  if(!siteIdx || siteIdx.status!==200){ fail('Cannot fetch sitemap.xml'); return ['/']; }
  const childMatches = Array.from(siteIdx.text.matchAll(/<loc>(.*?)<\/loc>/g)).map(m=>m[1]).filter(u=>/sitemap-.*\.xml/.test(u));
  const allUrls = [];
  for(const sm of childMatches){
    const r = await fetchUrl(sm).catch(()=>null);
    if(!r || r.status!==200){ fail(`Child sitemap fetch failed: ${sm}`); continue; }
    const urls = Array.from(r.text.matchAll(/<loc>(.*?)<\/loc>/g)).map(m=>m[1]);
    allUrls.push({ sm, urls });
  }
  // Uniqueness across child sitemaps
  const urlToSm = new Map();
  for(const { sm, urls } of allUrls){
    urls.forEach(u=>{
      if(urlToSm.has(u)) fail(`URL appears in multiple sitemaps: ${u}`);
      urlToSm.set(u, sm);
    });
  }
  // Return only route pages (simple heuristic: contains '/fare' or 'taxi' html) for audit; include content pages separately
  const flat = Array.from(urlToSm.keys()).filter(u=>/\/fare$|taxi\.html$/.test(u));
  return { flat, childSitemaps: childMatches, mapping: urlToSm };
}

async function auditPages(urls){
  const titles = new Map();
  const descs = new Map();
  for(const url of urls){
    const r = await fetchUrl(url).catch(e=>{ fail(`Fetch error ${url}: ${e.message}`); return null; });
    if(!r){ continue; }
    if(r.status!==200){ fail(`Non-200 page ${url} -> ${r.status}`); continue; }
    const dom = new JSDOM(r.text);
    const d = dom.window.document;
    const title = d.querySelector('title')?.textContent?.trim();
    const desc = d.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
    const canonical = d.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if(!title) fail(`Missing title: ${url}`);
    if(!desc) fail(`Missing meta description: ${url}`);
    if(title){ if(titles.has(title)) fail(`Duplicate title '${title}' on ${url} and ${titles.get(title)}`); else titles.set(title,url); }
    if(desc){ if(descs.has(desc)) fail(`Duplicate meta description '${desc}' on ${url} and ${descs.get(desc)}`); else descs.set(desc,url); }
    if(!canonical) fail(`Missing canonical: ${url}`);
    if(canonical){
      const cr = await fetchUrl(canonical).catch(()=>null);
      if(!cr || cr.status!==200) fail(`Canonical not 200 for ${url} -> ${canonical}`);
    }
    // JSON-LD presence
    const ldScripts = Array.from(d.querySelectorAll('script[type="application/ld+json"]'));
    if(ldScripts.length===0) fail(`Missing JSON-LD: ${url}`);
    ldScripts.forEach((s,i)=>{
      try { JSON.parse(s.textContent||''); } catch { fail(`Invalid JSON-LD (${i}) on ${url}`); }
    });
    // hreflang check when ENABLE_HI_LOCALE set
    if(process.env.ENABLE_HI_LOCALE==='1'){
      const alternates = Array.from(d.querySelectorAll('link[rel="alternate"]'));
      const hasHi = alternates.some(l=> /hi(-|_)IN/i.test(l.getAttribute('hreflang')||''));
      if(!hasHi) fail(`Missing hi-IN hreflang when ENABLE_HI_LOCALE=1: ${url}`);
    }
  }
}

async function auditRobots(){
  const r = await fetchUrl(`${BASE}/robots.txt`).catch(()=>null);
  if(!r || r.status!==200){ fail('robots.txt missing or not 200'); return; }
  if(!/sitemap\.xml/i.test(r.text)) fail('robots.txt does not reference sitemap');
}

async function auditSitemapStructure(childSitemaps){
  if(childSitemaps.length===0) fail('No child sitemaps referenced in index');
}

(async function main(){
  info('Base', BASE);
  const { flat, childSitemaps } = await getInternalRoutePaths();
  await auditSitemapStructure(childSitemaps);
  await auditPages(flat);
  await auditRobots();
  if(failures.length){
    console.error(`\nSEO audit found ${failures.length} issue(s).`);
    process.exit(1);
  } else {
    console.log('SEO audit passed with 0 issues.');
  }
})();