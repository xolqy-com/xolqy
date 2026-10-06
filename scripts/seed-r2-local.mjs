#!/usr/bin/env node
/** Puts every file in ./resources into the LOCAL R2 simulator used by `astro dev` / `wrangler dev`. */
import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'resources');
const types = { '.md': 'text/markdown; charset=utf-8', '.pdf': 'application/pdf', '.json': 'application/json' };
for (const file of await readdir(dir)) {
  const type = types[path.extname(file)] ?? 'application/octet-stream';
  const r = spawnSync('npx', ['wrangler', 'r2', 'object', 'put', `xolqy-resources/${file}`, '--file', path.join(dir, file), '--content-type', type, '--local'], { stdio: 'inherit', cwd: root });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
