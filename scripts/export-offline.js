#!/usr/bin/env node
// Automates next build + export to out-offline and adds a simple index fallback.
const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd){
  console.log('> ' + cmd); execSync(cmd,{stdio:'inherit'});
}

try {
  run('npx next build');
  run('npx next export -o out-offline');
  const notice = `<!-- Offline bundle generated ${new Date().toISOString()} -->`;
  const idx = 'out-offline/index.html';
  if (fs.existsSync(idx)) {
    let html = fs.readFileSync(idx,'utf8');
    if (!html.includes('Offline Bundle')) {
      html = html.replace('<body','<body><div style="position:fixed;top:0;left:0;padding:4px 8px;font:12px system-ui;background:#222;color:#fff;z-index:9999">Offline Bundle</div>');
    }
    fs.writeFileSync(idx, notice + '\n' + html);
  }
  console.log('Offline export ready in out-offline/');
} catch (e) {
  console.error('Offline export failed:', e.message);
  process.exit(1);
}
