/** Homepage and shared marketing content that is not a collection. */

export const OUTCOMES = [
  {
    id: 'build-faster',
    title: 'Build faster',
    index: '01',
    body: 'Prerendered pages served from the edge, APIs that deploy in seconds, and no servers to provision. Teams ship sooner because the platform removes whole categories of work: capacity planning, patching, scaling policies.',
    detail: 'What that looks like: an Astro or framework site on Workers with Static Assets, previews per branch, and one command to deploy or roll back.',
  },
  {
    id: 'run-leaner',
    title: 'Run leaner',
    index: '02',
    body: 'Pay for requests, storage and compute you use rather than for machines that idle. Caching and R2 (no egress fees) often change the cost picture, but the result depends on your traffic and architecture, so we model it before we promise it.',
    detail: 'What that looks like: an audit with a cost model from your real logs, then a migration plan that moves the expensive parts first.',
  },
  {
    id: 'stay-protected',
    title: 'Stay protected',
    index: '03',
    body: 'DDoS mitigation, a managed WAF, bot controls and rate limiting in front of everything you run, and identity-aware access to the tools your team uses, without a VPN.',
    detail: 'What that looks like: WAF rulesets tuned to your application, Turnstile on your forms, Access policies for staging and admin, and alerts that mean something.',
  },
  {
    id: 'put-ai-to-work',
    title: 'Put AI to work',
    index: '04',
    body: 'Assistants that answer from your own content, search that understands meaning, and workflows that process documents or enquiries while you sleep. Built on Workers AI, Vectorize and Workflows, observed through AI Gateway.',
    detail: 'What that looks like: the solution finder on this site, grounded in our service pages, with limits, logging and an honest fallback.',
  },
] as const;

export const PROCESS = [
  {
    stage: 'Audit',
    index: '01',
    summary: 'We look at what you have before we touch it.',
    output: 'A written report: current architecture, DNS and TLS state, performance baseline (Core Web Vitals from field data where available), security gaps, a cost model, and a prioritised plan with risks.',
    duration: 'Typically one to two weeks',
  },
  {
    stage: 'Architect',
    index: '02',
    summary: 'We design the target on Cloudflare, service by service.',
    output: 'An architecture document naming each Cloudflare product and why, data flow diagrams, the redirect map and SEO preservation plan for migrations, the rollback plan, and an estimate you can hold us to.',
    duration: 'One to two weeks',
  },
  {
    stage: 'Build & Migrate',
    index: '03',
    summary: 'We build in the open, on staging you can see.',
    output: 'Working software in your own Cloudflare account: a repository with CI, infrastructure as configuration (Wrangler), staging previews, D1 migrations, and a cutover runbook rehearsed before the real thing.',
    duration: 'Scoped per project',
  },
  {
    stage: 'Optimize & Support',
    index: '04',
    summary: 'We measure, tune and keep it healthy.',
    output: 'Post-launch review against the baseline, cache and WAF tuning from real traffic, documentation and handover, and an optional managed engagement with monitoring and a named engineer.',
    duration: 'Ongoing, monthly',
  },
] as const;

export const ENGAGEMENTS = [
  {
    id: 'audit',
    name: 'Cloudflare Audit',
    tag: 'Fixed scope',
    summary: 'For teams already on Cloudflare, or deciding whether to move. We review configuration, performance, security and cost, and hand you a prioritised plan.',
    includes: [
      'Architecture and DNS/TLS review',
      'Performance baseline from field and lab data',
      'WAF, bot and Access configuration review',
      'Cost model from your real usage',
      'Written report with a prioritised roadmap',
    ],
    cta: 'Request a proposal',
    service: 'audit',
  },
  {
    id: 'project',
    name: 'Build or Migration Project',
    tag: 'Scoped delivery',
    summary: 'A website, application or migration delivered end to end in your own Cloudflare account, with staging, a rehearsed cutover and a rollback plan.',
    includes: [
      'Architecture document and estimate',
      'Repository, CI and Wrangler configuration',
      'Staging previews throughout',
      'Cutover runbook and rollback plan',
      'Handover documentation and training',
    ],
    cta: 'Request a proposal',
    service: 'websites-and-applications',
  },
  {
    id: 'managed',
    name: 'Managed Cloudflare',
    tag: 'Monthly',
    summary: 'Ongoing engineering for what you run on Cloudflare: monitoring, configuration reviews, troubleshooting and improvements, with a named engineer.',
    includes: [
      'Monitoring and alerting',
      'Monthly configuration review',
      'Troubleshooting and incident support',
      'Platform updates and maintenance',
      'Engineering hours for improvements',
    ],
    cta: 'Request a proposal',
    service: 'managed-cloudflare',
  },
] as const;

export const HOME_FAQS = [
  {
    q: 'What does a Cloudflare migration include?',
    a: 'An assessment of your current hosting, DNS and application; a target architecture; the move itself (DNS and TLS, redirects, caching, security rules, and where relevant the application or storage); SEO preservation with a full redirect map; a rehearsed cutover; and a rollback plan. The scope depends on whether we put Cloudflare in front of your existing origin or rebuild parts of the stack on Workers.',
  },
  {
    q: 'We run WordPress. Does that work with Cloudflare?',
    a: 'Yes, and there are two different things we can do. Accelerating an existing WordPress origin means Cloudflare sits in front of your current host: caching, WAF, image optimisation and TLS, with WordPress untouched. Rebuilding the frontend or application means a new frontend (often Astro) on Workers that reads from WordPress as a headless CMS, or a replacement application. The first is days; the second is a project. We tell you which one you need.',
  },
  {
    q: 'Who owns the Cloudflare account?',
    a: 'You do. We work inside your account with scoped permissions, and every resource (zone, Workers, databases, buckets) belongs to you. If we part ways, nothing has to move.',
  },
  {
    q: 'What happens after launch?',
    a: 'Every project ends with documentation and a handover. If you want us to keep running things, Managed Cloudflare covers monitoring, configuration reviews, troubleshooting and ongoing engineering on a monthly basis.',
  },
  {
    q: 'What does Cloudflare itself cost?',
    a: 'Cloudflare bills you directly for the plan and the usage-based services you use (Workers requests, D1 storage, R2 storage and operations, Workers AI, and so on). Many projects fit comfortably in the free and Workers Paid tiers; some features, such as email sending from Workers, need the paid plan. Our proposal includes a platform cost estimate based on your expected usage, separate from our fees.',
  },
  {
    q: 'Our data must stay in a specific region. Can Cloudflare do that?',
    a: 'Partly, and it needs to be designed in. D1 and Durable Objects support location hints, R2 buckets have a location hint and jurisdiction option (for example the EU), and Data Localization Suite features on enterprise plans control where traffic is inspected. Workers themselves run in the location nearest the visitor. We map your requirements to these controls in the audit and tell you where the limits are.',
  },
] as const;

export const LABS = [
  {
    id: 'edge-inspector',
    name: 'Edge request inspector',
    kind: 'Live demonstration',
    summary: 'Calls a Worker endpoint and shows the real metadata Cloudflare attaches to your request: the location that served it, protocol, TLS version, and the round trip your browser measured.',
    uses: ['Workers', 'request.cf'],
    href: '/labs/#edge-inspector',
  },
  {
    id: 'solution-finder',
    name: 'AI solution finder',
    kind: 'Live demonstration',
    summary: 'Describe a project and get a short recommendation grounded in our service pages, with links to the relevant services. Bounded sessions, usage limits, and a rule-based fallback when AI is unavailable.',
    uses: ['Workers AI', 'Vectorize', 'Durable Objects', 'AI Gateway'],
    href: '/labs/#solution-finder',
  },
  {
    id: 'enquiry-pipeline',
    name: 'Enquiry pipeline tracer',
    kind: 'Live demonstration',
    summary: 'Follow an enquiry through the system by reference: accepted into D1, queued, processed by a Workflow, notified by email, or held with a visible failure. No personal data is exposed.',
    uses: ['D1', 'Queues', 'Workflows', 'Email Service'],
    href: '/labs/#enquiry-pipeline',
  },
  {
    id: 'r2-delivery',
    name: 'Resource delivery from R2',
    kind: 'Live demonstration',
    summary: 'Download the Cloudflare migration checklist, streamed from an R2 bucket through the Worker with ETag validation and cache headers.',
    uses: ['R2', 'Workers'],
    href: '/labs/#r2-delivery',
  },
] as const;
