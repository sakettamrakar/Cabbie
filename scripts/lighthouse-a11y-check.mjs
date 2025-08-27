import {launch} from 'chrome-launcher';
import fs from 'fs';
import lighthouse from 'lighthouse';

const pages = [
  'http://localhost:3000/',
  'http://localhost:3000/raipur/bilaspur/fare',
  'http://localhost:3000/booking'
];

const MIN_SCORE = parseInt(process.env.LH_MIN_A11Y||'90',10);

async function run(){
  const chrome = await launch({ chromeFlags:['--headless=new','--no-sandbox'] });
  const results = [];
  for(const url of pages){
    console.log('Lighthouse a11y auditing', url);
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      onlyCategories:['accessibility'],
      disableStorageReset:true,
      formFactor:'mobile',
      screenEmulation:{ mobile:true, width:375, height:667, deviceScaleFactor:2, disabled:false }
    });
    const score = runnerResult.lhr.categories.accessibility.score * 100;
    results.push({ url, score });
    const outPath = `artifacts/lh-a11y-${encodeURIComponent(url.replace(/https?:\/\//,''))}.json`;
    fs.mkdirSync('artifacts',{recursive:true});
    fs.writeFileSync(outPath, JSON.stringify(runnerResult.lhr,null,2));
    console.log('  Accessibility score:', score);
  }
  await chrome.kill();
  const failing = results.filter(r=> r.score < MIN_SCORE);
  fs.writeFileSync('artifacts/lh-a11y-summary.json', JSON.stringify({ minRequired: MIN_SCORE, results },null,2));
  if(failing.length){
    console.error('Lighthouse accessibility score below threshold:', failing);
    process.exit(1);
  } else {
    console.log('All pages meet accessibility threshold', MIN_SCORE);
  }
}
run();
