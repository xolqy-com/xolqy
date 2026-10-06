#!/usr/bin/env node
/**
 * Generates social preview images (1200x630 PNG) and PNG icons from SVG
 * templates, using the self-hosted brand fonts. Runs in Node only; the
 * output is committed to public/og/ so the Worker build never needs it.
 *
 *   node scripts/build-og.mjs            # all pages
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import wawoff2 from 'wawoff2';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'og');
const tmp = path.join(root, '.og-tmp');
await mkdir(out, { recursive: true });
await mkdir(tmp, { recursive: true });

// resvg needs TTF/OTF; decode the woff2 we ship once into a temp folder.
async function ttf(name) {
  const dest = path.join(tmp, `${name}.ttf`);
  if (!existsSync(dest)) {
    const woff2 = await readFile(path.join(root, 'public', 'fonts', `${name}.woff2`));
    await writeFile(dest, Buffer.from(await wawoff2.decompress(woff2)));
  }
  return dest;
}
const fontFiles = [await ttf('bricolage-grotesque-latin-wght'), await ttf('jetbrains-mono-latin-wght')];

const INK = '#0a0a0a';
const PAPER = '#f5f5f0';
const SIGNAL = '#ff5a1f';

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Wrap text into lines that fit a rough character budget. */
function wrap(text, max) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      lines.push(line.trim());
      line = w;
    } else line = `${line} ${w}`;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

const xmark = (x, y, size, color) => {
  const s = size / 64;
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(45 32 32)"><path fill="${color}" fill-rule="evenodd" d="M27 3h10v58H27z M3 27h58v10H3z M30 30h4v4h-4z"/></g>`;
};

const wordmark = (x, y, height, color) => {
  const s = height / 40;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none">
    <g transform="translate(10.5 18) rotate(45)"><path fill="${color}" fill-rule="evenodd" d="M-1.9 -13h3.8v26h-3.8z M-13 -1.9h26v3.8h-26z M-0.95 -0.95h1.9v1.9h-1.9z"/></g>
    <g stroke="${color}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="31.5" cy="18" r="8.1"/><path d="M46.5 2V28"/><circle cx="61" cy="18" r="8.1"/><path d="M69.1 18V36.5"/><path d="M78 8.5L86 27"/><path d="M94 8.5L82 36.5"/>
    </g></g>`;
};

function ogSvg({ eyebrow, title, subtitle }) {
  const titleLines = wrap(title, 24).slice(0, 3);
  const size = titleLines.length >= 3 ? 72 : 84;
  const lineH = size * 1.02;
  const titleY = 300 - ((titleLines.length - 1) * lineH) / 2;
  const subLines = subtitle ? wrap(subtitle, 70).slice(0, 2) : [];
  // routing lines on the right
  const routes = `
    <g stroke="${PAPER}" stroke-opacity="0.22" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1010 118 L1070 58 H1200"/><path d="M1010 238 L950 178 H840"/><path d="M1010 238 L1070 298 H1200"/><path d="M1010 118 L950 58 H860"/>
      <path d="M1130 178 H1200"/><path d="M880 178 H830"/>
    </g>
    <g stroke="${SIGNAL}" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M1010 118 L1070 58 H1130"/></g>
    <g fill="${PAPER}"><circle cx="1130" cy="58" r="4"/><circle cx="840" cy="178" r="4"/><circle cx="1200" cy="298" r="4"/><circle cx="860" cy="58" r="4"/></g>
    ${xmark(940, 108, 140, SIGNAL)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${INK}"/>
    <g fill="${PAPER}" fill-opacity="0.08">${Array.from({ length: 26 }, (_, i) => Array.from({ length: 14 }, (_, j) => `<circle cx="${40 + i * 46}" cy="${40 + j * 46}" r="1.2"/>`).join('')).join('')}</g>
    ${routes}
    ${wordmark(72, 64, 44, PAPER)}
    <text x="72" y="${titleY - size - 22}" font-family="JetBrains Mono Variable" font-size="18" font-weight="500" letter-spacing="2" fill="${SIGNAL}">${esc(eyebrow.toUpperCase())}</text>
    ${titleLines.map((l, i) => `<text x="72" y="${titleY + i * lineH}" font-family="Bricolage Grotesque Variable" font-size="${size}" font-weight="700" letter-spacing="-2.5" fill="${PAPER}">${esc(l)}</text>`).join('')}
    ${subLines.map((l, i) => `<text x="72" y="${titleY + (titleLines.length - 1) * lineH + 56 + i * 32}" font-family="Bricolage Grotesque Variable" font-size="24" font-weight="400" fill="${PAPER}" fill-opacity="0.72">${esc(l)}</text>`).join('')}
    <line x1="72" y1="556" x2="1128" y2="556" stroke="${PAPER}" stroke-opacity="0.2"/>
    <text x="72" y="590" font-family="JetBrains Mono Variable" font-size="16" letter-spacing="1.5" fill="${PAPER}" fill-opacity="0.6">XOLQY.COM  ·  BUILT FOR THE EDGE  ·  THE CLOUDFLARE-FOCUSED AGENCY</text>
  </svg>`;
}

function render(svg, width, file) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque Variable' } });
  return writeFile(file, r.render().asPng());
}

const pages = [
  { file: 'default', eyebrow: 'The Cloudflare-focused agency', title: 'Your business. At the edge.', subtitle: 'Fast websites, scalable applications and secure infrastructure on Cloudflare.' },
  { file: 'home', eyebrow: 'The Cloudflare-focused agency', title: 'Your business. At the edge.', subtitle: 'Fast websites, scalable applications and secure infrastructure on Cloudflare.' },
  { file: 'services', eyebrow: 'Services', title: 'Six ways we put Cloudflare to work.', subtitle: 'Websites, migration, performance, security, AI and managed engineering.' },
  { file: 'websites-and-applications', eyebrow: 'Service 01', title: 'Websites and applications that start at the edge.', subtitle: 'Astro, Workers, D1, R2 and Durable Objects, in your own account.' },
  { file: 'cloudflare-migration', eyebrow: 'Service 02', title: 'Move to Cloudflare without losing rankings.', subtitle: 'Assessment, DNS and TLS, redirect maps, rehearsed cutover, rollback.' },
  { file: 'performance-and-delivery', eyebrow: 'Service 03', title: 'Measured speed, not guessed speed.', subtitle: 'Caching, images, Core Web Vitals and application tuning from field data.' },
  { file: 'security-and-zero-trust', eyebrow: 'Service 04', title: 'Protection in front of everything.', subtitle: 'WAF, bots, rate limiting, Turnstile, Access, Gateway and Tunnel.' },
  { file: 'ai-and-automation', eyebrow: 'Service 05', title: 'AI that answers from your content.', subtitle: 'Workers AI, Vectorize, AI Gateway, Queues and Workflows with limits built in.' },
  { file: 'managed-cloudflare', eyebrow: 'Service 06', title: 'A named engineer for your Cloudflare estate.', subtitle: 'Monitoring, reviews, troubleshooting and engineering hours every month.' },
  { file: 'stack', eyebrow: 'Built on Cloudflare', title: 'How this website actually works.', subtitle: 'Compute, data, security, AI and delivery, with live integration status.' },
  { file: 'labs', eyebrow: 'Labs', title: 'Working demonstrations, not case studies.', subtitle: 'Edge inspector, AI solution finder, enquiry pipeline tracer, R2 delivery.' },
  { file: 'insights', eyebrow: 'Insights', title: 'Technical and business articles on Cloudflare.', subtitle: 'Workers websites, migration runbooks, choosing D1, KV or R2.' },
  { file: 'about', eyebrow: 'About', title: 'Independent. Cloudflare-focused. Specific.', subtitle: 'One platform, understood deeply, applied to business outcomes.' },
  { file: 'contact', eyebrow: 'Start your project', title: 'Make Cloudflare work harder for your business.', subtitle: 'Send a short brief. We reply with questions, then a proposal.' },
  { file: 'security', eyebrow: 'Security', title: 'Security, in practice.', subtitle: 'How we protect client accounts, code and data, and how to report a vulnerability.' },
  { file: 'privacy', eyebrow: 'Privacy', title: 'What this site stores, and why.', subtitle: 'Enquiries in D1, no advertising cookies, Cloudflare Web Analytics.' },
  { file: 'insight-websites-on-cloudflare-workers', eyebrow: 'Insights', title: 'Why your next website belongs on Workers.', subtitle: 'What changes, what breaks, and the three questions that decide it.' },
  { file: 'insight-cloudflare-migration-runbook', eyebrow: 'Insights', title: 'The migration runbook that keeps your rankings.', subtitle: 'Inventory, TTLs, redirects as code, protection in log mode, rollback.' },
  { file: 'insight-d1-vs-kv-vs-r2', eyebrow: 'Insights', title: 'D1, KV or R2: choosing a data store.', subtitle: 'Records, configuration, files, and the failure modes of getting it wrong.' },
  { file: 'work', eyebrow: 'Work', title: 'Real projects on Cloudflare.', subtitle: 'Case studies: a bilingual studio site on Pages, a photo-proofing SaaS on Workers and R2, and an anonymous-letters app on Workers and D1.' },
  { file: 'work-la-house-of-pulse', eyebrow: 'Case study', title: 'La House of Pulse', subtitle: 'Bilingual studio site on Cloudflare Pages with its own analytics dashboard.' },
  { file: 'work-photoproof-io', eyebrow: 'Case study', title: 'photoproof.io', subtitle: 'Photo proofing for photographers, running entirely on Workers and R2.' },
  { file: 'work-ravasaki', eyebrow: 'Case study', title: 'Ravasaki', subtitle: 'Anonymous letters, no accounts, server-rendered on Workers and D1.' },
];

for (const p of pages) {
  await render(ogSvg(p), 1200, path.join(out, `${p.file}.png`));
}

// Icons
const favicon = await readFile(path.join(root, 'public', 'favicon.svg'), 'utf8');
await render(favicon, 32, path.join(root, 'public', 'favicon-32.png'));
await render(favicon, 180, path.join(root, 'public', 'apple-touch-icon.png'));
await render(favicon, 192, path.join(root, 'public', 'icon-192.png'));
await render(favicon, 512, path.join(root, 'public', 'icon-512.png'));
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${INK}"/>${xmark(96, 96, 320, SIGNAL)}</svg>`;
await render(logo, 512, path.join(out, 'logo.png'));

// favicon.ico (single 32x32 PNG wrapped in an ICO container)
const png32 = await readFile(path.join(root, 'public', 'favicon-32.png'));
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
await writeFile(path.join(root, 'public', 'favicon.ico'), Buffer.concat([header, png32]));

console.log(`og: wrote ${pages.length} images + icons to public/`);
