/**
 * Cloudflare OS Implementation by Xolqy. Cloudflare OS is Cloudflare's
 * open-source product. Facts here are restatements of the process, services,
 * stack and FAQs already published on the site. No prices, customer names
 * or measured results.
 */
import { PROCESS } from '@/data/content';

export const OS_PATH = '/cloudflare-os/';

/** Insight topic that marks an article as part of this cluster. */
export const OS_TOPIC = 'Cloudflare OS';

export const OS_DESCRIPTION =
  'Cloudflare and Cloudflare OS are Cloudflare’s products, not Xolqy’s. Cloudflare OS Implementation by Xolqy is the expertise to fix, set up and configure them for your stack: Cloudflare-first, not Cloudflare-only. Xolqy is an independent implementation partner.';

export interface OsProduct {
  name: string;
  href: string;
}

export interface OsLayer {
  id: string;
  index: string;
  name: string;
  /** What this layer does for a business. */
  summary: string;
  products: OsProduct[];
}

export const LAYERS: OsLayer[] = [
  {
    id: 'delivery',
    index: '05',
    name: 'Delivery',
    summary: 'How bytes, names and messages reach people: authoritative DNS, TLS, edge cache, images, analytics without cookies, and transactional email.',
    products: [
      { name: 'DNS', href: '/wiki/dns/' },
      { name: 'TLS', href: '/wiki/tls-ssl/' },
      { name: 'Cache', href: '/wiki/cache/' },
      { name: 'Images', href: '/wiki/images/' },
      { name: 'Web Analytics', href: '/wiki/web-analytics-observability/' },
      { name: 'Email', href: '/wiki/email/' },
    ],
  },
  {
    id: 'security',
    index: '04',
    name: 'Security',
    summary: 'Attacks absorbed at the edge, abuse stopped before it costs you, and internal tools reachable without a VPN by the people who should reach them.',
    products: [
      { name: 'WAF', href: '/wiki/waf/' },
      { name: 'DDoS', href: '/wiki/ddos-protection/' },
      { name: 'Rate limiting', href: '/wiki/rate-limiting/' },
      { name: 'Turnstile', href: '/wiki/turnstile/' },
      { name: 'Access', href: '/wiki/zero-trust-access/' },
      { name: 'Tunnel', href: '/wiki/cloudflare-tunnel/' },
    ],
  },
  {
    id: 'ai',
    index: '03',
    name: 'AI',
    summary: 'Assistants and automations grounded in content you approve, with retrieval, limits, logging and a fallback when the model is unavailable.',
    products: [
      { name: 'Workers AI', href: '/wiki/workers-ai/' },
      { name: 'Vectorize', href: '/wiki/vectorize/' },
      { name: 'AI Gateway', href: '/wiki/ai-gateway/' },
      { name: 'AI Search', href: '/wiki/ai-search/' },
    ],
  },
  {
    id: 'data',
    index: '02',
    name: 'Data',
    summary: 'Three stores, each for a reason: D1 for records that must be right, KV for configuration, R2 for files. Hyperdrive when an existing database has to stay where it is.',
    products: [
      { name: 'D1', href: '/wiki/d1/' },
      { name: 'KV', href: '/wiki/kv/' },
      { name: 'R2', href: '/wiki/r2/' },
      { name: 'Hyperdrive', href: '/wiki/hyperdrive/' },
    ],
  },
  {
    id: 'compute',
    index: '01',
    name: 'Compute',
    summary: 'The site and its backend run on Workers, close to every visitor, with queues, workflows and durable coordination for the pieces that need time or a single source of truth.',
    products: [
      { name: 'Workers', href: '/wiki/workers/' },
      { name: 'Static Assets', href: '/wiki/static-assets/' },
      { name: 'Queues', href: '/wiki/queues/' },
      { name: 'Workflows', href: '/wiki/workflows/' },
      { name: 'Durable Objects', href: '/wiki/durable-objects/' },
    ],
  },
];

export const BENEFITS = [
  {
    index: '01',
    title: 'One system, not a pile of products',
    body: 'DNS, the runtime, the databases, the firewall and the models live in one account and are reached from the same Worker through bindings. There is one configuration file for the application, one bill from Cloudflare, and the same behaviour in every location.',
  },
  {
    index: '02',
    title: 'Build without a server to keep',
    body: 'Prerendered pages are served from the edge. APIs deploy as a versioned Worker. Capacity planning, patching and scaling policies drop out of the work. What remains is the application: content, dependencies and configuration.',
  },
  {
    index: '03',
    title: 'Cost that follows use',
    body: 'You pay for requests, storage and compute you use rather than for machines that idle. R2 has no egress fees. Caching changes the picture again. The result depends on your traffic, so a cost model comes from your usage before anyone promises a saving.',
  },
  {
    index: '04',
    title: 'Protection in front of everything',
    body: 'DDoS mitigation, a managed WAF, bot controls and rate limiting sit in front of what you publish. Access puts identity in front of admin and staging without a VPN. Turnstile protects the forms, and the token is checked on the server.',
  },
  {
    index: '05',
    title: 'AI next to the data',
    body: 'Embeddings, retrieval and generation run beside the content, observed through AI Gateway, with input limits and a non-AI fallback. Long work moves to Queues and Workflows so a request never waits on a model.',
  },
] as const;

/** What each process stage produces, set against doing the same work without a specialist. */
export const VERSUS = PROCESS.map((p) => {
  const alone: Record<(typeof PROCESS)[number]['stage'], string> = {
    Audit:
      'The dashboard has more settings than anyone has time to read. Without a written baseline, the loudest symptom gets fixed and the expensive or risky one waits.',
    Architect:
      'Product choices get made in the middle of the build. The redirect map, the data-store decision and the rollback plan show up when something has already broken.',
    'Build & Migrate':
      'Configuration lives in the dashboard and in one person’s head. Cutover is the first time the pieces are seen together, and the way back is a guess.',
    'Optimize & Support':
      'The person who set it up moves on. Rules drift, the cache hit ratio is a mystery, and the bill is noticed when it arrives.',
  };
  return {
    stage: p.stage,
    index: p.index,
    summary: p.summary,
    duration: p.duration,
    alone: alone[p.stage],
    withUs: p.output,
  };
});

export const NOT_THIS = [
  'Not a Cloudflare endorsement, plan or certification. Cloudflare OS is Cloudflare’s open-source product. Xolqy is an independent implementation partner and is not affiliated with, endorsed by or certified by Cloudflare, Inc.',
  'Not Cloudflare-only. The framing is Cloudflare-first: a brochure site does not need Vectorize, and an existing Postgres does not have to move to D1 on day one.',
  'Not a promise of a latency figure, a ranking, or a percentage off the hosting bill. Those are measured per project from your data, or not claimed.',
  'Not a lock-in designed by us. The repository and the Cloudflare account are yours. Leaving is a handover, not a migration of the account.',
] as const;

export const OS_FAQS = [
  {
    q: 'Is Cloudflare OS something Cloudflare sells?',
    a: 'Cloudflare and Cloudflare OS are Cloudflare’s products, not Xolqy’s. Cloudflare OS is Cloudflare’s open-source AI workspace: a browser workspace, gadgets, and Gatekeepers that connect agents to company systems. You can deploy it into your own Cloudflare account. A fully managed dashboard version is a waitlist, not something this page can switch on for you. Cloudflare OS Implementation by Xolqy is the expertise to fix, set up and configure those products for your stack: the pilot, and a Cloudflare-first build of compute, data, security, AI and delivery in an account you own. It is not a Cloudflare-only programme. Cloudflare and Cloudflare OS are trademarks of Cloudflare, Inc. Xolqy is an independent implementation partner. Cloudflare does not endorse Xolqy.',
  },
  {
    q: 'Do we have to adopt the whole platform?',
    a: 'No. The aim is Cloudflare-first, not Cloudflare-only. The architecture stage names each product and why, including the ones you do not need yet. Many engagements start with Cloudflare in front of an existing site, or with one application on Workers, and add layers when there is a reason.',
  },
  {
    q: 'Who owns the Cloudflare account?',
    a: 'You do. We work inside your account with scoped permissions, and every zone, Worker, database and bucket belongs to you. If we part ways, nothing has to move.',
  },
  {
    q: 'What does Cloudflare itself cost?',
    a: 'Cloudflare bills you directly for the plan and the usage-based services you use. Many projects fit in the free and Workers Paid tiers; some features, such as email sending from Workers, need the paid plan. A proposal includes a platform cost estimate based on expected usage, separate from our fees. Fixed-scope packages are listed in the shop.',
  },
  {
    q: 'How is this different from hiring you for one service?',
    a: 'Each service is a scoped outcome: a website, a migration, a performance pass, a security configuration, an assistant, or a monthly retainer. Cloudflare OS Implementation by Xolqy is the map those services sit on, so a migration does not ignore the firewall, and an assistant is not designed without a place for the data. You can still buy one service.',
  },
  {
    q: 'Our data must stay in a specific region. Can this do that?',
    a: 'Partly, and it has to be designed in. D1 and Durable Objects support location hints, R2 buckets have a location hint and a jurisdiction option such as the EU, and Data Localization Suite features on enterprise plans control where traffic is inspected. Workers themselves run in the location nearest the visitor. KV caches values globally. We map your requirements to these controls in the audit and say where the limits are.',
  },
] as const;
