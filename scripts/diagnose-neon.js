#!/usr/bin/env node
/**
 * Diagnose Neon connectivity from this machine.
 * Run: node scripts/diagnose-neon.js
 */
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const net = require('net');
const https = require('https');

function readDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL missing from .env');
  return line
    .slice('DATABASE_URL='.length)
    .trim()
    .replace(/^["']|["']$/g, '');
}

function hostFromUrl(url) {
  return new URL(url.replace(/^postgresql:/, 'http:')).hostname;
}

function tryTcp(host, port, ms = 8000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ ok: false, error: `timeout after ${ms}ms` });
    }, ms);
    socket.on('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve({ ok: true });
    });
    socket.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: err.message });
    });
  });
}

function tryHttps(hostname) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname, path: '/', method: 'GET', timeout: 8000 },
      (res) => {
        resolve({ ok: true, status: res.statusCode });
        res.resume();
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'https timeout' });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.end();
  });
}

async function main() {
  const url = readDatabaseUrl();
  const host = hostFromUrl(url);
  console.log('Host:', host);
  console.log('URL :', url.replace(/:[^:@/]+@/, ':****@'));
  console.log('');

  try {
    const addrs = await dns.lookup(host, { all: true });
    console.log('DNS : OK');
    for (const a of addrs) console.log('   ', a.address, a.family === 6 ? 'IPv6' : 'IPv4');
  } catch (err) {
    console.log('DNS : FAIL', err.code || err.message);
    console.log('Fix : set system DNS to 1.1.1.1 / 8.8.8.8, or copy a fresh Neon host from console.neon.tech');
    process.exit(1);
  }

  const tcp = await tryTcp(host, 5432);
  console.log('TCP :5432', tcp.ok ? 'OK' : `FAIL (${tcp.error})`);

  const httpsResult = await tryHttps(host);
  console.log(
    'HTTPS:443',
    httpsResult.ok
      ? `reachable (status ${httpsResult.status})`
      : `FAIL (${httpsResult.error})`,
  );

  console.log('');
  if (!tcp.ok && httpsResult.ok) {
    console.log('Diagnosis: port 5432 is blocked; Neon WebSocket/HTTPS path should work.');
    console.log('This backend is configured to use @neondatabase/serverless over WebSockets.');
  } else if (!tcp.ok && !httpsResult.ok) {
    console.log('Diagnosis: Neon host is not reachable at all from this network.');
    console.log('Confirm the project is Active in https://console.neon.tech and paste a fresh pooled URL.');
  } else if (tcp.ok) {
    console.log('Diagnosis: TCP 5432 works — classic pg should also connect.');
  }

  // Optional WS driver probe if package is installed
  try {
    require('@neondatabase/serverless');
    require('ws');
    const { neonConfig, Client } = require('@neondatabase/serverless');
    const ws = require('ws');
    neonConfig.webSocketConstructor = ws;
    neonConfig.useSecureWebSocket = true;
    const client = new Client({ connectionString: url });
    await client.connect();
    const result = await client.query('select current_database() as db, now() as ts');
    await client.end();
    console.log('WebSocket driver: OK', result.rows[0]);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('WebSocket driver: not installed yet — run: npm install');
    } else {
      console.log('WebSocket driver: FAIL', err.code || '', err.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
