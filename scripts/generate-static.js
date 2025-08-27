#!/usr/bin/env node
// Generates a single static HTML file embedding selected env vars without starting a server.
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const vars = ['BRAND_NAME','SITE_DOMAIN'];
const data = vars.map(k=>`${k}: ${process.env[k]||''}`).join('\n');
const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>${process.env.BRAND_NAME||'Raipur Cabs'} Static</title><style>body{font-family:system-ui;margin:2rem;}</style></head><body><h1>${process.env.BRAND_NAME||'Raipur Cabs'} — Static Preview</h1><p>No server required. Below are selected environment values:</p><pre>${data}</pre><p>Edit pages/index.js and later run a server when allowed.</p></body></html>`;
fs.writeFileSync('static-preview.html', html);
console.log('Generated static-preview.html');
