// Run axe on key pages for core a11y violations (excluding color-contrast tested elsewhere)
const { chromium } = require('playwright');
const fs = require('fs');

const pages = [
  '/',
  '/raipur/bilaspur/fare',
  '/booking'
];

(async () => {
  const base = process.env.AXE_BASE_URL || 'http://localhost:3000';
  const browser = await chromium.launch();
  const context = await browser.newContext({ bypassCSP:true });
  const resultsAll = [];
  for(const path of pages){
    const page = await context.newPage();
    const url = base + path;
    console.log('A11y (axe) scanning', url);
    await page.goto(url, { waitUntil:'domcontentloaded' });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const res = await page.evaluate(async ()=> await axe.run(document, { runOnly:['wcag2a','wcag2aa'], rules:{ 'color-contrast': { enabled:false }}}));
    const violations = res.violations;
    resultsAll.push({ path, violations });
    if(violations.length){
      console.log(`  Violations: ${violations.length}`);
    } else {
      console.log('  No violations');
    }
    await page.close();
  }
  fs.mkdirSync('artifacts',{ recursive:true });
  fs.writeFileSync('artifacts/axe-a11y.json', JSON.stringify(resultsAll,null,2));
  const total = resultsAll.reduce((a,r)=> a + r.violations.length,0);
  if(total){
    console.error(`Accessibility violations detected: ${total}`);
    process.exitCode = 1;
  } else {
    console.log('No axe-core violations on key pages.');
  }
  await browser.close();
})();
