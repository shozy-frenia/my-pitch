import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const path of ['index.html', 'brand', 'docs', 'CNAME', 'vercel.json']) {
  await cp(new URL(path, `file://${root}`), new URL(path, dist), { recursive: true });
}
console.log('Static research site built in dist/ (no runtime dependencies).');
