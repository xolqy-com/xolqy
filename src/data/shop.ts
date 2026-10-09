/**
 * Productised offers: fixed-scope packages, subscriptions and kits.
 *
 * Prices are deliberately optional. Until `amount` and `currency` are set for
 * an item, the page shows "Fixed, quoted on request" and the button opens the
 * enquiry form with the package preselected.
 *
 * To sell an item online, set:
 *   amount    price in minor units (cents): 190000 = 1,900.00
 *   currency  'usd' or 'eur'
 *   billing   'once' (default) or 'monthly' (a Stripe subscription)
 * The button then becomes "Buy now" and opens Stripe Checkout, provided the
 * STRIPE_SECRET_KEY secret is set on the Worker; without it the item falls
 * back to "Request this package".
 */
export type ShopCategory = 'packages' | 'subscriptions' | 'kits';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  /** One line: the outcome the buyer gets. */
  tagline: string;
  /** What is delivered, as checkable items. */
  includes: string[];
  /** Delivery time or term, e.g. "5 working days". */
  delivery: string;
  /** Who it is for, in one sentence. */
  forWho: string;
  /** Price in minor units (cents). */
  amount?: number;
  currency?: 'usd' | 'eur';
  billing?: 'once' | 'monthly';
  /** Shown before the price, e.g. "from". Only for display; checkout charges `amount`. */
  pricePrefix?: string;
  /**
   * Regular price in minor units, shown struck through. Display only.
   * Checkout still charges `amount`.
   */
  compareAt?: number;
  /** Enquiry form service preselected by the button. */
  interest: string;
  /** Optional proof: a case study or page where this was done. */
  proof?: { label: string; href: string };
  /** Kits not yet packaged for sale show "Join the waitlist" instead. */
  availability?: 'available' | 'waitlist';
}

export const SHOP_CATEGORIES: { id: ShopCategory; label: string; title: string; summary: string }[] = [
  {
    id: 'packages',
    label: 'Fixed-scope packages',
    title: 'One job, one scope, one price.',
    summary: 'Each package has a defined deliverable and a delivery time. You know what you get before you buy, and nothing grows in scope without a new agreement.',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    title: 'Someone watching your Cloudflare account.',
    summary: 'For businesses that want their configuration kept current and their questions answered without starting a new project each time.',
  },
  {
    id: 'kits',
    label: 'Kits and playbooks',
    title: 'The code and checklists we use, for your team.',
    summary: 'Production code from this website and from client work, packaged for teams who would rather build it themselves.',
  },
];

export const SHOP: ShopItem[] = [
  // ---- Packages ---------------------------------------------------------------
  {
    id: 'cloudflare-os',
    amount: 250000,
    compareAt: 500000,
    currency: 'usd',
    name: 'Cloudflare OS',
    category: 'packages',
    tagline: 'Pre-Black Friday, half price. Cloudflare designed as the operating system for the business, in your account.',
    includes: [
      'Audit: current architecture, DNS and TLS, a performance baseline, security gaps, a cost model and a prioritised plan',
      'Architecture naming each Cloudflare product and why, with the rollback plan',
      'Build and migration in your own Cloudflare account: repository, Wrangler configuration, staging and a rehearsed cutover',
      'Handover documentation. Ongoing Optimize & Support stays the separate monthly engagement',
    ],
    delivery: 'The audit is typically one to two weeks. The build is scoped per project.',
    forWho: 'Businesses that want compute, data, security, AI and delivery designed as one system, in an account they own.',
    interest: 'not-sure',
    proof: { label: 'Read Cloudflare OS', href: '/cloudflare-os/' },
  },
  {
    id: 'cloudflare-audit',
    amount: 150000,
    currency: 'usd',
    name: 'Cloudflare Audit',
    category: 'packages',
    tagline: 'A written review of your Cloudflare setup, with the fixes ranked by impact.',
    includes: [
      'DNS, TLS and certificate configuration',
      'WAF, rate limiting and bot settings',
      'Cache rules, hit ratio and Core Web Vitals',
      'Workers, Pages and storage usage, and what they cost',
      'A PDF report with every finding ranked, plus a 30-minute walkthrough call',
    ],
    delivery: '5 working days',
    forWho: 'Teams already on Cloudflare who suspect they use a fraction of it, or pay for more than they need.',
    interest: 'audit',
  },
  {
    id: 'migration-sprint',
    amount: 90000,
    currency: 'usd',
    name: 'Migration Sprint',
    category: 'packages',
    tagline: 'One website moved behind Cloudflare, with no downtime and nothing changed on your host.',
    includes: [
      'DNS records imported, checked and moved to Cloudflare',
      'Proxy, Full (strict) TLS and HTTPS redirects',
      'Cache rules for assets and pages',
      'Web Analytics without cookies',
      'A rollback plan and a written handover',
    ],
    delivery: '1 to 2 weeks, including the DNS change window',
    forWho: 'Businesses on conventional hosting who want speed, security and measurement without rebuilding the site.',
    interest: 'cloudflare-migration',
    proof: { label: 'Thracean Zeolite case study', href: '/work/thracean-zeolite/' },
  },
  {
    id: 'security-hardening',
    amount: 120000,
    currency: 'usd',
    name: 'Security Hardening Pack',
    category: 'packages',
    tagline: 'The protections every business site should have, configured and tested.',
    includes: [
      'Cloudflare Managed Ruleset and OWASP rules, tuned from log mode to block',
      'Rate limiting on logins, forms and APIs',
      'Turnstile on every public form, verified on the server',
      'SPF, DKIM and DMARC for the domain, so nobody sends mail as you',
      'Security headers and a short report of what changed',
    ],
    delivery: '1 week',
    forWho: 'Sites that take logins, payments or enquiries and have never had their edge security set up deliberately.',
    interest: 'security-and-zero-trust',
    proof: { label: 'How this site is protected', href: '/security/' },
  },
  {
    id: 'zero-trust-setup',
    amount: 150000,
    currency: 'usd',
    name: 'Zero Trust Setup',
    category: 'packages',
    tagline: 'Admin panels and internal tools behind a login that Cloudflare enforces.',
    includes: [
      'Cloudflare Access in front of up to five applications or paths',
      'One-time PIN or Google Workspace and Microsoft sign-in',
      'Policies by email, group or country',
      'Tunnel for tools that run on an office server, with no open ports',
      'An admin guide for adding and removing people',
    ],
    delivery: '1 week',
    forWho: 'Teams with a WordPress admin, a staging site or an internal dashboard that is reachable by anyone today.',
    interest: 'security-and-zero-trust',
  },
  {
    id: 'ai-assistant-setup',
    amount: 350000,
    currency: 'usd',
    name: 'AI Assistant Setup',
    category: 'packages',
    tagline: 'An assistant that answers from your own content, and says so when it cannot.',
    includes: [
      'Your pages or documents embedded with Workers AI and stored in Vectorize',
      'An answer endpoint that cites its sources and refuses outside them',
      'AI Gateway for logs, caching and spend limits',
      'A chat widget for your site, or an API for your own interface',
      'A reindex action for when your content changes',
    ],
    delivery: '2 weeks',
    forWho: 'Businesses with a lot of written knowledge (services, FAQs, manuals) and customers who ask the same questions.',
    interest: 'ai-and-automation',
    proof: { label: 'Try the solution finder', href: '/labs/' },
  },

  // ---- Subscriptions -------------------------------------------------------------
  {
    id: 'managed-cloudflare',
    amount: 29000,
    currency: 'usd',
    name: 'Managed Cloudflare',
    category: 'subscriptions',
    billing: 'monthly',
    tagline: 'Your Cloudflare account monitored, maintained and reported on, every month.',
    includes: [
      'Monitoring of security events, errors and cache performance',
      'Rule updates as threats and Cloudflare features change',
      'A monthly report in plain language',
      'A set number of change hours each month',
      'Priority replies by email',
    ],
    delivery: 'Monthly, cancel with 30 days notice',
    forWho: 'Businesses that depend on their site and would rather not learn the Cloudflare dashboard themselves.',
    interest: 'managed-cloudflare',
  },
  {
    id: 'hour-blocks',
    amount: 75000,
    currency: 'usd',
    name: 'Prepaid hours: 5-hour block',
    category: 'subscriptions',
    tagline: 'Five hours for changes, questions and small builds, valid for three months. Buy two for ten.',
    includes: [
      'Use hours for any Cloudflare or website work',
      'Time logged in 15-minute increments, with notes',
      'A balance statement whenever you ask',
      'Unused hours valid for three months',
    ],
    delivery: 'Valid 3 months from purchase',
    forWho: 'Teams with occasional needs who want a fixed budget and no new quote for every small job.',
    interest: 'managed-cloudflare',
  },

  // ---- Kits -----------------------------------------------------------------------
  {
    id: 'enquiry-pipeline-kit',
    name: 'Enquiry Pipeline Kit',
    category: 'kits',
    tagline: 'The contact form behind this website, as a repository you deploy with one command.',
    includes: [
      'Form with Turnstile, validation and server-side Siteverify',
      'D1 storage, a queue and a durable Workflow with retries',
      'Email notifications through Cloudflare Email Service',
      'A staff view protected by Cloudflare Access',
      'Setup guide, migrations and a status endpoint',
    ],
    delivery: 'Repository access, with a one-hour setup call',
    forWho: 'Developers who want a contact or lead form that never loses a submission, without a third-party form service.',
    interest: 'websites-and-applications',
    proof: { label: 'See it run', href: '/labs/' },
    availability: 'waitlist',
  },
  {
    id: 'astro-workers-starter',
    name: 'Astro + Workers Starter',
    category: 'kits',
    tagline: 'The site template we start client projects from: Astro, Cloudflare, SEO and schema included.',
    includes: [
      'Astro project with typed content collections',
      'Deployment to Workers with Static Assets',
      'SEO, Open Graph images and JSON-LD built in',
      'Cache and security headers, sitemap and redirects',
      'A guide to adapting it for a new client',
    ],
    delivery: 'Repository access',
    forWho: 'Freelancers and small agencies who build marketing sites and want to start from something production-tested.',
    interest: 'websites-and-applications',
    availability: 'waitlist',
  },
  {
    id: 'playbooks',
    name: 'Playbooks',
    category: 'kits',
    tagline: 'The checklists we follow for a Cloudflare migration and a security review, as PDFs.',
    includes: [
      'Migration checklist: before, during and after the DNS change',
      'Security checklist: WAF, bots, rate limits, email and headers',
      'Updated when Cloudflare changes the dashboard',
    ],
    delivery: 'Download',
    forWho: 'In-house teams who will do the work themselves and want to miss nothing.',
    interest: 'cloudflare-migration',
    availability: 'waitlist',
  },
];

function money(cents: number, currency: 'usd' | 'eur'): string {
  return new Intl.NumberFormat(currency === 'usd' ? 'en-US' : 'en-IE', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatPrice(item: ShopItem): string | null {
  if (!item.amount || !item.currency) return null;
  const value = money(item.amount, item.currency);
  return `${item.pricePrefix ? `${item.pricePrefix} ` : ''}${value}${item.billing === 'monthly' ? ' / month' : ''}`;
}

/** Struck-through regular price. Not sent to checkout. */
export function formatCompare(item: ShopItem): string | null {
  if (!item.compareAt || !item.currency) return null;
  return money(item.compareAt, item.currency);
}

export function isPurchasable(item: ShopItem): boolean {
  return Boolean(item.amount && item.currency && item.availability !== 'waitlist');
}

export function shopItem(id: string): ShopItem | undefined {
  return SHOP.find((i) => i.id === id);
}

export function shopByCategory(category: ShopCategory): ShopItem[] {
  return SHOP.filter((i) => i.category === category);
}
