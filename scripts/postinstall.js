#!/usr/bin/env node
(async () => {
  try {
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (e) {
    console.log('[postinstall] prisma generate skipped or failed (ok for minimal setup).');
  }
})();
