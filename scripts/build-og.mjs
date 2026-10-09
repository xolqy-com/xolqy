#!/usr/bin/env node
/**
 * Generates social preview images (1200x630 PNG) and PNG icons from SVG
 * templates, using the self-hosted brand fonts. Runs in Node only; the
 * output is committed to public/og/ so the Worker build never needs it.
 *
 *   node scripts/build-og.mjs            # all pages, plus the 300x700 banner
 *   node scripts/build-og.mjs --banner   # banner only
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
  return `<g transform="translate(${x} ${y}) scale(${s})"><g transform="translate(32 32) rotate(45)" fill="none" stroke="${color}" stroke-width="9.31" stroke-linecap="round"><path d="M0 -26.95V-11.03M0 26.95V11.03M-26.95 0H-11.03M26.95 0H11.03"/></g><circle cx="32" cy="32" r="3.11" fill="${color}"/></g>`;
};

const wordmark = (x, y, height, color) => {
  const s = height / 40;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none">
    <g transform="translate(10.5 18)"><g transform="rotate(45)" stroke="${color}" stroke-width="3.8" stroke-linecap="round"><path d="M0 -11V-4.5M0 11V4.5M-11 0H-4.5M11 0H4.5"/></g><circle r="1.27" fill="${color}"/></g>
    <g stroke="${color}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="31.5" cy="18" r="8.1"/><path d="M46.5 2V25.7"/><circle cx="61" cy="18" r="8.1"/><path d="M69.1 18V36.5"/><path d="M74.2 10.3L82.3 27"/><path d="M89.5 10.3L78.2 36.5"/>
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

function bannerSvg() {
  const dots = Array.from({ length: 8 }, (_, i) =>
    Array.from({ length: 18 }, (_, j) => `<circle cx="${22 + i * 38}" cy="${22 + j * 38}" r="1"/>`).join(''),
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="700" viewBox="0 0 300 700">
    <rect width="300" height="700" fill="${INK}"/>
    <g fill="${PAPER}" fill-opacity="0.08">${dots}</g>
    ${wordmark(24, 32, 30, PAPER)}
    <text x="24" y="96" font-family="JetBrains Mono Variable" font-size="12" font-weight="500" letter-spacing="1.8" fill="${SIGNAL}">THE NEXT WEB</text>
    <text x="24" y="154" font-family="Bricolage Grotesque Variable" font-size="46" font-weight="700" letter-spacing="-1.6" fill="${PAPER}">The tool</text>
    <text x="24" y="206" font-family="Bricolage Grotesque Variable" font-size="46" font-weight="700" letter-spacing="-1.6" fill="${PAPER}">for the</text>
    <text x="24" y="258" font-family="Bricolage Grotesque Variable" font-size="46" font-weight="700" letter-spacing="-1.6" fill="${PAPER}">AI wave.</text>
    <text x="24" y="312" font-family="Bricolage Grotesque Variable" font-size="16" font-weight="500" fill="${PAPER}" fill-opacity="0.78">Cloudflare OS, introduced.</text>
    <text x="24" y="336" font-family="Bricolage Grotesque Variable" font-size="16" font-weight="400" fill="${PAPER}" fill-opacity="0.62">Counselling. Not the build.</text>
    <line x1="24" y1="368" x2="276" y2="368" stroke="${PAPER}" stroke-opacity="0.2"/>
    <text x="24" y="430" font-family="Bricolage Grotesque Variable" font-size="56" font-weight="700" letter-spacing="-2" fill="${PAPER}">€600</text>
    <text x="24" y="462" font-family="JetBrains Mono Variable" font-size="12" font-weight="500" letter-spacing="1.6" fill="${SIGNAL}">ONE SESSION</text>
    <text x="24" y="508" font-family="Bricolage Grotesque Variable" font-size="16" font-weight="500" fill="${PAPER}">A written recommendation:</text>
    <text x="24" y="534" font-family="Bricolage Grotesque Variable" font-size="16" font-weight="400" fill="${PAPER}" fill-opacity="0.78">stay, transition, or the</text>
    <text x="24" y="558" font-family="Bricolage Grotesque Variable" font-size="16" font-weight="400" fill="${PAPER}" fill-opacity="0.78">full Cloudflare OS package.</text>
    <rect x="0" y="620" width="300" height="80" fill="${SIGNAL}"/>
    <text x="24" y="654" font-family="Bricolage Grotesque Variable" font-size="20" font-weight="700" fill="${INK}">xolqy.com</text>
    <text x="24" y="678" font-family="JetBrains Mono Variable" font-size="12" font-weight="500" letter-spacing="0.6" fill="${INK}">€600 introduction</text>
  </svg>`;
}

async function writeBanner() {
  const bannerDir = path.join(root, 'public', 'banners');
  await mkdir(bannerDir, { recursive: true });
  await render(bannerSvg(), 300, path.join(bannerDir, 'xolqy-ai-wave-300x700.png'));
  console.log('banner: public/banners/xolqy-ai-wave-300x700.png');
}

await writeBanner();
if (process.argv.includes('--banner')) process.exit(0);

const pages = [
  { file: 'default', eyebrow: 'The Cloudflare-focused agency', title: 'Your business. At the edge.', subtitle: 'Fast websites, scalable applications and secure infrastructure on Cloudflare.' },
  { file: 'home', eyebrow: 'The Cloudflare-focused agency', title: 'Your business. At the edge.', subtitle: 'Fast websites, scalable applications and secure infrastructure on Cloudflare.' },
  { file: 'services', eyebrow: 'Services', title: 'Six ways we put Cloudflare to work.', subtitle: 'Websites, migration, performance, security, AI and managed engineering.' },
  { file: 'cloudflare-os', eyebrow: 'Cloudflare OS', title: 'Cloudflare as the operating system.', subtitle: 'Compute, data, security, AI and delivery, designed as one system in your account.' },
  { file: 'websites-and-applications', eyebrow: 'Service 01', title: 'Websites and applications that start at the edge.', subtitle: 'Astro, Workers, D1, R2 and Durable Objects, in your own account.' },
  { file: 'cloudflare-migration', eyebrow: 'Service 02', title: 'Move to Cloudflare without losing rankings.', subtitle: 'Assessment, DNS and TLS, redirect maps, rehearsed cutover, rollback.' },
  { file: 'performance-and-delivery', eyebrow: 'Service 03', title: 'Measured speed, not guessed speed.', subtitle: 'Caching, images, Core Web Vitals and application tuning from field data.' },
  { file: 'security-and-zero-trust', eyebrow: 'Service 04', title: 'Protection in front of everything.', subtitle: 'WAF, bots, rate limiting, Turnstile, Access, Gateway and Tunnel.' },
  { file: 'ai-and-automation', eyebrow: 'Service 05', title: 'AI that answers from your content.', subtitle: 'Workers AI, Vectorize, AI Gateway, Queues and Workflows with limits built in.' },
  { file: 'managed-cloudflare', eyebrow: 'Service 06', title: 'A named engineer for your Cloudflare estate.', subtitle: 'Monitoring, reviews, troubleshooting and engineering hours every month.' },
  { file: 'stack', eyebrow: 'Built on Cloudflare', title: 'How this website actually works.', subtitle: 'Compute, data, security, AI and delivery, with live integration status.' },
  { file: 'labs', eyebrow: 'Labs', title: 'Working demonstrations, not case studies.', subtitle: 'Edge inspector, AI solution finder, enquiry pipeline tracer, R2 delivery.' },
  { file: 'insights', eyebrow: 'Insights', title: 'Notes from building on Cloudflare.', subtitle: 'The operating-system series, plus Workers, migration, data and security.' },
  { file: 'about', eyebrow: 'About', title: 'Independent. Cloudflare-focused. Specific.', subtitle: 'One platform, understood deeply, applied to business outcomes.' },
  { file: 'contact', eyebrow: 'Start your project', title: 'Make Cloudflare work harder for your business.', subtitle: 'Send a short brief. We reply with questions, then a proposal.' },
  { file: 'shop', eyebrow: 'Shop', title: 'Cloudflare work, sold as products.', subtitle: 'Fixed-scope packages, monthly management and the kits we build with.' },
  { file: 'health-check', eyebrow: 'Free tool', title: 'How healthy is your domain?', subtitle: 'HTTPS, Cloudflare, security headers, DNSSEC and email authentication, scored in seconds.' },
  { file: 'security', eyebrow: 'Security', title: 'Security, in practice.', subtitle: 'How we protect client accounts, code and data, and how to report a vulnerability.' },
  { file: 'privacy', eyebrow: 'Privacy', title: 'What this site stores, and why.', subtitle: 'Enquiries in D1, no advertising cookies, Cloudflare Web Analytics.' },
  { file: 'insight-websites-on-cloudflare-workers', eyebrow: 'Insights', title: 'Why your next website belongs on Workers.', subtitle: 'What changes, what breaks, and the three questions that decide it.' },
  { file: 'insight-cloudflare-migration-runbook', eyebrow: 'Insights', title: 'The migration runbook that keeps your rankings.', subtitle: 'Inventory, TTLs, redirects as code, protection in log mode, rollback.' },
  { file: 'insight-d1-vs-kv-vs-r2', eyebrow: 'Insights', title: 'D1, KV or R2: choosing a data store.', subtitle: 'Records, configuration, files, and the failure modes of getting it wrong.' },
  { file: 'insight-cloudflare-vectorize-explained', eyebrow: 'Insights', title: 'Cloudflare Vectorize, explained.', subtitle: 'What a vector database is for, what it costs, and when to use it.' },
  { file: 'insight-dnssec-on-cloudflare', eyebrow: 'Insights', title: 'DNSSEC on Cloudflare.', subtitle: 'What it protects, how to turn it on, and the step everyone forgets.' },
  { file: 'insight-cookieless-analytics-cloudflare', eyebrow: 'Insights', title: 'Cookieless analytics.', subtitle: 'Measuring a website without a consent banner, with Cloudflare Web Analytics.' },
  { file: 'insight-cloudflare-as-an-operating-system', eyebrow: 'Insights', title: 'Cloudflare as an operating system.', subtitle: 'What the phrase means for a business, and what it does not mean.' },
  { file: 'insight-cloudflare-os-kai-agentic-mcp', eyebrow: 'Insights', title: 'The one-way road I learned late.', subtitle: 'Cloudflare OS, agents and MCP. The offer is $2,500.' },
  { file: 'insight-which-cloudflare-products-a-business-needs', eyebrow: 'Insights', title: 'Which Cloudflare products you need.', subtitle: 'Choose by the job in front of you, not by the catalogue.' },
  { file: 'insight-your-cloudflare-account-should-be-yours', eyebrow: 'Insights', title: 'The account should be yours.', subtitle: 'What client-owned Cloudflare means, and what breaks when it is not.' },
  { file: 'insight-cloudflare-in-front-or-rebuild-on-workers', eyebrow: 'Insights', title: 'In front, or a rebuild.', subtitle: 'Two projects that both get called a Cloudflare migration.' },
  { file: 'insight-zero-trust-without-a-vpn', eyebrow: 'Insights', title: 'Zero Trust without a VPN.', subtitle: 'Access checks identity. Tunnel removes the public address.' },
  { file: 'insight-queues-versus-workflows', eyebrow: 'Insights', title: 'Queues or Workflows.', subtitle: 'Where background work belongs, and how this site splits them.' },
  { file: 'insight-what-a-cloudflare-audit-covers', eyebrow: 'Insights', title: 'What an audit actually covers.', subtitle: 'A written report from inside the account, and what it is not.' },
  { file: 'insight-where-cloudflare-keeps-your-data', eyebrow: 'Insights', title: 'Where your data actually lives.', subtitle: 'What you can pin on Cloudflare, and what stays near the visitor.' },
  { file: 'insights-research', eyebrow: 'Research', title: 'Comparisons, with the limits written down.', subtitle: 'The edge cloud landscape. Cloudflare against the alternatives.' },
  { file: 'insight-edge-cloud-landscape', eyebrow: 'Research', title: 'The edge cloud landscape.', subtitle: 'Cloudflare versus the world. Ten dimensions, four verdicts.' },
  { file: 'insight-cloudflare-vs-aws', eyebrow: 'Research', title: 'Cloudflare vs AWS.', subtitle: 'Egress, memory, and what to leave in the region.' },
  { file: 'insight-cloudflare-vs-azure', eyebrow: 'Research', title: 'Cloudflare vs Azure.', subtitle: 'A network in front of a geography, not a replacement.' },
  { file: 'insight-cloudflare-vs-google-cloud', eyebrow: 'Research', title: 'Cloudflare vs Google Cloud.', subtitle: 'Object egress against a regional data platform.' },
  { file: 'insight-cloudflare-vs-vercel-netlify', eyebrow: 'Research', title: 'Cloudflare vs Vercel and Netlify.', subtitle: 'A framework host, or the network the host is not.' },
  { file: 'insight-cloudflare-vs-fastly-akamai', eyebrow: 'Research', title: 'Cloudflare vs Fastly and Akamai.', subtitle: 'Three edge networks. Density is not the only axis.' },
  { file: 'insight-cloudflare-vs-supabase-firebase', eyebrow: 'Research', title: 'Cloudflare vs Supabase and Firebase.', subtitle: 'A database with auth, or a network with a small database.' },
  { file: 'wiki', eyebrow: 'Wiki', title: 'Cloudflare, one term at a time.', subtitle: 'What each product is, when to use it, what it costs, and where it fits.' },
  { file: 'work', eyebrow: 'Work', title: 'Real projects on Cloudflare.', subtitle: 'Case studies: sites on Pages and Workers, a photo-proofing SaaS on R2, an anonymous-letters app on D1, a sailing-tours site and Cloudflare in front of a classic host.' },
  { file: 'work-la-house-of-pulse', eyebrow: 'Case study', title: 'La House of Pulse', subtitle: 'Bilingual studio site on Cloudflare Pages with its own analytics dashboard.' },
  { file: 'work-photoproof-io', eyebrow: 'Case study', title: 'photoproof.io', subtitle: 'Photo proofing for photographers, running entirely on Workers and R2.' },
  { file: 'work-ravasaki', eyebrow: 'Case study', title: 'Ravasaki', subtitle: 'Anonymous letters, no accounts, server-rendered on Workers and D1.' },
  { file: 'work-thracean-zeolite', eyebrow: 'Case study', title: 'Thracean Zeolite', subtitle: 'Bilingual export site, Cloudflare in front of a conventional host.' },
  { file: 'work-11knots', eyebrow: 'Case study', title: '11 Knots', subtitle: 'Sailing-day booking site on Cloudflare Pages with a video hero.' },
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
