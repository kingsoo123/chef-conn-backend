const { execSync } = require('child_process');

try {
  const pids = execSync('lsof -ti :3002', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  if (pids.length === 0) {
    console.log('No process is listening on port 3002.');
    process.exit(0);
  }

  for (const pid of pids) {
    process.kill(Number(pid), 'SIGTERM');
    console.log(`Stopped process ${pid} on port 3002`);
  }
} catch {
  console.log('No process is listening on port 3002.');
}
