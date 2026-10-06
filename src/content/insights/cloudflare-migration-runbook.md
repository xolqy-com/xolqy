---
title: The Cloudflare migration runbook that keeps your rankings
description: A step-by-step plan for moving a site to Cloudflare, from the inventory nobody wants to write to the rollback nobody wants to need, with the SEO and email checks that prevent the usual casualties.
publishedAt: 2026-09-29
audience: both
topics: [Migration, DNS, TLS, SEO, Redirects]
readingMinutes: 11
relatedServices: [cloudflare-migration, security-and-zero-trust]
---

Migrations fail quietly. The site comes up, everyone congratulates each other, and three weeks later someone notices organic traffic is down a third, invoices are not arriving by email, and a partner's integration has been failing since the day of the move. None of those are caused by Cloudflare. All of them are caused by skipping steps.

This is the runbook we use. It is written for a single site; for an estate of sites, the same runbook runs once per wave.

## 0. Decide which migration this is

There are two migrations that people call "moving to Cloudflare", and the plan depends on which one you are doing.

A **platform migration** makes Cloudflare your DNS provider and puts its network in front of your existing hosting. Your application does not change. You gain TLS management, caching, DDoS protection, the WAF and bot controls. This is the move most sites should make first, and it is measured in days.

A **workload migration** moves the application itself onto Workers and Cloudflare's data services, after which the old server is switched off. This is a project with an architecture stage and a build stage, and it is where the larger operational and cost benefits are.

The steps below cover the platform migration in full and note where a workload migration adds work.

## 1. Inventory everything that can break

Write down, in a document the whole team can see:

- **Every DNS record** in the current zone, exported, not transcribed. Include TTLs. Note which records exist to validate third-party services (Google Workspace, Microsoft 365, mail providers, domain verification for SaaS tools, ACME challenges).
- **Mail flow**: MX, SPF, DKIM and DMARC records, and where mail is actually hosted. If mail lives on the web server you are leaving, that is a second migration and it needs its own plan.
- **Certificates**: what is pinned where. Mobile apps and partner integrations sometimes pin certificates or check specific chains.
- **Hard-coded addresses**: firewalls that allow your server's IP, partners that allow-list it, webhooks that point at it.
- **Scheduled jobs** on the old server: backups, cron, imports.
- **Integrations** that call the site: payment webhooks, CRM syncs, search indexers, uptime monitors.
- **The URL inventory**: every URL that receives traffic or has links. Sources: a crawl of the live site, Search Console's pages report, analytics landing pages, and the server's access logs for the last ninety days.

The URL inventory is the SEO insurance policy. Every URL in it will be tested before and after cutover.

## 2. Lower TTLs early

A week before cutover, reduce the TTLs on the records that will change to the lowest value your current provider allows (often 300 seconds). This means that on the day, most resolvers pick up the new values within minutes rather than hours. It costs nothing and it is the step most often skipped.

## 3. Build the target zone before pointing anything at it

Add the domain to Cloudflare and let it import the records. Then compare, record by record, against the export from step 1. Importers miss things, especially TXT records with unusual formatting and records at deep subdomains. Fix the differences by hand.

Decide, per record, whether it is proxied (orange cloud) or DNS-only (grey cloud). Web traffic is proxied; mail, FTP and anything that is not HTTP is DNS-only. Proxying a record that should not be proxied is the classic "everything is down except the website" mistake.

Set the TLS mode. For an origin with a valid certificate, use Full (strict). If the origin's certificate is self-signed or expired, install a Cloudflare Origin CA certificate on it first; do not use Flexible mode, which leaves the leg between Cloudflare and your origin unencrypted and causes redirect loops with many applications.

## 4. Write the redirect map and test it as code

For a platform migration where URLs do not change, the redirect map is small: www to apex (or the reverse), HTTP to HTTPS, and anything the old host handled in `.htaccess`. Those rules move to Cloudflare Redirect Rules or Bulk Redirects so they are enforced at the edge.

For a workload migration where the site is rebuilt, URLs often do change, and every old URL from the inventory needs a destination. Write the map as a file (old path, new path, status code), implement it, and write a test that requests every old URL against the staging hostname and asserts the status and the final destination. Run it until it passes. Run it again after cutover.

A map with holes is how traffic disappears. A test is how you know there are no holes.

## 5. Stage it on the real platform

For a platform migration, you can test the full Cloudflare configuration against the real origin before DNS changes by overriding DNS resolution locally (a hosts file entry pointing the domain at a Cloudflare IP from the zone) or by using a temporary hostname. For a workload migration, the new site runs on a `workers.dev` subdomain or a preview URL until cutover.

On staging, verify with a checklist, not with a glance: forms submit, logins work, the payment provider's test transaction completes, uploads succeed, the search index updates, the sitemap is reachable, structured data validates, and the redirect test passes. Then test the things that are not web pages: send and receive mail, trigger a webhook, run the scheduled jobs.

## 6. Configure protection in log mode

Enable the managed WAF ruleset, Bot Fight Mode and a rate-limiting rule for login and form endpoints, but start with the WAF in log-only mode. Review what it would have blocked for a few days of real traffic after cutover, add exceptions for legitimate patterns (file uploads, rich-text editors, webhooks from known providers), then switch to block. Going straight to block on a site with an admin area is how editors get locked out on day one.

## 7. Cut over, and watch

Change the nameservers at the registrar (or the records, if you are keeping DNS elsewhere, though that forfeits most benefits). Then, for the first hour:

- Watch the Cloudflare analytics for traffic arriving and for 5xx responses.
- Watch the origin's logs to confirm requests now arrive from Cloudflare's ranges and that the real client IP is being restored (your application should read `CF-Connecting-IP`).
- Run the redirect test against the live domain.
- Send a test email in and out.
- Fire a test webhook from each integration.
- Confirm the certificate chain the browser sees is the expected one.

Keep the old environment running. It is the rollback.

## 8. The rollback plan is a DNS change you already timed

If something critical fails and cannot be fixed within the agreed window, point DNS back. Because TTLs were lowered in step 2, this takes minutes. Write the exact steps and the person who executes them before cutover; a rollback decided in a panic is where the second outage comes from.

The old environment stays available until the rollback window closes, typically two to four weeks.

## 9. The weeks after

At two weeks and at six weeks:

- **Search Console**: coverage, crawl errors, and the pages report. A small, temporary dip in impressions after a workload migration is common while URLs are recrawled; a sustained drop means a mapping problem.
- **Analytics**: landing pages and conversion rates against the pre-migration baseline.
- **Cache hit ratio**: from the analytics or logs, per path. Low ratios usually mean cookies or query strings are fragmenting the cache; fix with cache rules.
- **WAF events**: review the log, then enforce.
- **Core Web Vitals**: field data in Web Analytics or Search Console, compared with the baseline.

Only after this review do you decommission the old hosting, export the final backups, and close the account.

## What a workload migration adds

Everything above, plus: the architecture of the new application, data migration with verification (row counts, checksums, sample comparisons), media transfer to R2 with URL rewriting, content freeze and delta sync for the cutover, and training for editors on anything that changed. The redirect map becomes the central artefact because URLs almost always change.

## The short version

Inventory, lower TTLs, build the zone, test the redirects as code, stage on the real platform, protect in log mode, cut over watching, keep the rollback ready, review at two and six weeks. Nothing here is clever. All of it is work that has to be done, and most of the migrations we are asked to rescue skipped at least three of these steps.

If you would rather we did it, the [Cloudflare Migration](/services/cloudflare-migration/) service is this runbook, executed, with the inventory and the tests as deliverables. The [migration checklist](/labs/#r2-delivery) on the Labs page is the condensed version you can keep.
