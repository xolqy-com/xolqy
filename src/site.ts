// Marketing site: shared shell (header + rich footer) and the content registry
// for every page linked from the footer. Pages are rendered by the Worker (see
// worker.ts) so the header/footer stay consistent and no footer link 404s.
//
// To add a page: add an entry to PAGES and link it from a FOOTER column.

const YEAR = 2026; // bumped manually; avoids new Date() in any shared code paths

// ----------------------------------------------------------------------------
// Footer structure — mirrors a full product site (cf. Plausible's footer).
interface Link { label: string; href: string; ext?: boolean }
interface Column { title: string; links: Link[] }

const FOOTER_COLUMNS: Column[] = [
  {
    title: 'Why Xolqy?',
    links: [
      { label: 'Simple metrics', href: '/simple-metrics' },
      { label: 'Lightweight script', href: '/lightweight-script' },
      { label: 'Privacy focused', href: '/privacy-focused' },
      { label: 'Cookieless', href: '/cookieless' },
      { label: 'No cookie banner', href: '/no-cookie-banner' },
      { label: 'Open source', href: '/open-source' },
      { label: 'Web analytics', href: '/web-analytics' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'vs Google Analytics', href: '/vs-google-analytics' },
      { label: 'vs Plausible', href: '/vs-plausible' },
      { label: 'vs Matomo', href: '/vs-matomo' },
      { label: 'Migrate from GA4', href: '/migrate-from-ga4' },
      { label: 'Is Xolqy right for you?', href: '/is-xolqy-right-for-you' },
      { label: 'WordPress', href: '/wordpress' },
      { label: 'Google Tag Manager', href: '/google-tag-manager' },
      { label: 'The tracking script', href: '/script' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Cookieless analytics guide', href: '/blog/cookieless-analytics-guide' },
      { label: 'Blog', href: '/blog' },
      { label: "What's new", href: '/changelog' },
      { label: 'Status', href: '/status' },
      { label: 'API', href: '/api-docs' },
      { label: 'GitHub', href: 'https://github.com/xolqy-com/xolqy', ext: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Data policy', href: '/data-policy' },
      { label: 'Terms', href: '/terms' },
      { label: 'DPA', href: '/dpa' },
      { label: 'Security', href: '/security' },
      { label: 'Imprint', href: '/imprint' },
    ],
  },
];

function footerHtml(): string {
  const cols = FOOTER_COLUMNS.map((c) => `
      <nav class="footer-col">
        <h4>${c.title}</h4>
        ${c.links.map((l) => `<a href="${l.href}"${l.ext ? ' rel="noopener" target="_blank"' : ''}>${l.label}</a>`).join('\n        ')}
      </nav>`).join('');
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="footer-logo"><span class="mark">X</span> Xolqy</div>
        <p class="footer-tag">Cookieless, privacy-first web analytics.<br/>Built on Cloudflare's global edge.</p>
        <p class="footer-tag muted">Self-hostable · Free to start.</p>
      </div>
      ${cols}
    </div>
    <div class="footer-bottom">
      <span>© ${YEAR} Xolqy</span>
      <span>No cookies · No consent banner · No 50KB bundle</span>
    </div>
  </footer>`;
}

// ----------------------------------------------------------------------------
// Header
function headerHtml(): string {
  return `
  <header class="site-nav">
    <a class="nav-brand" href="/"><span class="mark">X</span> Xolqy</a>
    <nav class="nav-links">
      <a href="/web-analytics">Why Xolqy</a>
      <a href="/vs-google-analytics">Compare</a>
      <a href="/docs">Docs</a>
      <a href="/pricing">Pricing</a>
      <a href="/blog">Blog</a>
    </nav>
    <div class="nav-cta">
      <a class="nav-login" href="/login">Log in</a>
      <a class="btn-primary" href="/login">Get started</a>
    </div>
  </header>`;
}

// ----------------------------------------------------------------------------
// Full document shell
function shell(opts: {
  title: string; description: string; body: string;
  path: string; origin: string; ogSlug: string; ogType?: string;
  jsonLd?: Record<string, unknown>[]; keywords?: string;
}): string {
  const title = `${opts.title} · Xolqy`;
  const desc = opts.description.replace(/"/g, '&quot;');
  const canonical = `${opts.origin}${opts.path}`;
  const ogImage = `${opts.origin}/og/${opts.ogSlug}.png`;
  const keywordsTag = opts.keywords ? `\n  <meta name="keywords" content="${opts.keywords}" />` : '';
  // Base structured data on every page, plus any page-specific schema.
  const schema: Record<string, unknown>[] = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Xolqy', url: opts.origin, logo: `${opts.origin}/og/home.png`, sameAs: ['https://github.com/xolqy-com/xolqy'] },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Xolqy', url: opts.origin },
    ...(opts.jsonLd || []),
  ];
  const ldTags = schema.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n  ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="description" content="${desc}" />${keywordsTag}
  <link rel="canonical" href="${canonical}" />
  <meta property="og:site_name" content="Xolqy" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="${opts.ogType || 'website'}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${ogImage}" />
  <link rel="alternate" type="application/rss+xml" title="Xolqy Blog" href="${opts.origin}/rss.xml" />
  ${ldTags}
  <link rel="stylesheet" href="/dashboard.css" />
</head>
<body class="site">
  ${headerHtml()}
  ${opts.body}
  ${footerHtml()}
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// Content helpers
function hero(h1: string, lead: string): string {
  return `<header class="page-hero"><h1>${h1}</h1><p class="lead">${lead}</p></header>`;
}
function section(h2: string, ...paras: string[]): string {
  return `<section class="prose"><h2>${h2}</h2>${paras.map((p) => `<p>${p}</p>`).join('')}</section>`;
}
function bullets(...items: string[]): string {
  return `<ul class="prose-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}
function cta(text = 'Start tracking in 2 minutes'): string {
  return `<div class="page-cta"><p>${text}</p><div><a class="btn-primary" href="/login">Get started free</a> <a class="btn-ghost" href="/docs">Read the docs</a></div></div>`;
}
function pageBody(inner: string): string {
  return `<main class="page"><div class="page-inner">${inner}</div></main>`;
}

const INSTALL = `&lt;script defer src="https://xolqy.com/t.js"&gt;&lt;/script&gt;`;

// Versioned, immutable build + Subresource Integrity hash (computed from the
// exact bytes served at /v1/t.js). Lets customers pin the script so it can
// never silently change. Update only when a new version (/v2/t.js) ships.
const TRACKER_SRI = 'sha384-pKXxF1rkM+EtLGxb5cqWrj0csxQ//a4DJH4lEGqHbUql1i5GSyVZgBxs4j+ljjOo';
const PINNED_INSTALL =
  `&lt;script defer\n  src="https://xolqy.com/v1/t.js"\n  integrity="${TRACKER_SRI}"\n  crossorigin="anonymous"&gt;&lt;/script&gt;`;

// ----------------------------------------------------------------------------
// Landing page
export const LANDING_DESCRIPTION =
  'Cookieless web analytics — a fast, GDPR-friendly alternative to Google Analytics with no cookies and no consent banner. <2KB script, scroll & engagement metrics, self-hostable on Cloudflare. Free up to 10k pageviews/mo.';

const LANDING_KEYWORDS =
  'cookieless analytics, cookieless web analytics, privacy-first analytics, google analytics alternative, GDPR analytics, no cookie banner, plausible alternative, self-hosted analytics, cloudflare analytics';

// Homepage FAQ — single source for the visible section AND the FAQPage schema
// (Google requires the answers to be visible on the page). These double as
// quotable answers for AI assistants.
type QA = [string, string];
const HOME_FAQ: QA[] = [
  ['Is Xolqy really cookieless?',
   'Yes. Xolqy sets no cookies and stores no IP addresses. It counts daily unique visitors with a salted hash of IP + user-agent that rotates every midnight UTC, so nothing personal is stored.'],
  ['Do I need a cookie consent banner?',
   'For analytics, almost never. Because Xolqy uses no cookies and stores no personal data, most sites have no analytics reason for a consent banner. (Always confirm your own legal obligations.)'],
  ['How does Xolqy count visitors without cookies?',
   'It derives a short, daily-rotating salted hash on the server — enough to count unique visitors within a day, but useless for tracking anyone over time. The raw IP is never stored.'],
  ['Is Xolqy GDPR compliant?',
   'Xolqy is built privacy-first: no cookies, no IP storage, no cross-site tracking. Aggregate measurement relies on the site operator’s legitimate interest, and we publish a privacy policy, data policy, and DPA.'],
  ['How is Xolqy different from Google Analytics?',
   'It is far simpler and lighter: a <2KB cookieless script vs ~45KB, the numbers that matter on one screen instead of a reporting maze, no consent banner, and you can self-host so the data stays yours.'],
  ['Is Xolqy free? Can I self-host it?',
   'There is a free plan up to 10k pageviews/month, with paid tiers above that. Xolqy is also open source (AGPL) and runs on the Cloudflare free tier, so you can self-host it for free.'],
];

function faqSection(title: string, qa: QA[]): string {
  const items = qa.map(([q, a]) => `<details class="faq-item"><summary>${q}</summary><p>${a}</p></details>`).join('');
  return `<section class="prose faq"><h2>${title}</h2>${items}</section>`;
}

function faqSchema(qa: QA[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

function landingBody(): string {
  return `
  <main class="landing-main">
    <section class="hero">
      <div class="hero-mark">X</div>
      <h1>Cookieless web analytics</h1>
      <p class="hero-sub">Privacy-first, lightweight, and yours. The simple, GDPR-friendly alternative to Google Analytics — no cookies, no consent banner, built on Cloudflare's global edge.</p>
      <div class="hero-cta">
        <a class="btn-primary lg" href="/login">Get started free</a>
        <a class="btn-ghost lg" href="/vs-google-analytics">Why switch from GA?</a>
      </div>
      <pre class="install"><code>${INSTALL}</code></pre>
      <p class="hero-meta">No cookies · No consent banner · &lt; 2 KB script · Free up to 10k pageviews/mo</p>
    </section>
    <section class="features">
      <div class="feat"><b>Simple metrics.</b> Pageviews, visitors, time on page, scroll depth, sources, countries, devices — on one screen.</div>
      <div class="feat"><b>Cookieless.</b> A daily-rotating salted hash, no personal data stored. No consent banner needed.</div>
      <div class="feat"><b>Tiny &amp; fast.</b> The script is under 2 KB and loads async. It won't slow your site down.</div>
      <div class="feat"><b>Scroll &amp; engagement.</b> See how far people actually read and where they drop off.</div>
      <div class="feat"><b>Multi-site.</b> One account, every domain you own — or a super-admin view across all of them.</div>
      <div class="feat"><b>Yours.</b> Self-host on your own Cloudflare account, or let us run it. Your data stays your data.</div>
    </section>
    <div class="page"><div class="page-inner">${faqSection('Frequently asked questions', HOME_FAQ)}</div></div>
    ${pageBody(cta('Ready to see your traffic the simple way?'))}
  </main>`;
}

// SoftwareApplication schema with the real pricing tiers.
function softwareAppSchema(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Xolqy',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: LANDING_DESCRIPTION,
    url: origin,
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Starter', price: '9', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Growth', price: '19', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Business', price: '49', priceCurrency: 'USD' },
    ],
  };
}

function pricingFaqSchema(): Record<string, unknown> {
  const qa = [
    ['What counts as a pageview?', 'Every page load that runs the script. Pings for time-on-page and scroll do not count again.'],
    ['What happens if I go over my tier?', 'We never drop your data. We will email you to upgrade; nothing breaks.'],
    ['Can I self-host instead?', 'Yes — Xolqy is open source and runs on the Cloudflare free tier. See the docs.'],
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

export function renderLanding(origin: string): string {
  return shell({
    title: 'Cookieless web analytics', description: LANDING_DESCRIPTION, body: landingBody(),
    path: '/', origin, ogSlug: 'home', keywords: LANDING_KEYWORDS,
    jsonLd: [softwareAppSchema(origin), faqSchema(HOME_FAQ)],
  });
}

// ----------------------------------------------------------------------------
// Pricing (decided: freemium + usage tiers)
function pricingBody(): string {
  const tiers = [
    { name: 'Free', price: '$0', unit: 'forever', pv: 'Up to 10k pageviews/mo', feats: ['1 site', '30-day data retention', 'Cookieless tracking', 'Community support'], cta: 'Start free' },
    { name: 'Starter', price: '$9', unit: '/mo', pv: '100k pageviews/mo', feats: ['Up to 10 sites', '1-year retention', 'Email reports', 'Email support'], cta: 'Choose Starter', featured: false },
    { name: 'Growth', price: '$19', unit: '/mo', pv: '1M pageviews/mo', feats: ['Up to 50 sites', '3-year retention', 'Team members', 'Priority support'], cta: 'Choose Growth', featured: true },
    { name: 'Business', price: '$49', unit: '/mo', pv: '5M pageviews/mo', feats: ['Unlimited sites', '5-year retention', 'API access', 'Priority support'], cta: 'Choose Business' },
    { name: 'Enterprise', price: 'Custom', unit: '', pv: 'Unlimited', feats: ['Volume pricing', 'SSO & SLA', 'Self-host support', 'Dedicated contact'], cta: 'Contact us', enterprise: true },
  ];
  const cards = tiers.map((t) => `
    <div class="price-card${(t as any).featured ? ' featured' : ''}">
      ${(t as any).featured ? '<div class="price-flag">Most popular</div>' : ''}
      <h3>${t.name}</h3>
      <div class="price"><span class="amount">${t.price}</span><span class="unit">${t.unit}</span></div>
      <div class="price-pv">${t.pv}</div>
      ${bullets(...t.feats)}
      <a class="btn-primary block" href="${(t as any).enterprise ? '/contact' : '/login'}">${t.cta}</a>
    </div>`).join('');
  return pageBody(`
    ${hero('Simple, usage-based pricing', 'Start free. Upgrade only when your traffic grows. No per-seat games, no surprise overages — pick the pageview tier that fits.')}
    <div class="pricing-grid">${cards}</div>
    ${section('Every plan includes',
      'Cookieless tracking with no consent banner, the full dashboard (top pages, sources, countries, devices, scroll &amp; engagement), unlimited dashboard views, and the &lt; 2 KB script.')}
    ${bullets(
      'No cookies and no personal data stored — so no GDPR consent banner.',
      'Cancel anytime; downgrade to Free and keep your data within retention limits.',
      'Self-hosting is always free and open source — you only pay for our managed hosting.',
    )}
    ${section('Frequently asked',
      '<b>What counts as a pageview?</b> Every page load that runs the script. Pings for time-on-page and scroll do not count again.',
      '<b>What happens if I go over my tier?</b> We never drop your data. We will email you to upgrade; nothing breaks.',
      '<b>Can I self-host instead?</b> Yes — Xolqy is open source and runs on the Cloudflare free tier. See the docs.')}
    ${cta('Start on the free plan — no card required')}
  `);
}

// ----------------------------------------------------------------------------
// Reusable content for the many marketing pages
type Page = { title: string; description: string; body: string };

function feature(title: string, description: string, lead: string, secs: [string, string[]][], list?: string[]): Page {
  return {
    title,
    description,
    body: pageBody(`${hero(title, lead)}${secs.map(([h, ps]) => section(h, ...ps)).join('')}${list ? bullets(...list) : ''}${cta()}`),
  };
}

function compareTable(rival: string, rows: [string, string, string][]): string {
  const body = rows.map(([feat, x, r]) => `<tr><td>${feat}</td><td class="yes">${x}</td><td>${r}</td></tr>`).join('');
  return `<div class="compare-table"><table>
    <thead><tr><th>Feature</th><th>Xolqy</th><th>${rival}</th></tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function compare(rival: string, description: string, lead: string, secs: [string, string[]][], facts?: [string, string, string][], faq?: QA[]): Page {
  return {
    title: `Xolqy vs ${rival}`,
    description,
    body: pageBody(`${hero(`Xolqy vs ${rival}`, lead)}${facts ? compareTable(rival, facts) : ''}${secs.map(([h, ps]) => section(h, ...ps)).join('')}${faq ? faqSection('FAQ', faq) : ''}${cta(`Switching from ${rival}? It takes minutes.`)}`),
  };
}

// Per-comparison FAQ — visible on the page AND emitted as FAQPage schema.
const VS_GA_FAQ: QA[] = [
  ['Is Xolqy a good Google Analytics alternative?', 'For sites that want simple, privacy-friendly traffic numbers without cookies, a consent banner, or a 45KB script, yes. It will not replace GA4’s ad attribution or deep e-commerce funnels.'],
  ['Do I still need a cookie consent banner?', 'No. GA4 uses cookies and shares data with Google, which requires a banner. Xolqy is cookieless and stores no personal data, so most sites need none for analytics.'],
  ['Can I migrate from GA4 to Xolqy?', 'Yes. Install Xolqy alongside GA4, compare for a week, then remove the GA tag. No data export is required.'],
];
const VS_PLAUSIBLE_FAQ: QA[] = [
  ['How is Xolqy different from Plausible?', 'Same cookieless, simple-metrics philosophy, but Xolqy runs on Cloudflare Workers + D1 (a generous free self-host tier) and adds scroll depth, engagement, and a super-admin view across every domain.'],
  ['Is Xolqy a cheaper Plausible alternative?', 'There is a free plan up to 10k pageviews/month, and Xolqy is self-hostable for free on Cloudflare’s edge.'],
  ['Is Xolqy open source like Plausible?', 'Yes — Xolqy is AGPL-licensed and source-available on GitHub.'],
];
const VS_MATOMO_FAQ: QA[] = [
  ['Why choose Xolqy over self-hosting Matomo?', 'Matomo needs a PHP + MySQL server you maintain and scale. Xolqy is serverless on Cloudflare — it scales to zero, runs on the free tier, and ships a <2KB cookieless script.'],
  ['Is Xolqy as privacy-friendly as Matomo?', 'Xolqy is cookieless by default and stores no IP addresses. Matomo can be configured for privacy but is heavier to run.'],
  ['Can I self-host Xolqy for free?', 'Yes, on the Cloudflare free tier. Xolqy is open source under the AGPL.'],
];
const PAGE_FAQ: Record<string, QA[]> = {
  'vs-google-analytics': VS_GA_FAQ,
  'vs-plausible': VS_PLAUSIBLE_FAQ,
  'vs-matomo': VS_MATOMO_FAQ,
};

function legal(title: string, description: string, intro: string, secs: [string, string[]][]): Page {
  return {
    title,
    description,
    body: pageBody(`${hero(title, intro)}<p class="legal-note">This is a plain-language template. Review it with your own counsel before relying on it for compliance.</p>${secs.map(([h, ps]) => section(h, ...ps)).join('')}`),
  };
}

// ----------------------------------------------------------------------------
// Blog posts. Key = slug under /blog/. Newest first by listing order.
type Post = { title: string; date: string; iso: string; excerpt: string; body: string };

export const POSTS: Record<string, Post> = {
  'cookieless-analytics-guide': {
    title: 'Cookieless Analytics: The Complete Guide for Website Owners (2026)',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'Everything website owners need to know about cookieless analytics in 2026 — how it works, the pros and cons versus cookie-based tracking, GDPR, and whether it is the new default.',
    body: `
      <p>For two decades, web analytics meant cookies. In 2026 that is changing fast: third-party cookies are being phased out, privacy laws have teeth, consent banners hurt conversion, and GA4 left a lot of owners frustrated. <strong>Cookieless analytics</strong> is the answer most privacy-conscious sites are moving to. This guide explains what it is, how it compares, and how to adopt it.</p>
      <h2>What is cookieless analytics?</h2>
      <p>Cookieless analytics measures your traffic without storing a cookie or other persistent identifier on the visitor's device. Instead of recognising a browser across days, it counts visits using anonymous, server-side techniques. See the deep dive: <a href="/blog/what-is-cookieless-analytics">What is cookieless analytics?</a></p>
      <h2>Why 2026 is the turning point</h2>
      <ul class="prose-list">
        <li><strong>Third-party cookies are dying.</strong> Browsers block them by default; ad-tech's cross-site tracking is collapsing.</li>
        <li><strong>Privacy law is enforced.</strong> GDPR, ePrivacy and similar laws make cookie-based tracking a consent (and liability) problem.</li>
        <li><strong>Consent-banner fatigue.</strong> Banners hurt UX and conversion, and many are not even compliant.</li>
        <li><strong>GA4 frustration.</strong> Powerful but complex, sampled, and owned by Google. Many owners just want simple, trustworthy numbers.</li>
      </ul>
      <h2>Cookieless vs cookie-based analytics: pros and cons</h2>
      <div class="compare-table"><table>
        <thead><tr><th>Aspect</th><th>Cookieless</th><th>Cookie-based (e.g. GA4)</th></tr></thead>
        <tbody>
          <tr><td>Consent banner</td><td class="yes">Usually not needed</td><td>Required</td></tr>
          <tr><td>Privacy / PII</td><td class="yes">No cookies, no IP stored</td><td>Cookies + personal data</td></tr>
          <tr><td>Script size / speed</td><td class="yes">Tiny (&lt; 2 KB)</td><td>Heavy (~45 KB+)</td></tr>
          <tr><td>Simplicity</td><td class="yes">One screen</td><td>Steep learning curve</td></tr>
          <tr><td>Cross-day / cross-site tracking</td><td>No (by design)</td><td>Yes</td></tr>
          <tr><td>Ad attribution & deep funnels</td><td>Limited</td><td class="yes">Advanced</td></tr>
          <tr><td>Data ownership</td><td class="yes">Yours (self-host option)</td><td>Vendor</td></tr>
        </tbody>
      </table></div>
      <h2>Is cookieless analytics accurate?</h2>
      <p>For the numbers that matter to most sites — pageviews, unique visitors, sources, top pages, engagement — yes. It does not follow individuals across days, so it cannot do person-level retargeting or multi-day attribution. That is a deliberate trade for privacy and simplicity.</p>
      <h2>Do you still need a cookie banner?</h2>
      <p>For analytics, usually not — though it depends on your tool, setup and jurisdiction. We cover the nuances in <a href="/blog/do-i-need-a-cookie-banner">Do you need a cookie banner for cookieless analytics?</a> and <a href="/blog/cookieless-analytics-gdpr">Cookieless analytics and GDPR</a>.</p>
      <h2>Is this the new era of analytics?</h2>
      <p>Yes. With third-party cookies gone and privacy the default expectation, cookieless, first-party, privacy-first measurement is becoming the standard rather than the exception. The winners will be tools that are simple, fast, and respectful of visitors.</p>
      <h2>Read the rest of the cluster</h2>
      <ul class="prose-list">
        <li><a href="/blog/what-is-cookieless-analytics">What Is Cookieless Analytics?</a></li>
        <li><a href="/blog/cookieless-analytics-vs-ga4">Cookieless Analytics vs GA4</a></li>
        <li><a href="/blog/google-analytics-alternatives-without-cookies">Best Google Analytics Alternatives Without Cookies</a></li>
        <li><a href="/blog/cookieless-analytics-wordpress">Cookieless Analytics for WordPress</a></li>
        <li><a href="/blog/do-i-need-a-cookie-banner">Do You Need a Cookie Banner?</a></li>
        <li><a href="/blog/cookieless-analytics-gdpr">Cookieless Analytics and GDPR</a></li>
        <li><a href="/blog/track-website-visitors-without-cookies">How to Track Visitors Without Cookies</a></li>
        <li><a href="/blog/cookieless-analytics-ecommerce">Cookieless Analytics for Ecommerce</a></li>
        <li><a href="/blog/best-cookieless-analytics-tools-small-business">Best Cookieless Tools for Small Business</a></li>
        <li><a href="/blog/plausible-vs-matomo-vs-fathom">Plausible vs Matomo vs Fathom</a></li>
      </ul>`,
  },
  'what-is-cookieless-analytics': {
    title: 'What Is Cookieless Analytics? A Simple Explanation for Website Owners',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'A plain-English explanation of cookieless analytics: cookies vs first-party vs third-party, anonymous tracking, fingerprinting risks, and why businesses are moving away from traditional analytics.',
    body: `
      <p>Cookieless analytics measures your website traffic without storing a cookie on the visitor's device. Here is what that actually means, in plain English.</p>
      <h2>First, what is a cookie?</h2>
      <p>A cookie is a small file a site stores in your browser to remember you. <strong>First-party cookies</strong> are set by the site you are visiting; <strong>third-party cookies</strong> are set by other domains (usually ad networks) to track you across the web. Third-party cookies are the privacy problem — and browsers are removing them.</p>
      <h2>How cookieless analytics works instead</h2>
      <p>Rather than storing an identifier, cookieless tools count visits using anonymous, server-side signals. A common approach is a daily-rotating salted hash: the server derives a short value from request data that is unique enough to count a visitor for one day, then becomes meaningless. No cookie, no stored IP. See exactly how in <a href="/blog/how-the-salted-hash-works">how the salted hash works</a>.</p>
      <h2>Is that the same as fingerprinting?</h2>
      <p>No — and that distinction matters. Fingerprinting tries to <em>uniquely and persistently</em> identify a device (canvas, fonts, audio). Good cookieless analytics deliberately avoids that: the identifier is ephemeral and cannot follow you. Privacy-first tools do not fingerprint.</p>
      <h2>Why businesses are switching</h2>
      <ul class="prose-list">
        <li>No consent banner needed in most cases (no cookies, no personal data).</li>
        <li>Faster pages — scripts are a fraction of GA's size.</li>
        <li>Simple, readable reports instead of a configuration maze.</li>
        <li>You own the data; many tools are open source and self-hostable.</li>
      </ul>
      <p>For the full picture, start with the <a href="/blog/cookieless-analytics-guide">complete guide to cookieless analytics</a>, or compare it directly to <a href="/blog/cookieless-analytics-vs-ga4">GA4</a>.</p>`,
  },
  'cookieless-analytics-vs-ga4': {
    title: 'Cookieless Analytics vs GA4: Which Is Better for Your Website?',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'A clear comparison of cookieless analytics and Google Analytics 4 — privacy, consent banners, complexity, accuracy, and which fits your website.',
    body: `
      <p>Google Analytics 4 is powerful and free, but it is also complex, cookie-based, and owned by Google. Cookieless analytics is simpler and privacy-first. Here is how to choose.</p>
      <h2>Side by side</h2>
      <div class="compare-table"><table>
        <thead><tr><th>Feature</th><th>Cookieless analytics</th><th>GA4</th></tr></thead>
        <tbody>
          <tr><td>Cookies & consent banner</td><td class="yes">None needed (usually)</td><td>Cookies; banner required</td></tr>
          <tr><td>Tracking model</td><td class="yes">Anonymous pageviews/events</td><td>Event-based, identity-linked</td></tr>
          <tr><td>Script size</td><td class="yes">&lt; 2 KB</td><td>~45 KB+</td></tr>
          <tr><td>Ease of use</td><td class="yes">One screen</td><td>Explorations, steep curve</td></tr>
          <tr><td>Data sampling</td><td class="yes">No</td><td>Sampled at scale</td></tr>
          <tr><td>Ad attribution</td><td>Basic (UTM, referrers)</td><td class="yes">Advanced</td></tr>
          <tr><td>Data ownership</td><td class="yes">Yours</td><td>Google</td></tr>
        </tbody>
      </table></div>
      <h2>Choose GA4 if…</h2>
      <p>You run paid advertising that needs deep, multi-touch attribution, or you need tight integration with Google Ads and BigQuery. GA4's complexity buys real power there.</p>
      <h2>Choose cookieless if…</h2>
      <p>You want fast pages, simple numbers, no consent banner, and to respect your visitors — which describes most blogs, SaaS, docs sites, portfolios, and small e-commerce. Migrating is easy: see <a href="/migrate-from-ga4">migrate from GA4</a>.</p>
      <p>More: the <a href="/blog/cookieless-analytics-guide">complete guide</a> and <a href="/blog/google-analytics-alternatives-without-cookies">GA alternatives without cookies</a>.</p>`,
  },
  'google-analytics-alternatives-without-cookies': {
    title: 'Best Google Analytics Alternatives Without Cookies (2026)',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'The best cookieless Google Analytics alternatives in 2026, with a comparison table and picks for WordPress, SaaS, agencies, self-hosting, and GDPR.',
    body: `
      <p>If you want to leave Google Analytics behind without cookies or a consent banner, here are the leading privacy-first alternatives and who each is best for.</p>
      <div class="compare-table"><table>
        <thead><tr><th>Tool</th><th>Model</th><th>Best for</th></tr></thead>
        <tbody>
          <tr><td class="yes">Xolqy</td><td>Open source (AGPL) + SaaS, on Cloudflare</td><td>Cookieless on the edge, scroll/engagement, many sites</td></tr>
          <tr><td>Plausible</td><td>Open source + SaaS</td><td>Simple, popular privacy-first analytics</td></tr>
          <tr><td>Fathom</td><td>SaaS</td><td>Hands-off, hosted simplicity</td></tr>
          <tr><td>Matomo</td><td>Open source + SaaS</td><td>GA-style depth, self-hosted</td></tr>
          <tr><td>Simple Analytics</td><td>SaaS</td><td>Minimalist, EU-hosted</td></tr>
          <tr><td>Umami</td><td>Open source</td><td>Lightweight self-hosting</td></tr>
          <tr><td>Swetrix</td><td>Open source + SaaS</td><td>Developer-friendly, marketing features</td></tr>
        </tbody>
      </table></div>
      <h2>Best for WordPress</h2>
      <p>A one-line script works on any WordPress theme — see <a href="/blog/cookieless-analytics-wordpress">cookieless analytics for WordPress</a>.</p>
      <h2>Best for SaaS &amp; agencies</h2>
      <p>Look for multi-site management and a single admin view across properties. Xolqy includes a super-admin across every domain plus an "all sites combined" view.</p>
      <h2>Best self-hosted &amp; GDPR-focused</h2>
      <p>Open-source tools you can run yourself keep data entirely in your control. Xolqy runs on the Cloudflare free tier; Matomo and Umami self-host on your own server. All avoid cookies when configured for privacy.</p>
      <p>Not sure cookieless is right? Read the <a href="/blog/cookieless-analytics-guide">complete guide</a> or <a href="/blog/cookieless-analytics-vs-ga4">vs GA4</a>.</p>`,
  },
  'best-cookieless-analytics-tools-small-business': {
    title: 'Best Cookieless Analytics Tools for Small Business Websites in 2026',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'The best cookieless analytics tools for small business websites in 2026 — privacy-friendly, lightweight, affordable, and easy to read.',
    body: `
      <p>Small business sites do not need a 200-report platform. They need to know how many people came, where from, and what they read — privately and without slowing the site. These cookieless tools fit the bill.</p>
      <h2>What to look for</h2>
      <ul class="prose-list">
        <li><strong>No cookie banner</strong> — saves you a compliance headache.</li>
        <li><strong>Lightweight</strong> — a small script that will not hurt page speed or SEO.</li>
        <li><strong>Simple dashboard</strong> — answers you can read in seconds.</li>
        <li><strong>Affordable / free tier</strong> — and ideally self-hostable.</li>
      </ul>
      <h2>Top picks</h2>
      <p>Strong options include <strong>Xolqy</strong> (cookieless, &lt; 2 KB, free up to 10k pageviews/mo, self-hostable on Cloudflare), <strong>Plausible</strong>, <strong>Fathom</strong>, <strong>Simple Analytics</strong>, <strong>Umami</strong>, and <strong>WP Statistics</strong> for WordPress. See the full <a href="/blog/google-analytics-alternatives-without-cookies">comparison of GA alternatives without cookies</a>.</p>
      <h2>For WordPress sites</h2>
      <p>If you run WordPress, see <a href="/blog/cookieless-analytics-wordpress">cookieless analytics for WordPress</a> for plugins and a one-line setup.</p>
      <p>New to the topic? Start with <a href="/blog/what-is-cookieless-analytics">what is cookieless analytics</a>.</p>`,
  },
  'do-i-need-a-cookie-banner': {
    title: 'Do You Need a Cookie Banner for Cookieless Analytics?',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'Do you need a cookie consent banner if you use cookieless analytics? The honest answer: usually not — but it depends on the tool, setup, and jurisdiction.',
    body: `
      <p>One of the biggest reasons people switch to cookieless analytics is to drop the consent banner. Can you? In most cases yes — but the honest answer is "it depends." Here is what determines it.</p>
      <p class="legal-note">This is general information, not legal advice. Confirm your obligations with a qualified professional for your jurisdiction.</p>
      <h2>Why cookie banners exist</h2>
      <p>Laws like the EU's ePrivacy Directive require consent to store or read information on a user's device — i.e. cookies — except for strictly necessary ones. Analytics cookies are not "strictly necessary," so cookie-based analytics triggers the banner.</p>
      <h2>When you likely do NOT need a banner</h2>
      <ul class="prose-list">
        <li>The tool sets <strong>no cookies</strong> and writes nothing to the device.</li>
        <li>It stores <strong>no personal data</strong> — no IP addresses, no persistent identifiers.</li>
        <li>It does not fingerprint or track across sites.</li>
      </ul>
      <p>Xolqy meets all three, which is why most Xolqy sites run with no analytics banner.</p>
      <h2>When you still might</h2>
      <p>If you also use cookie-based ads/marketing tools, or your tool stores IP addresses, or your jurisdiction is stricter, you may still need consent for those. The banner requirement is about cookies and personal data in general — not just analytics.</p>
      <p>Related: <a href="/blog/cookieless-analytics-gdpr">cookieless analytics and GDPR</a> and the <a href="/blog/cookieless-analytics-guide">complete guide</a>.</p>`,
  },
  'cookieless-analytics-gdpr': {
    title: 'Cookieless Analytics and GDPR: What Website Owners Should Know',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'How cookieless analytics relates to GDPR — personal data, IP addresses, consent vs legitimate interest, anonymization, EU hosting, and DPAs.',
    body: `
      <p>GDPR is the main reason European sites rethink analytics. Cookieless, privacy-first analytics makes compliance far simpler — here is why, and what to still check.</p>
      <p class="legal-note">General information, not legal advice. Confirm specifics with a qualified professional.</p>
      <h2>The core issue: personal data</h2>
      <p>GDPR governs <strong>personal data</strong>. An IP address is considered personal data. Traditional analytics store IPs and set cookies, which brings you squarely under GDPR and usually requires consent.</p>
      <h2>How cookieless analytics reduces the burden</h2>
      <ul class="prose-list">
        <li><strong>No IP stored</strong> — Xolqy hashes request data with a secret, daily-rotating salt and keeps only an anonymous fragment.</li>
        <li><strong>No cookies / no identifiers</strong> — nothing persistent on the device.</li>
        <li><strong>Aggregate by design</strong> — you see counts, not people.</li>
      </ul>
      <h2>Lawful basis: consent vs legitimate interest</h2>
      <p>Because no personal data is stored, aggregate measurement can typically rely on the site operator's <strong>legitimate interest</strong> rather than consent. (Cookie-based analytics generally needs consent.)</p>
      <h2>Other things that help</h2>
      <p>EU/edge hosting, a published privacy and data policy, a signable <a href="/dpa">DPA</a>, and a clear list of sub-processors. Xolqy publishes all of these. See also <a href="/blog/do-i-need-a-cookie-banner">do you need a cookie banner?</a></p>`,
  },
  'track-website-visitors-without-cookies': {
    title: 'How to Track Website Visitors Without Cookies',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'A practical guide to tracking website visitors without cookies — pageviews, referrers, UTM parameters, goals, anonymized sessions, and the limits.',
    body: `
      <p>You can learn almost everything useful about your traffic without a single cookie. Here is how cookieless tracking works in practice, and where its limits are.</p>
      <h2>What you can track without cookies</h2>
      <ul class="prose-list">
        <li><strong>Pageviews &amp; unique visitors</strong> — via anonymous, daily-rotating identifiers.</li>
        <li><strong>Traffic sources &amp; referrers</strong> — where people came from.</li>
        <li><strong>UTM campaigns</strong> — read straight from the URL, no cookie needed.</li>
        <li><strong>Engagement</strong> — time on page and scroll depth.</li>
        <li><strong>Goals / conversions</strong> — fire an event on key actions (signup, purchase).</li>
      </ul>
      <h2>How it is done</h2>
      <p>A tiny first-party script sends an anonymous pageview to your analytics endpoint. The server counts uniques with an anonymous hash (no cookie, no stored IP). Campaigns come from UTM parameters; conversions are simple events. For deeper server-side conversion tracking, your backend can post events directly to the analytics API.</p>
      <h2>The limits (and why they are fine)</h2>
      <p>Without cookies you cannot recognise the same person across days or run person-level retargeting. For most sites that is an acceptable — even desirable — trade for privacy, speed, and no consent banner.</p>
      <p>See the <a href="/blog/cookieless-analytics-guide">complete guide</a>, and for shops, <a href="/blog/cookieless-analytics-ecommerce">cookieless analytics for ecommerce</a>.</p>`,
  },
  'plausible-vs-matomo-vs-fathom': {
    title: 'Plausible vs Matomo vs Fathom: Best Privacy-Friendly Analytics Tool?',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'Plausible vs Matomo vs Fathom compared — hosting, simplicity, data ownership, GDPR, cookie-banner needs — plus where Xolqy fits.',
    body: `
      <p>Plausible, Matomo and Fathom are three of the best-known privacy-friendly analytics tools. Here is how they differ, and where Xolqy fits.</p>
      <div class="compare-table"><table>
        <thead><tr><th>Aspect</th><th>Plausible</th><th>Matomo</th><th>Fathom</th></tr></thead>
        <tbody>
          <tr><td>Open source</td><td>Yes</td><td>Yes</td><td>No</td></tr>
          <tr><td>Self-host</td><td>Yes (Elixir/PG)</td><td>Yes (PHP/MySQL)</td><td>No (hosted)</td></tr>
          <tr><td>Complexity</td><td>Simple</td><td>Feature-rich</td><td>Simple</td></tr>
          <tr><td>Cookies / banner</td><td>Cookieless</td><td>Optional</td><td>Cookieless</td></tr>
          <tr><td>Data ownership</td><td>Yes (self-host)</td><td>Yes (self-host)</td><td>Hosted</td></tr>
        </tbody>
      </table></div>
      <h2>Quick take</h2>
      <ul class="prose-list">
        <li><strong>Plausible</strong> — clean, simple, open source; great default privacy-first pick.</li>
        <li><strong>Matomo</strong> — closest to GA's depth; heavier to self-host (PHP + MySQL).</li>
        <li><strong>Fathom</strong> — polished hosted simplicity; not open source.</li>
      </ul>
      <h2>Where Xolqy fits</h2>
      <p>Xolqy shares the cookieless, simple-metrics philosophy, but runs serverless on Cloudflare Workers + D1 (so self-hosting is free on the edge), adds scroll-depth and engagement, and a super-admin view across every site. Compare directly: <a href="/vs-plausible">vs Plausible</a>, <a href="/vs-matomo">vs Matomo</a>.</p>
      <p>See also the <a href="/blog/google-analytics-alternatives-without-cookies">full list of GA alternatives without cookies</a>.</p>`,
  },
  'cookieless-analytics-ecommerce': {
    title: 'Cookieless Analytics for Ecommerce: Can You Track Sales Without Cookies?',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'Can you track ecommerce sales without cookies? What cookieless analytics can measure — product views, add-to-cart, checkout, UTM, server-side conversions — and its limits.',
    body: `
      <p>Ecommerce owners ask: can I track sales without cookies? Mostly yes — especially with server-side conversion tracking — though cross-session ad attribution has limits. Here is the practical picture.</p>
      <h2>What you can track</h2>
      <ul class="prose-list">
        <li><strong>Product views</strong> and top products.</li>
        <li><strong>Add-to-cart</strong> and <strong>checkout</strong> as events.</li>
        <li><strong>Conversions / orders</strong> — fired client-side or, more reliably, <strong>server-side</strong> from your order webhook.</li>
        <li><strong>Campaign performance</strong> via UTM parameters.</li>
      </ul>
      <h2>Server-side is your friend</h2>
      <p>Because the order confirmation happens on your server, you can post the conversion event directly to your analytics API — no cookie, accurate, and resistant to ad-blockers. This is the most reliable way to count sales privately.</p>
      <h2>The honest limits</h2>
      <p>Without cookies you cannot stitch a purchase to an ad click from days earlier across devices. For last-click/UTM attribution and overall funnel health, cookieless is plenty; for multi-touch ad attribution, you may still pair it with your ad platform's own reporting.</p>
      <p>More: <a href="/blog/track-website-visitors-without-cookies">how to track visitors without cookies</a> and the <a href="/blog/cookieless-analytics-guide">complete guide</a>.</p>`,
  },
  'how-the-salted-hash-works': {
    title: 'How the salted hash counts visitors without tracking them',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'The exact technique Xolqy uses to count daily unique visitors with no cookies and no stored IP address — a daily-rotating salted hash, explained in full.',
    body: `
      <p>Counting unique visitors normally means storing an identifier — a cookie, or an IP address. Xolqy stores neither. Here is exactly how it counts daily uniques anyway, with no hand-waving, so you can verify the privacy claim for yourself.</p>
      <h2>The construction</h2>
      <p>For every incoming pageview, the server computes a one-way hash of four ingredients and keeps only a short fragment of it:</p>
      <pre class="install"><code>visitor = SHA-256( ip + "|" + user_agent + "|" + secret_salt + "|" + "YYYYMMDD" )
          → keep the first 12 hexadecimal characters</code></pre>
      <p>That 12-character value is the only visitor identifier stored. The raw IP and user-agent are used for the calculation and then discarded — never written to the database.</p>
      <h2>Why each ingredient matters</h2>
      <ul class="prose-list">
        <li><strong>IP + user-agent</strong> distinguish one visitor from another within a single day.</li>
        <li><strong>A secret salt</strong> (a long random string only the server knows) means nobody can pre-compute the hash for a given IP. Without the salt, the whole scheme would be reversible by brute force, because the space of IPs is small. The salt is what makes it safe — and it is never published.</li>
        <li><strong>The date (YYYYMMDD)</strong> changes the output every midnight UTC. The same person tomorrow produces a completely different, unrelated hash.</li>
      </ul>
      <h2>Why it is not personal data</h2>
      <p>A cryptographic hash is one-way: you cannot run it backwards to recover the inputs. Because the salt is secret <em>and</em> rotates daily, even we cannot take yesterday's hash and link it to today's, or back to a specific person — we would need the original IP, which we never stored. The identifier is useful for one day and then becomes meaningless noise.</p>
      <p>This is the same well-established technique used by other privacy-first analytics tools. It is enough to answer "how many different people visited today?" without ever holding data that identifies any of them.</p>
      <h2>What it can and cannot do</h2>
      <ul class="prose-list">
        <li><strong>Can:</strong> count daily unique visitors, per page and per site, accurately.</li>
        <li><strong>Cannot (by design):</strong> follow a person across days, build a profile, or recognise a returning visitor next week. That is a feature, not a limitation — it is precisely why no consent banner is needed.</li>
      </ul>
      <h2>A note on range totals</h2>
      <p>Because the hash rotates daily, a person who visits on three days counts as three day-uniques. That sounds odd until you realise it makes range totals additive: the unique count over a week equals the sum of the daily unique counts. It is also why Xolqy's <a href="/blog/analytics-on-the-edge">daily rollups</a> stay fast and correct.</p>
      <p>Want the higher-level version? See <a href="/cookieless">cookieless, explained</a>, or read the open-source implementation on <a href="https://github.com/xolqy-com/xolqy" target="_blank" rel="noopener">GitHub</a>.</p>`,
  },
  'cookieless-analytics-cloudflare-workers': {
    title: 'Cookieless analytics on Cloudflare Workers',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'How to run accurate, cookieless web analytics entirely on Cloudflare Workers + D1 — no origin server, no cookies, no consent banner.',
    body: `
      <p>If you want web analytics that run on Cloudflare's edge, store no cookies, and need no server to maintain, here is exactly how Xolqy does it — and how you can self-host the same stack.</p>
      <h2>Why Cloudflare Workers + D1 for analytics</h2>
      <p>Analytics is append-heavy writes plus simple aggregate reads — a great fit for the edge. A Worker terminates the tracking beacon at the nearest Cloudflare location (low latency worldwide), and <strong>D1</strong> (SQLite at the edge) stores the events. There is no origin server to provision, patch, or scale; it scales to zero when idle. The free tier — 100k requests/day on Workers and 5 GB / 5M reads per day on D1 — covers most sites outright.</p>
      <h2>How the cookieless part works</h2>
      <p>No cookie is ever set. To count a unique visitor for a day, the Worker computes <code>hash(IP + user-agent + daily_salt)</code> and keeps only a short fragment. The salt rotates at midnight UTC, so the same person is unrecognizable the next day. The raw IP is never stored. That is enough for accurate daily uniques while staying out of personal-data and cookie-consent territory.</p>
      <h2>The whole stack, end to end</h2>
      <ul class="prose-list">
        <li><strong>Tracker</strong>: a &lt; 2 KB script served from the edge at <code>/t.js</code>, loaded with <code>defer</code>.</li>
        <li><strong>Collector</strong>: a Worker route that validates the beacon and writes to D1.</li>
        <li><strong>Dashboard + API</strong>: the same Worker renders the dashboard and serves stats, gated by session auth.</li>
        <li><strong>Rollups</strong>: a Cron Trigger aggregates each completed day into a small table so dashboards stay fast across hundreds of domains.</li>
      </ul>
      <h2>Self-host it yourself</h2>
      <p>Xolqy is open source. Deploy to your own Cloudflare account with <code>wrangler deploy</code>, point your domain at the Worker, and your visitors' data never leaves your account. See the <a href="/docs">docs</a> to get started, or read more on <a href="/cookieless">how cookieless tracking works</a>.</p>`,
  },
  'self-hosted-analytics-scroll-depth-engagement': {
    title: 'Self-hosted analytics with scroll depth and engagement',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'Most privacy-first analytics tools only count pageviews. Xolqy is self-hostable and measures scroll depth and real engagement time — without cookies.',
    body: `
      <p>Pageviews tell you someone arrived. They do not tell you whether anyone <em>read</em> the page. Most privacy-friendly, self-hostable analytics stop at the pageview. Xolqy measures scroll depth and engaged time too — and still sets no cookies.</p>
      <h2>What "engagement" means here</h2>
      <p>Two metrics, measured honestly:</p>
      <ul class="prose-list">
        <li><strong>Scroll depth</strong>: the furthest point a visitor reached on the page, as a percentage. Great for spotting articles people abandon halfway.</li>
        <li><strong>Time on page</strong>: counted <em>only while the browser tab is actually visible</em>. Background a tab and the clock pauses; foreground it and it resumes. No inflated "time on page" from abandoned tabs.</li>
      </ul>
      <h2>How it is measured without being creepy</h2>
      <p>The &lt; 2 KB script sends a pageview on load, then a lightweight ping every 15 seconds while the tab is visible, carrying the running engaged time and max scroll. A final beacon fires on unload via <code>sendBeacon</code>, so it never delays navigation. No cookies, no personal data — just aggregate engagement.</p>
      <h2>Self-hosted, so the data is yours</h2>
      <p>Run Xolqy on your own Cloudflare account (Workers + D1). Engagement data lives in your database, not a vendor's. You get "top pages by engagement" out of the box, alongside the usual sources, countries and devices. Compare it to <a href="/vs-plausible">other privacy-first tools</a> or read the <a href="/docs">docs</a>.</p>`,
  },
  'analytics-super-admin-many-sites': {
    title: 'Free analytics with a super-admin view across hundreds of sites',
    date: 'June 2, 2026',
    iso: '2026-06-02',
    excerpt: 'Running 100+ domains? Xolqy gives each account its own sites and a single super-admin that sees every domain — plus an all-sites combined view.',
    body: `
      <p>If you operate dozens or hundreds of sites — an agency, a publisher network, a portfolio, or a SaaS with many properties — most analytics tools force you to either juggle separate logins or pay per-property. Xolqy is built multi-tenant, with a super-admin that sees everything.</p>
      <h2>The model</h2>
      <ul class="prose-list">
        <li><strong>Per-account isolation</strong>: each registered user claims the domains they own and sees only their own data.</li>
        <li><strong>One super-admin</strong>: a designated account sees <em>every</em> tracked domain on the platform — including ones that just have the script installed but were never explicitly claimed.</li>
        <li><strong>"All sites (combined)"</strong>: a single aggregate view that rolls pageviews, visitors and engagement across every domain at once.</li>
      </ul>
      <h2>Why it stays fast at 100+ domains</h2>
      <p>A combined view would normally scan the whole events table on every load. Instead, a nightly Cron job aggregates each completed day into a per-site, per-day rollup table. The dashboard reads pre-aggregated totals for past days and queries raw events only for today — so history is cheap and today stays real-time.</p>
      <h2>Free to start, cookieless throughout</h2>
      <p>Add as many domains as your plan allows, drop the &lt; 2 KB cookieless script on each, and they roll up under your admin view automatically. Start on the <a href="/pricing">free plan</a>, or self-host the whole thing on your own Cloudflare account. See the <a href="/docs">docs</a> to set up the super-admin.</p>`,
  },
  'why-we-built-xolqy': {
    title: 'Why we built Xolqy',
    date: 'May 28, 2026',
    iso: '2026-05-28',
    excerpt: 'The web did not need another 75 KB tracker that demands a consent banner. It needed simple numbers, fast pages, and zero personal data.',
    body: `
      <p>Every site owner wants the same three things from analytics: how many people came, where they came from, and what they read. Somewhere along the way, the tools that answer those questions turned into sprawling marketing-data platforms — heavy scripts, cookie banners, and dashboards you need a certification to navigate.</p>
      <h2>The status quo is expensive in ways you do not see</h2>
      <p>A typical analytics script is 45–75 KB and blocks part of your page load. It sets cookies, which legally obligates you to interrupt every visitor with a consent banner. And the data it gathers does not even belong to you — it belongs to the vendor.</p>
      <p>You pay for all of this with slower pages, lower conversion, annoyed visitors, and a privacy liability you did not ask for.</p>
      <h2>What we wanted instead</h2>
      <p>We wanted a tracker under 2 KB that loads async and never blocks. We wanted to count visitors without cookies, so there is nothing to consent to. We wanted the numbers that matter on one screen. And we wanted you to be able to host the whole thing yourself if you choose to.</p>
      <p>So we built Xolqy on Cloudflare Workers and D1. It is cookieless by design, open source, and free up to 10k pageviews a month. The script is tiny, the dashboard is one screen, and the data is yours.</p>
      <h2>Privacy is the default, not a tier</h2>
      <p>We never store IP addresses, set cookies, or build profiles. Visitors are counted with a salted hash that rotates every midnight, which is enough to count daily uniques without being personal data. That is not an enterprise add-on — it is how the product works for everyone.</p>`,
  },
  'cookieless-explained': {
    title: 'Cookieless analytics, explained',
    date: 'May 30, 2026',
    iso: '2026-05-30',
    excerpt: 'How a daily-rotating salted hash counts your visitors accurately without storing anything personal — and why that means no consent banner.',
    body: `
      <p>“Cookieless” gets thrown around a lot. Here is exactly what it means in Xolqy, with no hand-waving.</p>
      <h2>The problem cookies solve (and create)</h2>
      <p>Traditional analytics drop a cookie so they can recognize the same browser across pages and days. That recognition is what triggers consent law: you are storing an identifier on someone's device. Hence the banner.</p>
      <h2>Counting without an identifier</h2>
      <p>Instead of storing anything on the visitor's device, Xolqy derives a short value on the server: <code>hash(IP + user-agent + daily_salt)</code>, keeping only a fragment. The salt rotates at midnight UTC, so the same person produces a completely different value tomorrow.</p>
      <p>That is enough to count unique visitors <em>within a day</em> — which is the number you actually care about — while being useless for tracking anyone over time. We never see or store the raw IP.</p>
      <h2>Why the daily rotation matters for your reports</h2>
      <p>Because the identifier changes daily, a person who visits on three days counts as three day-uniques. That sounds odd until you realize it makes range totals additive: summing daily uniques equals the distinct count over the range. It is also why our rollup tables stay fast and correct at scale.</p>
      <h2>The upshot</h2>
      <p>No cookie, no device storage, no personal data — so in most jurisdictions, no consent banner for analytics. You get accurate daily numbers and your visitors get left alone.</p>`,
  },
  'analytics-on-the-edge': {
    title: 'Running web analytics on the edge',
    date: 'June 1, 2026',
    iso: '2026-06-01',
    excerpt: 'What Cloudflare Workers + D1 buys you when you build analytics — and the one trick that keeps dashboards fast across hundreds of domains.',
    body: `
      <p>Xolqy runs entirely on Cloudflare's edge: the tracking endpoint, the dashboard, the API, and the database. Here is why that combination is a good fit for analytics, and how we keep it fast.</p>
      <h2>Collection at the edge</h2>
      <p>The tracking beacon hits the nearest Cloudflare location, not a distant origin. That means low latency for your visitors anywhere in the world, and it scales to zero when no one is around — you are not paying for idle servers.</p>
      <h2>D1 as the store</h2>
      <p>D1 is SQLite at the edge. For append-heavy analytics with simple aggregate queries, it is a great match: cheap writes, indexed reads, and a generous free tier (5 GB, 5M reads/day).</p>
      <h2>The scaling trick: daily rollups</h2>
      <p>Querying raw events across hundreds of domains on every dashboard load would be wasteful. So a nightly job aggregates each completed day into a small <code>daily_rollups</code> table — one row per site per day. The dashboard reads pre-aggregated totals for past days and queries raw events only for <em>today</em>.</p>
      <p>The result: history is cheap to read and today stays real-time. Averages are stored as sum + count so they recombine correctly across any range, and because the visitor hash rotates daily, summing per-day uniques gives the right range total.</p>
      <h2>What it means for you</h2>
      <p>Fast dashboards, a free tier that covers most sites, and the option to self-host the exact same stack in your own account.</p>`,
  },
};

function postCard(slug: string): string {
  const p = POSTS[slug];
  return `<a class="post-card" href="/blog/${slug}">
    <span class="post-date">${p.date}</span>
    <span class="post-title">${p.title}</span>
    <span class="post-excerpt">${p.excerpt}</span>
    <span class="post-more">Read post →</span>
  </a>`;
}

function blogIndexBody(): string {
  return pageBody(`
    ${hero('Blog', 'Notes on privacy-first analytics, web performance, and building Xolqy in the open.')}
    <div class="post-list">${Object.keys(POSTS).map(postCard).join('')}</div>
  `);
}

// ----------------------------------------------------------------------------
// The registry. Key = path without leading slash.
export const PAGES: Record<string, Page> = {
  pricing: { title: 'Pricing', description: 'Simple usage-based pricing. Free up to 10k pageviews/mo, paid tiers from $9.', body: pricingBody() },

  // --- Why Xolqy? -----------------------------------------------------------
  'simple-metrics': feature(
    'Simple metrics', 'The numbers that matter, on one screen — no setup, no funnels to configure.',
    'Analytics you can read in ten seconds. No 200-report maze, no training required.',
    [
      ['One screen, everything you need', ['Pageviews, unique visitors, time on page, scroll depth, top pages, referrers, countries and devices — all on a single dashboard.', 'Pick a date range and the whole page updates. That is the product.']],
      ['Metrics defined the obvious way', ['A pageview is a page load. A visitor is a person that day. Time on page counts only while the tab is actually visible. No dark patterns, no inflated numbers.']],
    ],
    ['No tag manager required', 'No goals or funnels to configure to see basic traffic', 'Readable on mobile']),

  'lightweight-script': feature(
    'Lightweight script', 'Under 2 KB, loads async, and never blocks your page.',
    'Most analytics scripts are 45–75 KB. Ours is under 2 KB. Your Core Web Vitals will thank you.',
    [
      ['Tiny by design', ['The tracker has zero dependencies and ships as a single &lt; 2 KB file served from the edge. It loads with <code>defer</code>, so it never blocks rendering.']],
      ['Respectful of your visitors', ['It measures time-on-page only while the tab is visible, batches pings, and uses <code>sendBeacon</code> on unload so it never delays navigation.']],
    ]),

  'privacy-focused': feature(
    'Privacy focused', 'No cookies, no fingerprinting, no personal data stored.',
    'Privacy is the default, not a setting. We never store IP addresses or build profiles of your visitors.',
    [
      ['What we do not collect', ['No cookies. No IP storage. No cross-site tracking. No advertising identifiers. No persistent visitor IDs.']],
      ['How we count visitors', ['We hash IP + user-agent with a salt that rotates every midnight UTC, then keep only a short fragment. The same person looks different tomorrow, which is enough to count daily uniques without it being personal data.']],
    ],
    ['No consent banner required in most jurisdictions', 'No third-party data sharing', 'Self-host to keep data entirely in your own account']),

  cookieless: feature(
    'Cookieless analytics', 'Count visitors accurately without ever setting a cookie.',
    'Cookies are why you need consent banners. We do not use them — so you usually do not need one.',
    [
      ['How it works', ['Instead of a cookie, we derive a daily-rotating salted hash from request metadata. It identifies a visit for a single day and then becomes meaningless.']],
      ['Why it matters', ['No cookie means no <code>localStorage</code> persistence, no consent prompt in most cases, and nothing for ad-blockers to flag as tracking.']],
    ]),

  'no-cookie-banner': feature(
    'No cookie banner', 'Stop annoying your visitors with consent pop-ups.',
    'Because Xolqy stores no cookies and no personal data, most sites do not need a consent banner for analytics at all.',
    [
      ['The banner tax', ['Consent banners hurt conversion, slow your site, and frustrate visitors. They exist because traditional analytics rely on cookies and personal data.']],
      ['Skip it', ['Remove the analytics reason for your banner entirely. Always confirm your specific obligations with counsel, but most Xolqy users run with no banner.']],
    ]),

  'open-source': feature(
    'Open source', 'The whole thing is open. Read it, host it, fork it.',
    'No black box. The tracker, the collector, and the dashboard are all open source and runnable on the Cloudflare free tier.',
    [
      ['Self-host for free', ['Deploy to your own Cloudflare account with Workers + D1. The free tier covers 100k requests/day. Your data never touches our servers.']],
      ['Or let us run it', ['Prefer not to operate it? Our managed hosting is the same code, maintained and scaled for you. Paying customers fund the project.']],
    ],
    ['MIT-style license', 'Public roadmap and changelog', 'Contributions welcome on GitHub']),

  'web-analytics': feature(
    'Web analytics, done simply', 'Everything Xolqy tracks and why it is enough.',
    'A complete picture of your traffic without the complexity — and without selling out your visitors.',
    [
      ['What you get', ['Pageviews and unique visitors, top pages, traffic sources and referrers, countries, devices and browsers, time on page, scroll depth, and outbound link clicks.']],
      ['Built for the modern web', ['Single-page-app navigation is tracked automatically. Time-on-page is measured only when the tab is visible. Outbound clicks are captured without slowing the click.']],
    ]),

  // --- Explore --------------------------------------------------------------
  'vs-google-analytics': compare(
    'Google Analytics', 'Xolqy vs Google Analytics 4: simpler, cookieless, no consent banner, and you own the data.',
    'GA4 is powerful and complicated. Xolqy gives you the numbers that matter in seconds, without cookies or a consent banner.',
    [
      ['Simplicity', ['GA4 buries traffic behind explorations and events you must configure. Xolqy shows pageviews, visitors and engagement on one screen out of the box.']],
      ['Privacy &amp; consent', ['GA4 uses cookies and shares data with Google, so it needs a consent banner. Xolqy is cookieless and stores no personal data — usually no banner needed.']],
      ['Performance', ['The GA script is ~45 KB+. Xolqy is under 2 KB.']],
      ['Ownership', ['With GA, Google holds your data. With Xolqy you can self-host and keep it entirely in your own account.']],
    ],
    [
      ['Script size', '< 2 KB', '~45–75 KB'],
      ['Cookies', 'None', 'Yes'],
      ['Consent banner', 'Usually not needed', 'Required'],
      ['Stores IP / personal data', 'No', 'Yes (processed)'],
      ['Time to read a report', 'Seconds', 'Steep learning curve'],
      ['Data ownership', 'Yours (self-host option)', 'Google'],
      ['Scroll depth & engagement', 'Built in', 'Manual setup'],
      ['Price', 'Free up to 10k/mo', 'Free (you are the product)'],
    ],
    VS_GA_FAQ),

  'vs-plausible': compare(
    'Plausible', 'Xolqy vs Plausible: the same privacy-first philosophy, on Cloudflare\'s edge with built-in scroll &amp; engagement.',
    'We love what Plausible started. Xolqy shares the cookieless, simple-metrics philosophy — and adds scroll depth, engagement, and a true multi-site super-admin view, running on Cloudflare.',
    [
      ['What is the same', ['Cookieless, lightweight, privacy-first, no consent banner, simple one-screen dashboard.']],
      ['What is different', ['Xolqy runs on Cloudflare Workers + D1 (so the free self-host tier is generous), and adds scroll-depth and engagement metrics plus a super-admin view across every domain.']],
    ],
    [
      ['Cookieless', 'Yes', 'Yes'],
      ['Script size', '< 2 KB', '~1 KB'],
      ['Scroll depth & engagement', 'Built in', 'Limited'],
      ['Super-admin across all sites', 'Yes', 'No'],
      ['Self-host stack', 'Cloudflare Workers + D1', 'Elixir + PostgreSQL/ClickHouse'],
      ['Self-host free tier', 'Cloudflare free tier', 'Bring your own server'],
      ['Open source', 'Yes', 'Yes'],
    ],
    VS_PLAUSIBLE_FAQ),

  'vs-matomo': compare(
    'Matomo', 'Xolqy vs Matomo: get privacy-friendly analytics without running a PHP/MySQL server.',
    'Matomo is feature-rich but heavy to self-host. Xolqy gives you the privacy benefits with a 2 KB script and a serverless backend you do not have to babysit.',
    [
      ['Operational weight', ['Matomo wants a PHP + MySQL server you maintain and scale. Xolqy runs on Cloudflare Workers + D1 — no servers, scales to zero, free tier covers most sites.']],
      ['Focus', ['Matomo aims to match GA feature-for-feature. Xolqy deliberately stays simple: the metrics that matter, fast.']],
    ],
    [
      ['Self-host stack', 'Cloudflare Workers + D1', 'PHP + MySQL server'],
      ['Servers to maintain', 'None (serverless)', 'Yes'],
      ['Script size', '< 2 KB', '~22 KB+'],
      ['Cookies', 'None', 'Optional'],
      ['Scales to zero', 'Yes', 'No'],
      ['Free hosting tier', 'Cloudflare free tier', 'Self-managed'],
    ],
    VS_MATOMO_FAQ),

  'migrate-from-ga4': feature(
    'Migrate from GA4', 'Move off Google Analytics in an afternoon.',
    'You do not need to export years of GA4 data to switch. Install Xolqy alongside GA, compare for a week, then drop GA.',
    [
      ['Step 1 — install', [`Add one line to your site: <code>${INSTALL}</code>`]],
      ['Step 2 — run side by side', ['Keep GA4 running for a week while Xolqy collects in parallel. Compare the numbers and get comfortable.']],
      ['Step 3 — remove GA &amp; the banner', ['Delete the GA tag. If analytics was the only reason for your consent banner, remove that too.']],
    ]),

  'is-xolqy-right-for-you': feature(
    'Is Xolqy right for you?', 'An honest look at who Xolqy is — and is not — for.',
    'We would rather you pick the right tool than churn. Here is the honest version.',
    [
      ['Xolqy is great if', ['You want simple, privacy-first traffic numbers; you care about page speed and consent; you run a blog, SaaS, docs site, store, or a portfolio of sites.']],
      ['Xolqy is not for you if', ['You need deep e-commerce funnels, individual-user session replay, or ad-attribution down to the keyword. Those need a heavier (and more invasive) tool.']],
    ]),

  wordpress: feature(
    'WordPress', 'Add Xolqy to WordPress in one step.',
    'No plugin required — just one snippet. Or drop it in with any header-scripts plugin.',
    [
      ['The one-liner', [`Paste <code>${INSTALL}</code> into your theme header, or into a “header/footer scripts” plugin, and you are done.`]],
      ['Works with caching', ['The script is static and async, so it plays nicely with page caches and CDNs.']],
    ]),

  'google-tag-manager': feature(
    'Google Tag Manager', 'Deploy Xolqy through GTM in two minutes.',
    'Prefer to manage tags in GTM? Add Xolqy as a Custom HTML tag firing on All Pages.',
    [
      ['Setup', ['Create a new Custom HTML tag, paste the Xolqy snippet, set the trigger to All Pages, and publish.']],
      ['Note on ad-blockers', ['Loading via GTM can be blocked by some extensions. Installing the snippet directly is the most reliable option.']],
    ]),

  script: feature(
    'The tracking script', 'Exactly what the &lt; 2 KB script does — nothing hidden.',
    'Transparency matters. Here is precisely what runs in your visitors\' browsers.',
    [
      ['What it sends', ['On load it sends a pageview with a random id, the path, and a session id. Every 15s while visible it sends a ping with time-on-page and max scroll. On unload it sends a final beacon.']],
      ['What it never does', ['It sets no cookies, reads no <code>localStorage</code> beyond a per-tab session id, and collects no personal data. Source is open — read it on GitHub.']],
      ['Pin it so it can never change', ['Load the versioned, immutable build at <code>/v1/t.js</code> with a Subresource Integrity hash and the browser will refuse to run it if a single byte differs. See the <a href="/docs">install docs</a> for the exact <code>integrity</code> snippet.']],
    ]),

  // --- Resources ------------------------------------------------------------
  docs: {
    title: 'Documentation', description: 'Install Xolqy, add your sites, and read your dashboard.',
    body: pageBody(`
      ${hero('Documentation', 'Everything you need to install Xolqy and start reading your traffic.')}
      ${section('1. Create an account', 'Register at the <a href="/login">login page</a> with email and password or Google. It is free up to 10k pageviews/month.')}
      ${section('2. Add your site', 'In the dashboard, click <b>Add site</b> and enter your domain (e.g. <code>example.com</code>). You can add every domain you own.')}
      ${section('3. Install the script', `Add this one line to every page you want to track, ideally in the &lt;head&gt;:`)}
      <pre class="install"><code>${INSTALL}</code></pre>
      ${section('Pin a version with Subresource Integrity (recommended for production)', 'For a contractual guarantee that the JavaScript running on your site can never silently change, load the immutable, versioned build with an <code>integrity</code> hash. The bytes at <code>/v1/t.js</code> are frozen forever; any breaking change ships as <code>/v2/t.js</code> with a new hash, so your pinned tag keeps working untouched.')}
      <pre class="install"><code>${PINNED_INSTALL}</code></pre>
      <p class="muted">Current <code>/v1/t.js</code> integrity: <code>${TRACKER_SRI}</code>. Astro users: add <code>is:inline</code> so the attributes are preserved.</p>
      ${section('Content-Security-Policy', 'If your site uses a CSP, allow the script source and its single endpoint — Xolqy talks to nothing else:')}
      <pre class="install"><code>script-src https://xolqy.com;
connect-src https://xolqy.com;</code></pre>
      <p class="muted">The script loads from <code>xolqy.com</code> and sends events to <code>xolqy.com/api/event</code> and <code>xolqy.com/api/click</code> only. It respects Do Not Track and Global Privacy Control.</p>
      ${section('4. Read your dashboard', 'Pick a date range and a site. KPIs and the traffic chart update instantly; tables show top pages, sources, countries and devices.')}
      ${section('Self-hosting', 'Xolqy is open source and runs on Cloudflare Workers + D1. See the README on <a href="https://github.com/xolqy-com/xolqy" target="_blank" rel="noopener">GitHub</a> for one-command deploy instructions.')}
      ${cta()}
    `),
  },

  blog: {
    title: 'Blog', description: 'Notes on privacy-first analytics, web performance, and building Xolqy in the open.',
    body: blogIndexBody(),
  },

  changelog: {
    title: "What's new", description: 'The Xolqy product changelog — every notable change, newest first.',
    body: pageBody(`
      ${hero("What's new", 'Every notable change to Xolqy, newest first.')}
      ${section('June 1, 2026 — SEO &amp; a real blog',
        'Per-page Open Graph and Twitter card images, a <code>sitemap.xml</code> and <code>robots.txt</code>, and the first three posts on the <a href="/blog">blog</a>.')}
      ${section('May 30, 2026 — Daily rollups for scale',
        'Headline KPIs and the traffic chart now read pre-aggregated daily totals from a nightly job, so dashboards stay fast across 100+ domains while today stays real-time.')}
      ${section('May 25, 2026 — Multi-tenant accounts + Google sign-in',
        'Register with email/password or Google, claim the domains you own, and see only your own data — plus a super-admin view across every site on the platform.')}
      ${section('May 18, 2026 — Scroll depth &amp; engagement',
        'Top pages now show how far visitors actually read and how long they stay, measured only while the tab is visible.')}
      ${section('May 10, 2026 — Public launch',
        'Cookieless tracking, the &lt; 2 KB script, and the one-screen dashboard went live.')}
    `),
  },

  status: {
    title: 'Status', description: 'Xolqy service status and uptime.',
    body: pageBody(`
      ${hero('Status', 'Current operational status of the Xolqy managed service.')}
      <div class="status-row"><span class="dot ok"></span> Tracking collector — <b>Operational</b></div>
      <div class="status-row"><span class="dot ok"></span> Dashboard &amp; API — <b>Operational</b></div>
      <div class="status-row"><span class="dot ok"></span> Edge script delivery — <b>Operational</b></div>
      ${section('Uptime', 'Xolqy runs on Cloudflare\'s global network. Incidents and maintenance windows are posted here.')}
    `),
  },

  'api-docs': {
    title: 'API', description: 'The Xolqy HTTP API for events and stats.',
    body: pageBody(`
      ${hero('API', 'Send events and read stats programmatically.')}
      ${section('Collect events', 'POST JSON to <code>/api/event</code> with <code>{ t, id, site, path, session }</code>. This is what the tracker script calls; you can call it from anywhere.')}
      ${section('Outbound clicks', 'POST to <code>/api/click</code> with <code>{ site, path, href }</code>.')}
      ${section('Read stats', 'Authenticated <code>GET /api/stats/{overview|top-pages|engagement|referrers|countries|devices|series}?site=…&amp;from=…&amp;to=…</code> returns JSON for the dashboard. Requires a logged-in session that owns the site.')}
      ${cta()}
    `),
  },

  // --- Company --------------------------------------------------------------
  about: feature(
    'About', 'Who we are and why Xolqy exists.',
    'Xolqy is privacy-first web analytics, built by people who were tired of choosing between useful numbers and respecting visitors.',
    [
      ['Our belief', ['Analytics should be simple to read, invisible to your visitors, and owned by you. Privacy is not a premium feature — it is the default.']],
      ['How we are funded', ['By our subscribers, not by advertising and not by selling data. The product you pay for is the product — there is no second business model behind your back.']],
    ]),

  contact: {
    title: 'Contact', description: 'Get in touch with the Xolqy team.',
    body: pageBody(`
      ${hero('Contact', 'Questions, sales, security, or support — we read everything.')}
      ${section('Email', 'General &amp; support: <a href="mailto:hello@xolqy.com">hello@xolqy.com</a><br/>Privacy &amp; data requests: <a href="mailto:privacy@xolqy.com">privacy@xolqy.com</a><br/>Security reports: <a href="mailto:security@xolqy.com">security@xolqy.com</a><br/>Sales &amp; Enterprise: <a href="mailto:sales@xolqy.com">sales@xolqy.com</a>')}
      ${section('On the web', 'Issues and feature requests are welcome on <a href="https://github.com/xolqy-com/xolqy" target="_blank" rel="noopener">GitHub</a>.')}
    `),
  },

  privacy: legal(
    'Privacy policy', 'How Xolqy handles data — short version: we barely collect any.',
    'We collect as little as possible, store no personal data about your visitors, and never sell anything.',
    [
      ['Cookies', ['Xolqy sets <b>no cookies</b> and uses no <code>localStorage</code> beyond a per-tab session id that is discarded when the tab closes. There is nothing to disclose in a cookie banner.']],
      ['Visitor data', ['For sites using Xolqy, we record pageviews, paths, referrer hostnames, coarse country, device/browser type, time-on-page and scroll depth. We do not store IP addresses or set cookies. Visitors are counted via a daily-rotating salted hash that is not personal data.']],
      ['Do Not Track &amp; Global Privacy Control', ['If a visitor\'s browser sends a Do Not Track or Global Privacy Control signal, the tracker collects nothing at all.']],
      ['Lawful basis (GDPR)', ['Because we store no personal data about visitors (no IP, no cookies, no cross-site identifiers), aggregate measurement relies on the site operator\'s <b>legitimate interest</b> (Art. 6(1)(f)) in understanding their own traffic. Account data is processed to perform our contract with you (Art. 6(1)(b)).']],
      ['Account data', ['For Xolqy account holders we store your email, a hashed password (or Google identifier), and the domains you add. We use this only to operate your account.']],
      ['Retention', ['Raw events are retained according to your plan (30 days to 5 years); daily rollups are kept for trend history. See the <a href="/data-policy">Data policy</a> for specifics.']],
      ['Sharing', ['We do not sell or share your data with advertisers or third parties. Sub-processors are listed in our <a href="/data-policy">Data policy</a>.']],
      ['Your rights &amp; deletion', ['Email <a href="mailto:privacy@xolqy.com">privacy@xolqy.com</a> to access, export, or delete your data. Deleting your account purges your records.']],
    ]),

  'data-policy': legal(
    'Data policy', 'What we store, where, and for how long.',
    'A plain accounting of every kind of data Xolqy touches.',
    [
      ['What we store', ['Aggregated and event-level analytics for your sites, and your account record (email, hashed password or Google id, your domains).']],
      ['Where', ['On Cloudflare\'s infrastructure (Workers + D1). Self-hosters store everything in their own Cloudflare account.']],
      ['Retention', ['Raw events are retained per your plan (30 days to 5 years). Daily rollups are kept for trend history. Delete your account and we purge your data.']],
      ['Sub-processors', ['Cloudflare, Inc. (hosting/CDN). Google (only if you choose Google sign-in).']],
    ]),

  terms: legal(
    'Terms of service', 'The agreement for using the Xolqy managed service.',
    'The rules of the road for using Xolqy. Be reasonable and we will be too.',
    [
      ['Using the service', ['You may use Xolqy to measure sites you own or are authorized to measure. Do not use it to collect data unlawfully or to track individuals.']],
      ['Plans &amp; billing', ['Paid plans renew monthly. You can cancel any time and downgrade to Free. Overages do not interrupt collection; we will ask you to upgrade.']],
      ['Availability', ['We aim for high availability but provide the managed service “as is”. Self-hosting is available if you need full control.']],
      ['Termination', ['You can delete your account at any time. We may suspend accounts that abuse the service or break these terms.']],
    ]),

  dpa: legal(
    'Data Processing Agreement', 'For customers who need a DPA under GDPR.',
    'When you use Xolqy to process visitor data, you are the controller and we are the processor. This DPA template covers that relationship.',
    [
      ['Roles', ['You (the customer) are the data controller. Xolqy is the data processor acting on your instructions.']],
      ['Scope of processing', ['We process the analytics events your sites send, solely to provide the service. We do not store IP addresses or set cookies.']],
      ['Sub-processors', ['Listed in our Data policy. We will notify customers of material changes.']],
      ['Request a signed copy', ['Enterprise customers can request a counter-signed DPA from <a href="mailto:sales@xolqy.com">sales@xolqy.com</a>.']],
    ]),

  security: legal(
    'Security', 'How we protect accounts and data, and how to report issues.',
    'Security is foundational, not bolted on. Here is our approach and how to reach us.',
    [
      ['Account security', ['Passwords are hashed with PBKDF2-SHA256 and a per-user salt. Sessions are server-side, behind HttpOnly, Secure, SameSite cookies. Google sign-in uses OAuth 2.0.']],
      ['Data in transit &amp; at rest', ['All traffic is HTTPS. Data lives in Cloudflare D1. We store no IP addresses and no cookies on visitors.']],
      ['Responsible disclosure', ['Found something? Email <a href="mailto:security@xolqy.com">security@xolqy.com</a>. We respond quickly and credit reporters who want it.']],
    ]),

  imprint: legal(
    'Imprint', 'Legal identification of the service operator.',
    'Provider identification.',
    [
      ['Operator', ['Xolqy. Contact: <a href="mailto:hello@xolqy.com">hello@xolqy.com</a>.']],
      ['Responsible for content', ['The Xolqy team. Full legal entity details are provided to customers and authorities on request.']],
    ]),
};

// Invite accept page — rendered for any /invite/<token>. The token is read from
// the path client-side, then the page fetches invite info and handles accepting.
export function renderInvitePage(origin: string): string {
  const body = pageBody(`
    <div id="invite-card" class="invite-card">
      <div class="auth-mark">X</div>
      <h1 id="invite-h">Invitation</h1>
      <p id="invite-msg" class="lead">Loading…</p>
      <div id="invite-actions"></div>
    </div>
    <script>
      (function () {
        var token = location.pathname.split('/')[2] || '';
        var h = document.getElementById('invite-h');
        var msg = document.getElementById('invite-msg');
        var actions = document.getElementById('invite-actions');
        function btn(label, href) { return '<a class="btn-primary lg" href="' + href + '">' + label + '</a>'; }
        async function go() {
          var info;
          try {
            var r = await fetch('/api/invite/' + encodeURIComponent(token));
            if (!r.ok) throw 0;
            info = await r.json();
          } catch (e) { h.textContent = 'Invite not found'; msg.textContent = 'This invite link is invalid or was revoked.'; return; }
          var me = null;
          try { var mr = await fetch('/api/me'); if (mr.ok) me = (await mr.json()).user; } catch (e) {}
          h.textContent = 'View ' + info.domain + ' on Xolqy';
          if (info.status === 'accepted') { msg.textContent = 'This invite has already been accepted.'; actions.innerHTML = btn('Go to dashboard', '/dashboard'); return; }
          msg.innerHTML = 'You\\'ve been invited to view analytics for <b>' + info.domain + '</b>.';
          var next = encodeURIComponent(location.pathname);
          if (!me) {
            actions.innerHTML = btn('Log in or sign up to accept', '/login?next=' + next);
            return;
          }
          if (me.email.toLowerCase() !== info.email.toLowerCase()) {
            msg.innerHTML = 'This invite was sent to <b>' + info.email + '</b>, but you are signed in as <b>' + me.email + '</b>.';
            actions.innerHTML = btn('Log in as ' + info.email, '/login?next=' + next);
            return;
          }
          actions.innerHTML = '<button id="accept" class="btn-primary lg">Accept invitation</button>';
          document.getElementById('accept').addEventListener('click', async function () {
            this.disabled = true; this.textContent = 'Accepting…';
            var ar = await fetch('/api/invite/' + encodeURIComponent(token) + '/accept', { method: 'POST' });
            if (ar.ok) { location.href = '/dashboard'; }
            else { var d = await ar.json().catch(function(){return{};}); msg.textContent = d.error || 'Could not accept invite.'; this.disabled = false; this.textContent = 'Accept invitation'; }
          });
        }
        go();
      })();
    </script>
  `);
  return shell({ title: 'Invitation', description: 'Accept your Xolqy invitation.', body, path: '/invite', origin, ogSlug: 'default' });
}

export function renderPageHtml(slug: string, origin: string): string | null {
  const p = PAGES[slug];
  if (!p) return null;
  const jsonLd: Record<string, unknown>[] = [];
  if (slug === 'pricing') jsonLd.push(softwareAppSchema(origin), pricingFaqSchema());
  if (PAGE_FAQ[slug]) jsonLd.push(faqSchema(PAGE_FAQ[slug]));
  return shell({ title: p.title, description: p.description, body: p.body, path: `/${slug}`, origin, ogSlug: slug, jsonLd: jsonLd.length ? jsonLd : undefined });
}

// ----------------------------------------------------------------------------
// Blog post rendering
export function renderPost(postSlug: string, origin: string): string | null {
  const post = POSTS[postSlug];
  if (!post) return null;
  const body = pageBody(`
    <header class="page-hero">
      <p class="post-date">${post.date}</p>
      <h1>${post.title}</h1>
      <p class="lead">${post.excerpt}</p>
    </header>
    <article class="prose post-body">${post.body}</article>
    <p class="post-back"><a href="/blog">← All posts</a></p>
    ${cta()}
  `);
  const url = `${origin}/blog/${postSlug}`;
  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: post.title, description: post.excerpt, datePublished: post.iso, dateModified: post.iso,
      image: `${origin}/og/blog-${postSlug}.png`, url, mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'Xolqy' },
      publisher: { '@type': 'Organization', name: 'Xolqy', logo: { '@type': 'ImageObject', url: `${origin}/og/home.png` } },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Blog', item: `${origin}/blog` },
        { '@type': 'ListItem', position: 2, name: post.title, item: url },
      ],
    },
  ];
  return shell({ title: post.title, description: post.excerpt, body, path: `/blog/${postSlug}`, origin, ogSlug: `blog-${postSlug}`, ogType: 'article', jsonLd });
}

// ----------------------------------------------------------------------------
// RSS feed for the blog
function xmlEsc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function rssXml(origin: string): string {
  const items = Object.entries(POSTS).map(([slug, p]) => `    <item>
      <title>${xmlEsc(p.title)}</title>
      <link>${origin}/blog/${slug}</link>
      <guid isPermaLink="true">${origin}/blog/${slug}</guid>
      <pubDate>${new Date(p.iso).toUTCString()}</pubDate>
      <description>${xmlEsc(p.excerpt)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Xolqy Blog</title>
    <link>${origin}/blog</link>
    <description>Notes on privacy-first analytics, web performance, and building Xolqy.</description>
${items}
  </channel>
</rss>`;
}

// ----------------------------------------------------------------------------
// llms.txt — the emerging convention that points LLMs at the key pages and a
// concise, factual product description they can quote.
export function llmsTxt(origin: string): string {
  const cols = FOOTER_COLUMNS.map((c) => {
    const links = c.links.filter((l) => !l.ext).map((l) => `- [${l.label}](${origin}${l.href})`).join('\n');
    return `## ${c.title}\n${links}`;
  }).join('\n\n');
  const posts = Object.entries(POSTS).map(([slug, p]) => `- [${p.title}](${origin}/blog/${slug}): ${p.excerpt}`).join('\n');
  return `# Xolqy

> Xolqy is cookieless, privacy-first web analytics. The tracking script is under 2 KB, it sets no cookies and stores no personal data, so most sites need no consent banner. It runs on Cloudflare Workers + D1 and is open source and self-hostable. Free up to 10k pageviews/month; paid tiers at $9 (100k), $19 (1M) and $49 (5M) per month, plus custom Enterprise.

Key facts:
- Cookieless: counts daily unique visitors via a daily-rotating salted hash; no IP stored, no cookies.
- Lightweight: < 2 KB async script; no impact on Core Web Vitals.
- Metrics: pageviews, unique visitors, sources, countries, devices, time-on-page, scroll depth, outbound clicks.
- Multi-tenant with a super-admin view across every domain, and an "all sites combined" aggregate.
- Built on Cloudflare Workers + D1; open source; self-hostable on the free tier.

${cols}

## Blog
${posts}
`;
}

// ----------------------------------------------------------------------------
// SEO: sitemap.xml and robots.txt
export function allPaths(): string[] {
  return ['/', ...Object.keys(PAGES).map((s) => `/${s}`), ...Object.keys(POSTS).map((s) => `/blog/${s}`)];
}

// Site-wide last-modified for static pages. Bump when the site changes
// materially; blog posts use their own publish date.
const SITE_LASTMOD = '2026-06-02';

export function sitemapXml(origin: string): string {
  const entries: { loc: string; lastmod: string }[] = [
    { loc: '/', lastmod: SITE_LASTMOD },
    ...Object.keys(PAGES).map((s) => ({ loc: `/${s}`, lastmod: SITE_LASTMOD })),
    ...Object.entries(POSTS).map(([s, p]) => ({ loc: `/blog/${s}`, lastmod: p.iso })),
  ];
  const urls = entries
    .map((e) => `  <url><loc>${origin}${e.loc}</loc><lastmod>${e.lastmod}</lastmod></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function robotsTxt(origin: string): string {
  return `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /login
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`;
}
