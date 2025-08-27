#!/usr/bin/env node
/**
 * Helper script: apply pending Prisma migration for adding UTM columns.
 * Usage: node scripts/migrate-add-utm.js
 */
const { execSync } = require('child_process');

function run(cmd){
  console.log('> '+cmd);
  execSync(cmd,{stdio:'inherit'});
}

try {
  run('npx prisma migrate deploy');
  console.log('UTM migration deployed.');
} catch (e){
  console.error('Migration failed:', e.message);
  process.exit(1);
}
