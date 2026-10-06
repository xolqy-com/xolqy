#!/usr/bin/env node
/**
 * Writes the downloadable resources into ./resources. Upload them to R2 with:
 *   npx wrangler r2 object put xolqy-resources/cloudflare-migration-checklist.md --file resources/cloudflare-migration-checklist.md --content-type "text/markdown; charset=utf-8" --remote
 * (add --local instead of --remote for the local simulator used by `astro dev`).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'resources');
await mkdir(dir, { recursive: true });

const checklist = `# Cloudflare migration checklist

By Xolqy, the Cloudflare-focused agency. https://xolqy.com/
Condensed from "The Cloudflare migration runbook that keeps your rankings"
(https://xolqy.com/insights/cloudflare-migration-runbook/). Copy it into your own docs.

## 0. Decide which migration this is
- [ ] Platform migration (Cloudflare in front of the existing host) or workload migration (application moves to Workers)?
- [ ] If both, in which order and per which site?

## 1. Inventory everything that can break
- [ ] Export every DNS record with TTLs (not transcribed by hand)
- [ ] Note records that validate third-party services (mail, SaaS verification, ACME)
- [ ] Mail flow: MX, SPF, DKIM, DMARC, and where mail is actually hosted
- [ ] Certificates pinned by apps or partners
- [ ] Hard-coded IPs in firewalls, partner allow-lists, webhooks
- [ ] Scheduled jobs on the old server (cron, backups, imports)
- [ ] Integrations that call the site (payments, CRM, indexers, monitors)
- [ ] URL inventory: crawl + Search Console pages + analytics landing pages + 90 days of access logs

## 2. Lower TTLs early
- [ ] Reduce TTLs on records that will change to the minimum (often 300s) at least a week before cutover

## 3. Build the target zone before pointing anything at it
- [ ] Import records into Cloudflare, then compare record by record against the export
- [ ] Proxied (orange) only for HTTP traffic; mail/FTP/non-HTTP stay DNS-only (grey)
- [ ] TLS mode Full (strict); install an Origin CA certificate if the origin lacks a valid one
- [ ] Never Flexible mode

## 4. Redirect map, tested as code
- [ ] www/apex and HTTP->HTTPS rules moved to Redirect Rules / Bulk Redirects
- [ ] For changed URLs: map file (old path, new path, status) covering the full inventory
- [ ] Automated test requests every old URL on staging and asserts status + destination

## 5. Stage on the real platform
- [ ] Test the full configuration against the real origin before DNS changes (hosts override or temporary hostname)
- [ ] Checklist run: forms, logins, payments test transaction, uploads, search, sitemap, structured data, redirect test
- [ ] Non-web checks: mail in/out, webhooks, scheduled jobs

## 6. Protection in log mode first
- [ ] Managed WAF ruleset on, log-only to start
- [ ] Bot Fight Mode / Bot Management as appropriate
- [ ] Rate-limiting rules on login and form endpoints
- [ ] Review false positives after a few days of real traffic, add exceptions, then enforce

## 7. Cut over and watch (first hour)
- [ ] Change nameservers at the registrar
- [ ] Watch analytics for traffic and 5xx; origin logs for Cloudflare ranges and CF-Connecting-IP
- [ ] Run the redirect test against the live domain
- [ ] Send a test email in and out
- [ ] Fire a test webhook from each integration
- [ ] Confirm the certificate chain in a browser
- [ ] Keep the old environment running

## 8. Rollback is a DNS change you already timed
- [ ] Rollback steps written, owner named, duration measured before cutover
- [ ] Old environment retained until the rollback window closes (typically 2 to 4 weeks)

## 9. Two and six weeks after
- [ ] Search Console: coverage, crawl errors, pages report
- [ ] Analytics: landing pages and conversion rates vs baseline
- [ ] Cache hit ratio per path; fix fragmentation with cache rules
- [ ] WAF events reviewed, rules enforced
- [ ] Core Web Vitals field data vs baseline
- [ ] Only then: decommission old hosting, export final backups, close the account

## Workload migration adds
- [ ] Architecture of the new application (Workers, D1/KV/R2/Hyperdrive)
- [ ] Data migration with verification (row counts, checksums, samples)
- [ ] Media to R2 with URL rewriting
- [ ] Content freeze and delta sync for cutover
- [ ] Editor training on what changed

Xolqy is an independent agency, not affiliated with Cloudflare, Inc.
`;

await writeFile(path.join(dir, 'cloudflare-migration-checklist.md'), checklist, 'utf8');
console.log('resources: wrote resources/cloudflare-migration-checklist.md');
