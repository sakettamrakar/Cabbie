#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PID_FILE = path.join(__dirname, '..', '.devserver.pid');
let childProcess = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, attempts = 60, delayMs = 1000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        return;
      }
    } catch (error) {
      if (attempt % 10 === 0) {
        console.log('[dev-server] waiting for server...', error.message);
      }
    }
    await sleep(delayMs);
  }
  throw new Error(`Server did not respond at ${url}`);
}

async function startServer(options = {}) {
  if (childProcess) {
    throw new Error('Server already running in this process');
  }
  const port = options.port || process.env.PORT || '3000';
  const detached = Boolean(options.detached);
  const persistPid = Boolean(options.persistPid);
  const stdio = options.stdio || (detached ? 'ignore' : 'inherit');
  const env = { ...process.env, PORT: String(port), NEXT_TELEMETRY_DISABLED: '1' };
  const spawnOptions = {
    env,
    stdio,
    detached,
    shell: process.platform === 'win32',
  };

  const spawned = spawn('npm', ['run', 'dev'], spawnOptions);
  if (!detached) {
    childProcess = spawned;
  }
  if (detached) {
    spawned.unref();
  }
  if (persistPid) {
    fs.writeFileSync(PID_FILE, String(spawned.pid));
  }

  const healthUrl = options.healthUrl || `http://127.0.0.1:${port}/api/v1/health`;
  try {
    await waitForServer(healthUrl, options.healthChecks || 60, options.healthDelay || 1000);
  } catch (error) {
    if (detached) {
      try {
        process.kill(spawned.pid, 'SIGTERM');
      } catch (killError) {
        console.warn('[dev-server] failed to stop detached process', killError);
      }
    } else {
      await terminateProcess(spawned, options.signal || 'SIGTERM', options.timeoutMs || 8000);
      childProcess = null;
    }
    throw error;
  }
  console.log(`[dev-server] ready on ${healthUrl}`);
  return { port, pid: spawned.pid, url: `http://127.0.0.1:${port}` };
}

function terminateProcess(proc, signal = 'SIGTERM', timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!proc || proc.killed) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch (error) {
        console.warn('[dev-server] forced kill failed', error);
      }
      resolve();
    }, timeoutMs);
    proc.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    try {
      proc.kill(signal);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

async function stopServer(options = {}) {
  const fromPidFile = Boolean(options.fromPidFile);
  if (!fromPidFile && childProcess) {
    const proc = childProcess;
    childProcess = null;
    await terminateProcess(proc, options.signal || 'SIGTERM', options.timeoutMs || 8000);
    return;
  }

  if (fs.existsSync(PID_FILE)) {
    const pid = Number(fs.readFileSync(PID_FILE, 'utf8'));
    try {
      process.kill(pid, options.signal || 'SIGTERM');
      console.log(`[dev-server] stopped process ${pid}`);
    } catch (error) {
      console.warn(`[dev-server] failed to stop process ${pid}`, error.message);
    }
    fs.unlinkSync(PID_FILE);
  } else if (fromPidFile) {
    console.warn('[dev-server] no PID file found');
  }
}

async function cli() {
  const action = process.argv[2];
  if (action === 'start') {
    try {
      const info = await startServer({ detached: true, persistPid: true, stdio: 'ignore' });
      console.log(`[dev-server] started on port ${info.port} (pid ${info.pid})`);
    } catch (error) {
      console.error('[dev-server] failed to start', error);
      process.exitCode = 1;
    }
    return;
  }
  if (action === 'stop') {
    try {
      await stopServer({ fromPidFile: true });
    } catch (error) {
      console.error('[dev-server] failed to stop', error);
      process.exitCode = 1;
    }
    return;
  }
  console.log('Usage: node scripts/dev-server.js <start|stop>');
  process.exitCode = 1;
}

if (require.main === module) {
  cli();
}

module.exports = { startServer, stopServer };
