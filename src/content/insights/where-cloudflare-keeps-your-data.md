---
title: Where Cloudflare keeps your data, and where it does not
description: Workers run near the visitor. D1, R2 and Durable Objects can be pinned. KV is cached everywhere. Data localisation on Cloudflare is a design choice with published limits, not a checkbox.
publishedAt: 2026-10-06T12:00:00.000Z
audience: both
topics: ["Cloudflare OS", Data, D1]
readingMinutes: 6
relatedServices: [websites-and-applications, cloudflare-migration]
---

“Can the data stay in the EU?” is a yes-or-no question that the platform does not answer with a yes-or-no. Some stores take a location hint or a jurisdiction. The code that handles the request runs near the visitor, which is the point of the edge and also the thing a residency conversation has to include. [Cloudflare OS Implementation by Xolqy](/cloudflare-os/) treats that as an architecture constraint, written down in the audit, not as a slogan on the proposal.

This article stays inside what we already publish. Where a control exists, it is named. Where the platform does not pin something, that is named too.

## Workers run near the visitor

A [Worker](/wiki/workers/) executes in the Cloudflare location closest to the request. That is why a prerendered page is fast in more than one country. It is also why “all processing in one country” is not the default shape of the platform.

The Workers wiki is explicit about the limit: anything that must run inside one specific country for legal reasons, without Cloudflare’s data localisation products, does not belong on Workers. Data Localization Suite features on enterprise plans control where traffic is inspected. They are an enterprise control, not a toggle on a free zone, and they do not by themselves relocate every store you use.

If the requirement is “the person reading the marketing page must be answered from a nearby city”, the edge is the feature. If the requirement is “no processing of this record outside one jurisdiction”, the design has to say which bytes those are and which product holds them.

## What you can place

**D1.** A database has a primary location. Reads can be served from replicas; the Sessions API keeps a request’s reads consistent with its own writes. Location hints are how you ask for a primary region. The hint is a design input, not a guarantee we will oversell. Size, write throughput and Time Travel windows are in the [D1](/wiki/d1/) entry. The decision to use D1 at all is in [D1, KV or R2](/insights/d1-vs-kv-vs-r2/).

**Durable Objects.** An object runs in one place at a time. Location hints exist here too. That suits a session, a cart or a per-tenant coordinator you want created in a region. It does not suit a design that sends every user through one object, hint or not, because a single instance is a bottleneck. See [Durable Objects](/wiki/durable-objects/).

**R2.** Buckets take a location hint and a jurisdiction option, for example the EU, which keeps the bucket’s data in that jurisdiction. Objects are files, not rows. [R2](/wiki/r2/) is the store for media, exports and archives, and egress to the internet is free, which is a cost fact rather than a residency fact. Both can be true.

**An existing database.** If the system of record already sits in a region and must stay there, do not move it to win an argument about elegance. [Hyperdrive](/wiki/hyperdrive/) connects Workers to Postgres or MySQL, with pooling near the database. A [Tunnel](/wiki/cloudflare-tunnel/) reaches a private database that has no public address. The application can move. The rows stay. That staged shape is described in [in front, or a rebuild](/insights/cloudflare-in-front-or-rebuild-on-workers/).

## What you should not expect to pin

**KV** caches a value in Cloudflare locations after it is read. That is why reads are fast everywhere, and why KV is the wrong place for a record that must remain in one jurisdiction or remain transactionally correct. Writes propagate; the last writer wins; there is no transaction. Configuration and flags belong there. Personal data that a regulator has located does not.

**The cache.** [Cached](/wiki/cache/) HTML and assets are copies at the edge, for speed. A page that contains data you are not allowed to replicate globally should not be cached globally. The cache key and the bypass rules are part of the residency design, not a performance afterthought.

**Analytics and logs.** [Web Analytics](/wiki/web-analytics-observability/) is built to avoid cookies and fingerprinting. It is still processing. Workers logs and Logpush have their own destinations. If a policy restricts where telemetry may go, that is a line in the audit, not an assumption.

## How an audit writes this down

We ask which data has a location rule, who imposed it, and what “location” means in that rule: storage, inspection, or both. Then we map each store.

| Data | Default on Cloudflare | Control that exists |
| --- | --- | --- |
| Request handling | Nearest location to the visitor | Data Localization Suite on enterprise, for inspection |
| Relational records | Primary location you hint | D1 location hint; or leave the database and use Hyperdrive |
| Coordinated state | One object, one place | Durable Object location hint |
| Files | Bucket location and jurisdiction | R2 location hint and jurisdiction, such as the EU |
| Configuration | Cached in many locations | Do not put located data in KV |
| A database you already have | Wherever it is | Hyperdrive and, if it is private, Tunnel |

The output is a sentence per store: this data lives here, this control applies, this limit remains. If the limit means the workload should not move, the audit says that. [Websites and applications](/services/websites-and-applications/) and [migrations](/services/cloudflare-migration/) inherit the sentence. They do not rediscover it during the build.

[Cloudflare OS Implementation by Xolqy](/cloudflare-os/) includes this because a system that is silent about where bytes rest is not a system a regulated business can adopt. The platform can do a precise version of “stay in this region”. It cannot do a vague one. The work is deciding which version you actually need before the first binding is declared.
