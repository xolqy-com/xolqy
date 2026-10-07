/**
 * The architecture of xolqy.com itself: every Cloudflare integration the site
 * uses, what it does for a business, and what it does here. `status` is the
 * declared state as shipped in this repository; `/api/status` verifies the
 * live state at runtime and the stack page upgrades the badges accordingly.
 *
 *   active     the integration is wired in code and works once deployed
 *   awaiting   the code is in place but an account/dashboard step is required
 *   planned    listed in the catalogue, not implemented on this site yet
 */
export type StackCategory = 'compute' | 'data' | 'security' | 'ai' | 'delivery';
export type StackStatus = 'active' | 'awaiting' | 'planned';

export interface StackItem {
  id: string;
  name: string;
  category: StackCategory;
  status: StackStatus;
  /** Benefit first: what this does for a business. */
  purpose: string;
  /** What it does on xolqy.com specifically. */
  role: string;
  /** Key in the /api/status response, if the state can be verified live. */
  check?: string;
  /** Where it lives: code, dashboard, or both. */
  configuredIn: 'code' | 'dashboard' | 'both';
  docs: string;
}

export const STACK_CATEGORIES: { id: StackCategory; label: string; summary: string }[] = [
  { id: 'compute', label: 'Compute', summary: 'Where the site and its backend run: on Workers, in every Cloudflare location, with durable coordination for the pieces that need state or time.' },
  { id: 'data', label: 'Data', summary: 'Three stores, each picked for a reason: D1 for records that must be right, KV for public configuration, R2 for files.' },
  { id: 'security', label: 'Security', summary: 'Abuse protection on the forms, Zero Trust on the staff view, and the platform controls that sit in front of everything.' },
  { id: 'ai', label: 'AI', summary: 'A small, grounded assistant built from Workers AI, Vectorize and AI Gateway, with a non-AI fallback when the bindings are absent.' },
  { id: 'delivery', label: 'Delivery', summary: 'How bytes reach visitors: static assets at the edge, DNS and TLS on Cloudflare, analytics without cookies.' },
];

export const STACK: StackItem[] = [
  // ---- Compute --------------------------------------------------------------
  {
    id: 'workers',
    name: 'Workers + Static Assets',
    category: 'compute',
    status: 'active',
    purpose: 'Runs your site and APIs close to every visitor without servers to patch, scale or keep warm.',
    role: 'Serves every prerendered page and asset, and runs the enquiry, status, edge-demo and AI endpoints from one Worker (src/worker.ts).',
    check: 'workers',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/workers/static-assets/',
  },
  {
    id: 'queues',
    name: 'Queues',
    category: 'compute',
    status: 'active',
    purpose: 'Accepts work instantly and processes it in the background with retries, so a slow email provider never slows a customer down.',
    role: 'Each accepted enquiry is written to D1, then a message is queued. The consumer starts one Workflow per enquiry, idempotently, with a dead-letter queue for anything that fails five times.',
    check: 'queue',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/queues/',
  },
  {
    id: 'workflows',
    name: 'Workflows',
    category: 'compute',
    status: 'active',
    purpose: 'Multi-step business processes that survive failures: each step is retried and recorded, and the process can pause for hours or days.',
    role: 'EnquiryWorkflow loads the record, marks it processing, notifies staff by email with exponential retries, optionally acknowledges the sender, and records the outcome. Failures stay visible in the staff view.',
    check: 'workflow',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/workflows/',
  },
  {
    id: 'durable-objects',
    name: 'Durable Objects',
    category: 'compute',
    status: 'active',
    purpose: 'Strongly consistent, single-threaded coordination for things like sessions, carts, counters or live collaboration.',
    role: 'FinderSession holds each AI solution-finder conversation in SQLite-backed storage: bounded turns, per-session pacing, and automatic expiry via an alarm.',
    check: 'durableObjects',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/durable-objects/',
  },
  {
    id: 'observability',
    name: 'Workers observability',
    category: 'compute',
    status: 'active',
    purpose: 'Logs, errors and invocation traces for the code that runs at the edge, without shipping logs anywhere else.',
    role: 'Enabled in wrangler.jsonc (observability.logs, invocation logs, full sampling). Application logs never include names, emails or message bodies.',
    check: 'observability',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/workers/observability/',
  },

  // ---- Data -------------------------------------------------------------------
  {
    id: 'd1',
    name: 'D1',
    category: 'data',
    status: 'active',
    purpose: 'A relational SQL database for records that must be consistent: orders, accounts, submissions, audit trails.',
    role: 'Authoritative store for validated enquiries and their processing status (received, queued, processing, notified, notification_failed). Schema in migrations/.',
    check: 'd1',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/d1/',
  },
  {
    id: 'kv',
    name: 'KV',
    category: 'data',
    status: 'active',
    purpose: 'Globally cached key-value storage for configuration and read-heavy data that can tolerate a few seconds of propagation.',
    role: 'Public configuration and cached read-heavy data only, for example the resources manifest and feature flags. Never the enquiry store, because KV is eventually consistent.',
    check: 'kv',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/kv/',
  },
  {
    id: 'r2',
    name: 'R2',
    category: 'data',
    status: 'active',
    purpose: 'Object storage for files and media with no egress fees, S3-compatible, served through the same edge network.',
    role: 'Holds downloadable resources (the migration checklist) streamed through /api/resources/ with ETag validation and cache headers.',
    check: 'r2',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/r2/',
  },

  // ---- Security ---------------------------------------------------------------
  {
    id: 'turnstile',
    name: 'Turnstile',
    category: 'security',
    status: 'awaiting',
    purpose: 'Stops bots on forms and logins without CAPTCHA puzzles for real people.',
    role: 'Protects the project enquiry form. Every submission is verified server-side with Siteverify, including hostname and action checks; the token is never trusted from the browser alone.',
    check: 'turnstile',
    configuredIn: 'both',
    docs: 'https://developers.cloudflare.com/turnstile/',
  },
  {
    id: 'access',
    name: 'Access (Zero Trust)',
    category: 'security',
    status: 'awaiting',
    purpose: 'Identity-aware access to internal tools and staging sites without a VPN.',
    role: 'Guards /admin/, the staff view of enquiries. The Worker validates the Cf-Access-Jwt-Assertion token (issuer, audience, signature, expiry) on every request and fails closed if Access is not configured.',
    check: 'access',
    configuredIn: 'both',
    docs: 'https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/',
  },
  {
    id: 'rate-limiting',
    name: 'Rate limiting binding',
    category: 'security',
    status: 'active',
    purpose: 'Caps how often one client can hit an expensive endpoint, enforced in the Worker before any work is done.',
    role: 'Per-IP limits on the enquiry endpoint (5/min) and the AI finder (20/min), applied per Cloudflare location.',
    check: 'rateLimit',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/',
  },
  {
    id: 'waf',
    name: 'WAF, DDoS and bot controls',
    category: 'security',
    status: 'awaiting',
    purpose: 'Managed rules, DDoS mitigation and bot scoring in front of the origin, tuned per application.',
    role: 'Platform layer, configured in the dashboard for the xolqy.com zone (managed ruleset, rate-limiting rules on /api/*, bot fight mode). Documented in README; not represented in code.',
    configuredIn: 'dashboard',
    docs: 'https://developers.cloudflare.com/waf/',
  },

  // ---- AI ----------------------------------------------------------------------
  {
    id: 'workers-ai',
    name: 'Workers AI',
    category: 'ai',
    status: 'active',
    purpose: 'Run open models for text, embeddings, images and audio next to your data, billed per use, no GPUs to manage.',
    role: 'Generates embeddings for the service content and answers in the solution finder (model set by AI_CHAT_MODEL). If the binding is absent, a rule-based matcher answers instead and says so.',
    check: 'ai',
    configuredIn: 'code',
    docs: 'https://developers.cloudflare.com/workers-ai/',
  },
  {
    id: 'vectorize',
    name: 'Vectorize',
    category: 'ai',
    status: 'awaiting',
    purpose: 'Vector search for retrieval-augmented answers over your own documents, products or knowledge base.',
    role: 'Stores embeddings of the approved service pages. The finder retrieves the closest passages and answers only from them. The index must be created and populated once (README > Vectorize).',
    check: 'vectorize',
    configuredIn: 'both',
    docs: 'https://developers.cloudflare.com/vectorize/',
  },
  {
    id: 'ai-gateway',
    name: 'AI Gateway',
    category: 'ai',
    status: 'awaiting',
    purpose: 'Observe, cache, rate-limit and log every AI request across providers from one place.',
    role: 'When AI_GATEWAY_ID is set, every Workers AI call from the finder is routed through the gateway for logging and caching. Without it, calls go direct.',
    check: 'aiGateway',
    configuredIn: 'both',
    docs: 'https://developers.cloudflare.com/ai-gateway/',
  },

  // ---- Delivery ----------------------------------------------------------------
  {
    id: 'dns-tls-cdn',
    name: 'DNS, TLS and CDN',
    category: 'delivery',
    status: 'awaiting',
    purpose: 'Authoritative DNS, automatic certificates, HTTP/3 and global caching for any origin.',
    role: 'xolqy.com is a Cloudflare zone with the Worker attached as a custom domain. HSTS, TLS 1.2 minimum and Always Use HTTPS are dashboard settings listed in README.',
    configuredIn: 'dashboard',
    docs: 'https://developers.cloudflare.com/workers/configuration/routing/custom-domains/',
  },
  {
    id: 'web-analytics',
    name: 'Web Analytics',
    category: 'delivery',
    status: 'awaiting',
    purpose: 'Privacy-first traffic and Core Web Vitals measurement with no cookies and no fingerprinting.',
    role: 'The beacon is added only when PUBLIC_CF_BEACON_TOKEN is set at build time. Field data for LCP, INP and CLS lands in the dashboard.',
    check: 'webAnalytics',
    configuredIn: 'both',
    docs: 'https://developers.cloudflare.com/web-analytics/',
  },
  {
    id: 'email',
    name: 'Email Service',
    category: 'delivery',
    status: 'active',
    purpose: 'Transactional email sent from Workers through a native binding, with the sending domain authenticated on Cloudflare DNS.',
    role: 'Every accepted enquiry is delivered to the staff inbox by the enquiry Workflow, from noreply@notify.xolqy.com with the enquirer as Reply-To, plus an optional acknowledgement to the sender. The sending subdomain is onboarded in the dashboard; NOTIFY_EMAIL and EMAIL_FROM are set in wrangler.jsonc.',
    check: 'email',
    configuredIn: 'both',
    docs: 'https://developers.cloudflare.com/email-service/',
  },
  {
    id: 'images',
    name: 'Images',
    category: 'delivery',
    status: 'active',
    purpose: 'Resize, convert and optimise images on request, serving AVIF or WebP at the exact width each visitor needs, from one master file.',
    role: 'The case-study screenshots are one 1540px JPEG each in the repository. Astro emits /cdn-cgi/image/ URLs with a width per breakpoint and format=auto, and Cloudflare produces and caches every variant at the edge (astro.config.mjs, imageService: cloudflare).',
    check: 'images',
    configuredIn: 'both',
    docs: 'https://developers.cloudflare.com/images/transform-images/',
  },
];

export const CATALOGUE_ONLY = [
  { name: 'Hyperdrive', purpose: 'Connection pooling and caching for existing Postgres and MySQL databases.' },
  { name: 'Stream', purpose: 'Video upload, encoding and adaptive playback.' },
  { name: 'Workers for Platforms', purpose: 'Run customer-supplied code safely inside your own product.' },
  { name: 'Browser Rendering', purpose: 'Headless browsers for screenshots, PDFs and scraping.' },
  { name: 'Pages Functions', purpose: 'Earlier pattern for static sites with functions; new projects use Workers + Static Assets.' },
];

export function stackByCategory(category: StackCategory): StackItem[] {
  return STACK.filter((s) => s.category === category);
}
