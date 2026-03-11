const { execSync, spawn } = require('child_process');
const dir = __dirname;
process.chdir(dir);
const child = spawn('cmd.exe', ['/c', 'npx vite --port 5174'], {
  stdio: 'inherit',
  cwd: dir,
  shell: false
});
child.on('error', (err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
