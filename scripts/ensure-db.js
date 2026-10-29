const net = require('net');
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function ensurePostgres() {
  const isUp = await checkPort(5432);
  if (isUp) {
    console.log('✓ PostgreSQL is already running on port 5432.');
    return;
  }

  console.log('PostgreSQL is not running on port 5432, checking local installation...');
  const pgCtl = 'C:\\Users\\muham\\Desktop\\Debt_back\\.local\\pgsql\\bin\\pg_ctl.exe';
  const pgData = 'C:\\Users\\muham\\Desktop\\Debt_back\\.local\\pgdata';
  const pgLog = 'C:\\Users\\muham\\Desktop\\Debt_back\\.local\\pg.log';

  if (fs.existsSync(pgCtl) && fs.existsSync(pgData)) {
    console.log('Starting local PostgreSQL via pg_ctl...');
    spawnSync(pgCtl, ['-D', pgData, '-l', pgLog, 'start'], { stdio: 'inherit' });

    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 600));
      if (await checkPort(5432)) {
        console.log('✓ PostgreSQL successfully started on port 5432.');
        return;
      }
    }
  }

  console.warn('⚠️ Could not automatically start PostgreSQL. Ensure postgres is running on port 5432.');
}

ensurePostgres().catch(console.error);
