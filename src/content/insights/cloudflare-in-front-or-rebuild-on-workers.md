---
title: "Cloudflare in front, or a rebuild on Workers?"
description: Two different projects get called a Cloudflare migration. One puts the platform in front of the site you have. The other moves the application onto Workers. Here is how to tell which you need.
publishedAt: 2026-10-08T12:00:00.000Z
audience: both
topics: ["Cloudflare OS", Migration, Workers]
readingMinutes: 6
relatedServices: [cloudflare-migration, websites-and-applications]
---

“Move us to Cloudflare” describes two projects that do not take the same amount of time, money or nerve.

The first puts Cloudflare in front of the site you already have. DNS, TLS, cache, WAF. The application does not change. For a WordPress, Laravel or other origin that is staying, this is days.

The second moves the workload. Pages are prerendered to [Static Assets](/wiki/static-assets/), dynamic routes run on [Workers](/wiki/workers/), files go to R2, records go to D1 or stay behind [Hyperdrive](/wiki/hyperdrive/). The old server is switched off at the end. That is a project with an architecture stage.

[Cloudflare OS](/cloudflare-os/) treats them as two layers of the same system. You can do the first without the second. You should not do the second without knowing why the first is not enough. Often the honest sequence is both, in that order.

## In front: what you get, and what you do not

Cloudflare becomes the DNS provider, terminates TLS, caches what the rules allow, and filters requests before they reach the origin. Image optimisation can sit in the same path. Mail is a separate question and has to be inventoried before anyone touches a record. The [migration runbook](/insights/cloudflare-migration-runbook/) is the operational version: TTLs, redirects as code, protection in log mode, a timed rollback.

What you do not get is a simpler application. The origin still needs patching, still has a size, and still generates HTML on every uncached request. A cache that is too timid hides the gain. A cache that is too aggressive hides bugs, including logged-in pages served to the wrong person. [Cache rules](/wiki/cache/) are a design, not a toggle.

This is the right project when the site is fine and the host is the problem: slow outside one region, expensive to scale, thin on security. It is also the right project when a rebuild has been quoted as a long engagement and the business needs the protective layer this quarter.

WordPress is the usual example. Accelerating the existing origin leaves WordPress untouched. Rebuilding the frontend, often in Astro, with WordPress as a headless source, is the other project. The first is days. The second is a project. We say which one you need rather than selling the larger one by default.

## A rebuild: what has to be true first

A Workers site is not a place to install the old CMS and hope. The runtime is JavaScript and WebAssembly on V8, not a long-lived server with a disk. Most modern frameworks have a Cloudflare adapter. Native binaries, unbounded jobs and a local filesystem do not come with you. Image work that needed a native library moves to [Images](/wiki/images/). Work that takes longer than a request moves to [Queues and Workflows](/insights/queues-versus-workflows/).

The questions that decide it are in [why a website belongs on Workers](/insights/websites-on-cloudflare-workers/): where the visitors are, how much of the site is actually dynamic, and what the team maintains today. If every visitor is in one city on a fast connection and a team already runs the server well, the gain is smaller. Still real, and sometimes not worth a rewrite this year.

[Pages](/wiki/pages/) is the earlier platform. Sites already on it can stay. New projects start on Workers with Static Assets, which has the same Git-connected builds through [Workers Builds](/wiki/workers-builds/) and the rest of the platform in the same deployment.

## Keeping the origin on purpose

Not every database should move. [Hyperdrive](/wiki/hyperdrive/) lets Workers talk to an existing Postgres or MySQL, with pooling near the database and caching for reads. The site can move first. The data move is a later decision. A private database does not need a public address; a [Tunnel](/wiki/cloudflare-tunnel/) reaches it.

That pattern matters for [where data is allowed to live](/insights/where-cloudflare-keeps-your-data/). If a residency rule is attached to the database, the application can still run at the edge while the database stays in the region that satisfies the rule.

The origin can also stay invisible. A tunnel means attackers who try to skip Cloudflare and hit the server directly have nothing public to hit. During a migration it is how a legacy origin stays reachable to Cloudflare and unreachable to everyone else.

## How the choice is made

The audit writes it down per site: front, move, or rebuild. The inventory is domains, DNS, mail, certificates, applications and the things that break quietly (hard-coded IPs, licence-bound software, cron jobs, URLs that bring the traffic). The architecture names the target, the redirect map, and the rollback, before anything moves.

Both paths are [Cloudflare migration](/services/cloudflare-migration/). A rebuild that is really a new product is [websites and applications](/services/websites-and-applications/). [Cloudflare OS](/cloudflare-os/) is the reason they are specified together: the firewall, the cache and the account ownership are part of the fronting project, not an afterthought once the new site is pretty.

Rankings survive either path when every URL that matters is mapped and tested. Content and links do not change because the nameserver did. Broken URLs do. That test is part of the runbook, not a hope.
