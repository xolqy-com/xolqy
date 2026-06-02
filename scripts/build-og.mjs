// Generates per-page Open Graph images (1200x630 PNG) into public/og/.
// Run: npm run og   (re-run whenever you add pages/posts)
//
// Source of truth is src/site.ts itself: we bundle it with esbuild (it has no
// runtime imports) and read PAGES/POSTS so titles never drift from the site.

import { build } from 'esbuild';
import sharp from 'sharp';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'public', 'og');
const TMP = join(root, '.og-tmp.mjs');

// --- Load the real page/post data from src/site.ts ---------------------------
await build({
  entryPoints: [join(root, 'src', 'site.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: TMP,
  logLevel: 'silent',
});
const site = await import('file://' + TMP);

// --- Helpers -----------------------------------------------------------------
const esc = (s) =>
  String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const clip = (s, n) => {
  const t = String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

// Greedy word wrap to <= maxChars per line, capped at maxLines.
function wrap(text, maxChars, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.slice(0, maxLines);
}

function svg(title, subtitle) {
  const titleLines = wrap(esc(title), 26, 3);
  const startY = 250 - (titleLines.length - 1) * 34;
  const tspans = titleLines
    .map((l, i) => `<tspan x="90" y="${startY + i * 84}">${l}</tspan>`)
    .join('');
  const sub = esc(clip(subtitle, 92));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="0" y="0" width="1200" height="8" fill="#ea580c"/>
  <g>
    <rect x="90" y="70" width="64" height="64" rx="14" fill="#ea580c"/>
    <text x="122" y="118" font-family="Georgia, 'Times New Roman', serif" font-size="44" fill="#ffffff" text-anchor="middle">X</text>
    <text x="172" y="116" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="#ffffff">Xolqy</text>
  </g>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="#ffffff">${tspans}</text>
  <text x="90" y="${startY + titleLines.length * 84 + 6}" font-family="'Segoe UI', Arial, sans-serif" font-size="32" fill="#9a9a9a">${sub}</text>
  <text x="90" y="575" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="#ea580c">xolqy.com</text>
  <text x="1110" y="575" font-family="'Segoe UI', Arial, sans-serif" font-size="24" fill="#666666" text-anchor="end">Privacy-first web analytics</text>
</svg>`;
}

// --- Build the target list from real content ---------------------------------
const targets = [
  { slug: 'home', title: 'Privacy-first web analytics', subtitle: 'Cookieless. Lightweight. Yours. The simple alternative to Google Analytics.' },
  { slug: 'default', title: 'Xolqy', subtitle: 'Cookieless, privacy-first web analytics.' },
];
for (const [slug, p] of Object.entries(site.PAGES)) {
  targets.push({ slug, title: p.title, subtitle: p.description });
}
for (const [slug, post] of Object.entries(site.POSTS)) {
  targets.push({ slug: `blog-${slug}`, title: post.title, subtitle: post.excerpt });
}

// --- Render ------------------------------------------------------------------
await mkdir(OUT, { recursive: true });
let n = 0;
for (const t of targets) {
  const buf = Buffer.from(svg(t.title, t.subtitle));
  await sharp(buf).png().toFile(join(OUT, `${t.slug}.png`));
  n++;
}
await rm(TMP, { force: true });
console.log(`Generated ${n} OG images into public/og/`);
