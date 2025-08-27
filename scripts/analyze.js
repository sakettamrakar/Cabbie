#!/usr/bin/env node
process.env.ANALYZE='true';
const { spawn } = require('child_process');
const cmd = process.platform === 'win32' ? 'next.cmd' : 'next';
const p = spawn(cmd, ['build'], { stdio:'inherit', shell:true });
p.on('exit', code=> process.exit(code));
