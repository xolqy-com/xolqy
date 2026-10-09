---
title: What a Cloudflare audit actually covers
description: A Cloudflare audit is a written report from inside the account, not a score of one homepage. Here is what the report contains, what the free health check is instead, and what happens after it.
publishedAt: 2026-10-06T16:00:00.000Z
audience: business
topics: ["Cloudflare OS", Audit, Security]
readingMinutes: 6
relatedServices: [cloudflare-migration, security-and-zero-trust, performance-and-delivery, managed-cloudflare]
---

“Audit” gets used for anything from a homepage scan to a long consulting project. On this site it means a fixed thing. We look at what you have before we touch it, and we hand you a written report: current architecture, DNS and TLS, a performance baseline, security gaps, a cost model from your usage, and a prioritised plan with risks. That is the first stage of [Cloudflare OS](/cloudflare-os/), and it is also a service you can buy on its own.

## What the report contains

**Architecture.** Domains, origins, Workers, Pages projects, databases, buckets, and the integrations that will break if a record moves: mail, payment webhooks, hard-coded IPs, cron jobs, licence-bound software. For each site, a recommendation: leave it, put Cloudflare in front, or rebuild. Those are different projects, described in [in front, or a rebuild](/insights/cloudflare-in-front-or-rebuild-on-workers/).

**DNS and TLS.** Where the zone is hosted, whether DNSSEC is on (the step people skip is at the registrar, which is why there is a [DNSSEC article](/insights/dnssec-on-cloudflare/)), certificate mode, minimum TLS version, HSTS, and whether the origin can still be reached by skipping Cloudflare. [DNS](/wiki/dns/) and [TLS](/wiki/tls-ssl/) are short pages if you want the vocabulary.

**Performance, from field data where it exists.** Core Web Vitals from real visitors, not a single Lighthouse run on a laptop. Cache hit ratio, and why it is what it is. Images and third-party scripts. The point of the [performance service](/services/performance-and-delivery/) is that the audit ranks fixes by expected effect. It does not turn every knob.

**Security.** [WAF](/wiki/waf/) managed rules and whether they are in log mode or enforced. Custom rules, [rate limiting](/wiki/rate-limiting/), bot controls, [Turnstile](/wiki/turnstile/) on the forms that need it, [Access](/wiki/zero-trust-access/) on the tools that should not be public. The [security service](/services/security-and-zero-trust/) is what implementing that list looks like. The audit is the list, ranked, with the false-positive risk written down.

**Cost.** Workers requests, D1, R2, and anything else the account is billed for, read from your usage rather than from a brochure. The model says what is growing. It does not promise a percentage. Platform cost and our fees stay separate in any proposal that follows.

**A plan you can decline.** Priorities, risks, and the stage that would come next. You keep the report whether or not you hire us to do the work. That is the point of making Audit its own stage.

Typically one to two weeks, depending on how many zones and how much of the inventory is undocumented.

## What it is not

The free [health check](/health-check/) requests a homepage and reads a few DNS records. It scores HTTPS, HTTP/3, whether the site is proxied, security headers, DNSSEC, CAA, SPF and DMARC. It does not log in, scan ports, or open your account. A working site and a well-protected site are different things, and the check is honest about being an outside view of one page. The health check’s own FAQ says the audit is the inside view: firewall rules, cache rules, Workers, costs and logs.

A Lighthouse score is not the audit either. Lab data finds causes. Field data, where you have it, is the baseline.

An audit is also not a secretly scoped rebuild. If the recommendation is “rebuild”, that is a later estimate, after an architecture stage, with a list of what is included. The audit’s job is to stop that estimate from being a guess.

## What we look at because it usually hurts

These are patterns, not a claim about your account.

Cache rules that bypass HTML, so the expensive origin generates every page. A WAF left in log mode after the trial week, so it has never blocked anything. An admin hostname with no Access policy. KV holding records that needed a transaction. A Worker with a secret in a variable because someone pasted it into `wrangler.jsonc`. Analytics that cannot be trusted because a tag manager and a cookie banner disagree. Mail that depends on a DNS record nobody listed.

None of these require a new product. They require someone to read the configuration against the way the business actually operates.

## After the document

Three things can happen, and all three are legitimate.

You take the report and do the work internally. The document is written for that. [Which products you need](/insights/which-cloudflare-products-a-business-needs/) is the public version of the decision procedure we use inside it.

You commission the next stage. Architect names each product and why, the redirect map, the rollback, and an estimate. Build & Migrate puts the result in [your account](/insights/your-cloudflare-account-should-be-yours/). Optimize & Support is the optional monthly engagement: monitoring, a configuration review, and a named engineer.

You decide the move is not worth it yet. Some workloads do not belong on Workers. Some sites are already fast. Saying so is part of the audit, not a failure of it.

[Managed Cloudflare](/services/managed-cloudflare/) starts with the same kind of review, then stays. The audit ends when the report is delivered. If you want a packaged version with a defined list of checks, it is in the [shop](/shop/). The contents of a custom audit are the list above, scoped to the estate you actually have, which is why a custom one is proposed rather than priced in an article.

The umbrella, if you want to see where this stage sits next to the others, is [Cloudflare OS](/cloudflare-os/).
