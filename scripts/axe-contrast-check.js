// Axe-core contrast audit for selected pages (bypassing CSP)
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const pagesToCheck = [
    '/','/raipur/bilaspur/fare','/booking'
  ];
  const base = process.env.AXE_BASE_URL || 'http://localhost:3000';
  const browser = await chromium.launch();
  const context = await browser.newContext({ bypassCSP: true });
  const allContrastFindings = [];

  for (const path of pagesToCheck) {
    const url = base + path;
    const page = await context.newPage();
    console.log(`Checking contrast on ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const results = await page.evaluate(async () => await axe.run(document, { runOnly: ['wcag2aa'], rules: { 'color-contrast': { enabled: true } } }));
    const contrast = results.violations.filter(v => v.id === 'color-contrast');
    if (contrast.length) {
      contrast.forEach(v => v.targetPage = path);
      allContrastFindings.push(...contrast);
      console.log(`  Issues found: ${contrast.length}`);
    } else {
      console.log('  No issues.');
    }
    await page.close();
  }

  if (allContrastFindings.length) {
    fs.writeFileSync('contrast-report.json', JSON.stringify(allContrastFindings, null, 2));
    console.log(`Total contrast issues across pages: ${allContrastFindings.length}`);
    process.exitCode = 1;
  } else {
    console.log('No WCAG 2AA contrast issues detected by axe on checked pages.');
  }
  await browser.close();
})();
