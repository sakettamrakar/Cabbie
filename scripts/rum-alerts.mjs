#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Simple aggregation over last 3 days of JSONL rum events.
// Alert criteria:
// - LCP p75 > 2500ms for 2 consecutive days
// - INP p75 > 200ms for 2 consecutive days
// - CLS p75 > 0.1 any single day

const RUM_DIR = path.join(process.cwd(),'data','rum');
if(!fs.existsSync(RUM_DIR)){
  console.log('No RUM data directory.');
  process.exit(0);
}
function readDay(file){
  const lines = fs.readFileSync(file,'utf8').trim().split(/\n+/).filter(Boolean);
  return lines.map(l=>{ try { return JSON.parse(l);} catch { return null; } }).filter(Boolean);
}
function percentile(arr,p){
  if(!arr.length) return 0; const sorted=[...arr].sort((a,b)=>a-b); const idx=Math.floor((p/100)* (sorted.length-1)); return sorted[idx];
}
// Collect last 3 days files
const files = fs.readdirSync(RUM_DIR).filter(f=>/^[0-9]{4}-[0-9]{2}-[0-9]{2}\.jsonl$/.test(f)).sort().slice(-3);
const dayStats = [];
for(const f of files){
  const day = f.slice(0,10);
  const events = readDay(path.join(RUM_DIR,f));
  const byKey = new Map(); // key = metric|page_type|route
  for(const ev of events){
    const route = ev.origin && ev.destination ? `${ev.origin}->${ev.destination}`: 'na';
    const k = `${ev.metric}|${ev.page_type}|${route}`;
    if(!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(ev.value);
  }
  const metrics = [];
  byKey.forEach((values,k)=>{
    const [metric,page_type,route] = k.split('|');
    metrics.push({ day, metric, page_type, route, p75: percentile(values,75) });
  });
  dayStats.push({ day, metrics });
}
// Evaluate alert conditions
let alerts = [];
function findMetric(day, metric){ return day.metrics.filter(m=>m.metric===metric); }
if(dayStats.length>=2){
  const last = dayStats.slice(-2);
  for(const metric of ['LCP','INP']){
    const breaches = last.map(d=> findMetric(d, metric).filter(m=> (metric==='LCP'? m.p75>2500 : m.p75>200))).map(list=> list.length>0);
    if(breaches[0] && breaches[1]){
      alerts.push(`${metric} p75 threshold breached 2 consecutive days (${last[0].day}, ${last[1].day})`);
    }
  }
}
if(dayStats.length){
  const today = dayStats[dayStats.length-1];
  const clsBreaches = findMetric(today,'CLS').filter(m=> m.p75>0.1);
  if(clsBreaches.length){
    alerts.push(`CLS p75 > 0.1 on ${today.day} (${clsBreaches.length} variants)`);
  }
}
if(alerts.length){
  // In real system, send email / webhook. For now console + exit 1.
  console.log('RUM ALERTS:\n'+alerts.map(a=>'- '+a).join('\n'));
  process.exitCode = 1;
}else{
  console.log('RUM OK: No threshold breaches');
}
