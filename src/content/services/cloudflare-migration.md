---
title: Cloudflare Migration
shortTitle: Migration
order: 2
eyebrow: Service 02
headline: Move to Cloudflare without losing rankings, uptime or sleep.
summary: Architecture assessment, hosting migration, DNS and TLS setup, redirect mapping, SEO preservation and a rehearsed rollback plan, for a single site or a whole estate.
outcome: Your sites and applications running on Cloudflare with every URL accounted for, a cutover you watched happen, and a documented way back.
problems:
  - Hosting renewals keep rising and the provider's answer to every performance problem is a bigger plan.
  - DNS is spread across registrars and hosts nobody fully remembers, and certificate renewals have failed before.
  - A previous migration lost traffic because redirects were an afterthought.
  - You have dozens of sites on one cPanel or VPS and no clear inventory of what is still used.
deliverables:
  - "Architecture assessment: inventory of domains, DNS records, mail, certificates, applications, integrations and dependencies"
  - "Target architecture per site: Cloudflare in front of the existing origin, Workers with Static Assets, or a rebuilt application"
  - DNS migration plan with record-by-record verification and lowered TTLs before cutover
  - "TLS setup: Universal SSL or advanced certificates, origin certificates, Full (strict) mode, HSTS"
  - Redirect map covering every indexed URL, tested automatically before and after launch
  - "SEO preservation checklist: canonicals, sitemaps, robots, structured data, Search Console verification"
  - Caching, WAF and bot configuration tuned to the application
  - Cutover runbook, rehearsed on staging, and a rollback plan with the exact steps and the time they take
stack:
  - name: DNS, TLS and CDN
    role: Authoritative DNS, certificates and caching for the migrated zone.
  - name: Workers + Static Assets
    role: Target platform for rebuilt sites and for routing logic such as redirects.
  - name: Bulk Redirects and Redirect Rules
    role: Redirect maps enforced at the edge, no origin required.
  - name: R2
    role: Media libraries and archives moved off the old host.
  - name: WAF and Rate limiting
    role: Protection that the old host did not have.
  - name: Email Routing / Email Service
    role: Keeping mail working during and after the move.
process:
  - stage: Audit
    output: "A full inventory, a risk register (mail, third-party DNS validations, hard-coded IPs, licence-bound software) and a recommendation per site: front, move or rebuild."
  - stage: Architect
    output: Target DNS zone file, TLS plan, redirect map, caching and security rules, migration order, and the rollback plan written before anything moves.
  - stage: Build & Migrate
    output: Staging on Cloudflare, automated redirect tests, content and media transfer, DNS cutover at low TTL with monitoring, and live verification of forms, mail and integrations.
  - stage: Optimize & Support
    output: Search Console and analytics review after two and six weeks, cache hit ratio tuning, WAF false-positive review, and decommissioning of the old hosting once the rollback window closes.
faqs:
  - q: Will we lose search rankings?
    a: Not if every URL that matters is mapped and tested. We crawl the live site and Search Console data, produce a redirect map, implement it at the edge, and verify it automatically before cutover and again after. Rankings depend on content and links, which do not change; what we prevent is broken URLs and duplicate content.
  - q: How much downtime is involved?
    a: A DNS cutover with lowered TTLs typically takes minutes to propagate for most visitors. The new site is already live and tested on Cloudflare before DNS changes, so the window where visitors could see either version is short and both versions work.
  - q: What is the difference between putting Cloudflare in front of our site and migrating to Workers?
    a: In front means your existing host stays and Cloudflare handles DNS, TLS, caching and security. Migrating to Workers means the site itself runs on Cloudflare and the old host goes away. The first is quick and low-risk; the second removes the host entirely and is a project. Many clients do the first immediately and the second later, site by site.
  - q: What about email?
    a: Email is the most common migration casualty. We document MX, SPF, DKIM and DMARC records before moving DNS, recreate them exactly, and test delivery before and after. If mail is hosted on the server you are leaving, we plan its move separately.
  - q: Can you migrate many sites at once?
    a: "Yes. Agencies and groups with dozens of sites get an inventory first, then a wave plan: the simplest sites move first to prove the runbook, and the complex ones follow with their own rehearsals."
nextStep:
  label: Plan your migration
  href: /contact/?interest=cloudflare-migration
interest: cloudflare-migration
keywords:
  - migration
  - migrate
  - move hosting
  - cpanel
  - vps
  - dns
  - tls
  - ssl
  - certificate
  - redirects
  - seo
  - hosting
  - wordpress
  - shared hosting
  - downtime
  - cutover
  - rollback
  - many sites
relatedLabs:
  - r2-delivery
  - edge-inspector
---

## The two migrations people confuse

The first is a **platform migration**: Cloudflare becomes your DNS provider, terminates TLS, caches what it can and protects the origin. Your application does not change. For most WordPress, Laravel or legacy sites this is the first step and it takes days.

The second is a **workload migration**: the application itself moves to Workers, its data to D1, KV, R2 or Hyperdrive, and the old server is switched off. This is a project with an architecture stage, and it is where the operational and cost benefits are largest.

We assess which one you need per site. Often the answer is "both, in that order".

## How we protect what you have

Everything that can break is listed before anything moves: DNS records that validate third-party services, mail flow, hard-coded IP addresses in firewalls or partner integrations, certificates pinned somewhere, cron jobs on the old server, and the URLs that bring you traffic. Each item gets an owner and a check in the runbook.

The runbook is rehearsed on staging. Redirect tests run as code against the full URL inventory, so "did we miss one?" is answered by a test, not a feeling. On the day, TTLs are already low, the team is watching logs and analytics, and the rollback is a DNS change we have already timed.

## After cutover

Two and six weeks after launch we review Search Console, analytics and cache hit ratios, tune WAF rules against real traffic, and only then decommission the old hosting. The old environment stays available until the rollback window closes.
