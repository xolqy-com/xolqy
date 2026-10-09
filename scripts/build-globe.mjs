// Generates public/globe/land-dots.bin for the homepage globe (EdgeGlobe.astro).
// Output: Int16 pairs (lat*100, lon*100) on a ~1.15° equal-area grid over land.
// Run once; the .bin is committed. Needs three throwaway packages:
//   npm i --no-save world-atlas@2 topojson-client@3 d3-geo@3 && node scripts/build-globe.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/land-50m.json'), 'utf8'));
const land = feature(topo, topo.objects.land);
const STEP = 1.15;
const out = [];
for (let lat = 80; lat >= -57; lat -= STEP) {
  const n = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / STEP));
  for (let i = 0; i < n; i++) {
    const lon = -180 + (i + (Math.round(lat / STEP) % 2 ? 0.5 : 0)) * (360 / n);
    if (geoContains(land, [lon, lat])) out.push(Math.round(lat * 100), Math.round(lon * 100));
  }
}
mkdirSync('public/globe', { recursive: true });
writeFileSync('public/globe/land-dots.bin', Buffer.from(new Int16Array(out).buffer));
console.log(`${out.length / 2} land dots written to public/globe/land-dots.bin`);
