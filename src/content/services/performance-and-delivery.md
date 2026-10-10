---
title: Performance & Delivery
shortTitle: Performance
order: 3
eyebrow: Service 03
headline: Measured speed, not guessed speed.
summary: Caching strategy, CDN configuration, image optimisation, Core Web Vitals and application tuning, driven by field data from your real visitors and verified after every change.
outcome: Pages that meet Core Web Vitals thresholds for real users on real devices, and a cache strategy that keeps them that way as the site grows.
problems:
  - Lighthouse says 95 on a laptop; Search Console says most mobile visitors have a poor experience.
  - The CDN is on but the cache hit ratio is low and nobody knows why.
  - Images are the heaviest thing on every page and the plugin that was meant to fix it broke the layout.
  - Checkout or search gets slow at peak times and scaling the server did not help.
deliverables:
  - Performance baseline from field data (Chrome UX Report, Web Analytics, RUM) and lab data, per page template
  - "Caching strategy: cache rules, cache keys, TTLs, stale-while-revalidate, purge workflow, tiered cache where it pays off"
  - "Image pipeline: Cloudflare Images or Image Resizing, responsive sizes, AVIF/WebP, lazy loading, dimension attributes"
  - "Core Web Vitals work: LCP (critical path, preloads, fonts), INP (JavaScript budget, long tasks, hydration), CLS (dimensions, font loading, dynamic content)"
  - "Application tuning: query review, N+1 fixes, response streaming, edge caching of API responses, Smart Placement where appropriate"
  - Third-party script audit and loading policy (consent, tag manager, chat widgets)
  - "Monitoring: Web Analytics Core Web Vitals, alerting on regressions, a performance budget enforced in CI"
  - Report with before and after measurements from the same field data source
stack:
  - name: CDN and Cache Rules
    role: Edge caching with explicit keys, TTLs and purge workflows.
  - name: Tiered Cache and Argo Smart Routing
    role: Higher hit ratios and better routing when traffic justifies the cost.
  - name: Images
    role: Resizing, format negotiation and quality control without build pipelines.
  - name: Workers
    role: Edge logic for cache keys, HTML rewriting, A/B routing and API response caching.
  - name: Web Analytics
    role: Field Core Web Vitals without cookies.
  - name: Speed Brain and Early Hints
    role: Speculative loading and 103 Early Hints where the application allows.
process:
  - stage: Audit
    output: Field and lab baseline per template, waterfall analysis of the critical path, cache hit analysis from logs, image and script inventory, and a ranked list of fixes with expected impact.
  - stage: Architect
    output: Caching design (what, where, for how long, how it is purged), image pipeline design, JavaScript loading strategy, and the performance budget the site will be held to.
  - stage: Build & Migrate
    output: Changes shipped in small, measured batches, each verified against the baseline, with cache and image configuration as code where Cloudflare supports it.
  - stage: Optimize & Support
    output: 28-day field data review (the window Google uses), regression alerts, and quarterly re-tuning as content and traffic change.
faqs:
  - q: Can you guarantee a score?
    a: No, and you should be wary of anyone who does. We commit to measurable targets (for example LCP under 2.5 seconds at the 75th percentile for mobile visitors on your product pages), we measure from the same field data Google uses, and we report what moved and what did not.
  - q: What is the difference between lab and field data?
    a: Lab data is a synthetic test on one machine, useful for debugging. Field data is what your real visitors experienced on their devices and networks, which is what Core Web Vitals assessments and search ranking signals use. We optimise for field data and use lab tools to find the cause.
  - q: We already use a CDN. Why is it slow?
    a: "Usually because little is being cached: cookies or query strings bust the cache, HTML is marked private, or the origin sends headers that forbid caching. A cache audit from logs shows the real hit ratio per path and why, and cache rules fix most of it without touching the application."
  - q: Do you work on the application code too?
    a: Yes, when the bottleneck is there. Slow database queries, oversized JavaScript bundles and render-blocking third parties are application problems, and we fix them in your codebase with your team or on our own, depending on the engagement.
  - q: Does this help with WordPress?
    a: Considerably. Full-page caching at the edge with a purge-on-publish hook, image optimisation through Cloudflare instead of plugins, and a script loading policy typically transform WordPress field metrics without changing the theme. Where the theme is the problem, we say so.
nextStep:
  label: Get a performance baseline
  href: /contact/?interest=performance-and-delivery
interest: performance-and-delivery
keywords:
  - performance
  - speed
  - slow
  - core web vitals
  - lcp
  - inp
  - cls
  - caching
  - cache
  - cdn
  - images
  - image optimisation
  - lighthouse
  - pagespeed
  - web vitals
  - mobile
  - load time
relatedLabs:
  - edge-inspector
---

## Where the time goes

Most slow sites share the same profile: an HTML response that is not cached and takes hundreds of milliseconds to generate, fonts and images competing for the first bytes, and a few hundred kilobytes of JavaScript that runs before the page responds to a tap. The fixes are known; what varies is which ones apply to you and in what order. That is what the audit decides.

We measure first. Field data (what your visitors experienced, at the 75th percentile, over 28 days) sets the baseline and the target. Lab tools find causes. Every change ships in a batch small enough to attribute its effect.

## Caching is a design, not a toggle

A cache strategy answers four questions for every kind of response: can it be cached at all, what makes two requests the same (the key), how long it lives, and how it is purged when content changes. We write these down per path, implement them as Cache Rules and, where logic is needed, in a Worker, and verify the hit ratio from logs rather than from the dashboard's summary.

## JavaScript is the INP problem

Interaction to Next Paint is dominated by main-thread work. We audit every script, third-party ones first, and set a loading policy: what is essential, what loads after interaction, what is removed. On frameworks that hydrate everything, we move to islands or partial hydration where the codebase allows.

Delivery is one layer of [Cloudflare OS Implementation by Xolqy](/cloudflare-os/). The cache and the images do not fix a data store or a firewall that was never designed.
