
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tscCliPath = path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc');

// Spawn tsc with the arguments passed to this script
const args = process.argv.slice(2);
console.log('🚀 Running TypeScript from:', tscCliPath);
console.log('📝 With args:', args);

const child = spawn('node', [tscCliPath, ...args], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('exit', (code) => {
  process.exit(code);
});
