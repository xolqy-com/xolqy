---
title: Which Cloudflare products a business actually needs
description: A decision guide for choosing Cloudflare products by the job in front of you, not by the catalogue. Most businesses need a short list. The rest can wait until a real feature calls for them.
publishedAt: 2026-10-09T12:00:00.000Z
audience: both
topics: ["Cloudflare OS", Architecture, Workers]
readingMinutes: 6
relatedServices: [websites-and-applications, performance-and-delivery, security-and-zero-trust, ai-and-automation]
---

Cloudflare’s catalogue is large enough to paralyse a sensible person. Workers, Pages, D1, KV, R2, Durable Objects, Queues, Workflows, Hyperdrive, Vectorize, Access, Tunnel, WAF, Images, Email, and a row of buttons in the dashboard that all sound like they should be on. Turning them all on is not an architecture. It is a bill and a surface area.

[Cloudflare OS Implementation by Xolqy](/cloudflare-os/) is the map: five layers, and a product only lands in a layer when a job requires it. Cloudflare OS itself is Cloudflare’s open-source workspace. This article is the shorter version, as questions.

## What are you publishing?

**A site that is mostly pages.** [Workers with Static Assets](/wiki/static-assets/) is the default for a new build. Prerender what you can, run a Worker for the routes that need data, and stop there. [Cache](/wiki/cache/) still matters for anything dynamic. [Images](/wiki/images/) matter when the site carries real media. [Web Analytics](/wiki/web-analytics-observability/) measures Core Web Vitals without a consent banner. The longer case for and against this model is [why a website belongs on Workers](/insights/websites-on-cloudflare-workers/).

**A site you are not ready to rebuild.** Put Cloudflare in front of it. DNS, TLS, cache, WAF, image optimisation. The application stays where it is. That is a days-long job, not a rewrite. The choice between the two is [in front, or a rebuild](/insights/cloudflare-in-front-or-rebuild-on-workers/).

**An existing site already on Pages.** Leave it if it is stable. New projects start on Workers with Static Assets. [Pages](/wiki/pages/) still works; it is the earlier platform.

## What are you storing?

Apply one sentence and ignore the rest of the catalogue until it fails: **D1 for records, KV for configuration, R2 for files.**

[D1](/wiki/d1/) when the thing has an identity, relationships and a correct current value. [KV](/wiki/kv/) when it is read far more often than it changes and can be briefly stale. [R2](/wiki/r2/) when it is bytes: media, uploads, exports, backups. [Durable Objects](/wiki/durable-objects/) when many requests must agree about one piece of state, such as a cart, a session or a counter. The failure modes of getting this wrong are written out in [D1, KV or R2](/insights/d1-vs-kv-vs-r2/).

If the database already exists and has to stay, do not invent a migration to justify the diagram. [Hyperdrive](/wiki/hyperdrive/) pools and caches an existing Postgres or MySQL so Workers can use it. The data move, if it ever happens, is a later decision with real numbers.

## What are you protecting?

Every public site gets the edge in front: [DDoS protection](/wiki/ddos-protection/), a [WAF](/wiki/waf/) started in log mode and then enforced, and [rate limiting](/wiki/rate-limiting/) on logins, forms and APIs. [Turnstile](/wiki/turnstile/) on the specific actions that bots abuse, with the token checked on the server.

Internal tools, staging and admin are a different question. They do not belong on the public internet behind a shared password. [Access](/wiki/zero-trust-access/) checks identity. [Tunnel](/wiki/cloudflare-tunnel/) removes the origin’s public address. That pair is [Zero Trust without a VPN](/insights/zero-trust-without-a-vpn/).

## What are you automating?

If the job is “answer from our own content”, you need retrieval before you need a model. [Vectorize](/wiki/vectorize/) holds the embeddings. [Workers AI](/wiki/workers-ai/) generates them and the answer. [AI Gateway](/wiki/ai-gateway/) logs, caches and limits the calls. [AI Search](/wiki/ai-search/) is the managed version when you want the outcome without owning the pipeline. [Vectorize, explained](/insights/cloudflare-vectorize-explained/) covers which one.

If the job is “do these steps and do not lose them”, a chat interface is usually the wrong first build. [Queues](/wiki/queues/) accept the work. [Workflows](/wiki/workflows/) run the steps with retries. [Queues or Workflows](/insights/queues-versus-workflows/) is the split.

## What is the smallest honest stack?

| Situation | Start with | Leave for later |
| --- | --- | --- |
| Marketing site, new | Workers, Static Assets, Web Analytics | D1, until a form needs a record |
| WordPress you will keep | DNS, TLS, cache, WAF, Images | A Workers frontend |
| Application with records and files | Workers, D1, R2, rate limiting | Vectorize, until search fails |
| Admin on the public internet | Access, and Tunnel if the origin should disappear | Gateway, until the team’s devices are in scope |
| Repeated manual routing of email or documents | Queues and Workflows | A conversational assistant |

The [performance](/services/performance-and-delivery/) and [security](/services/security-and-zero-trust/) services exist because “on” and “configured” are different. Argo, tiered cache and Bot Management are in that second category: available, and adopted when the traffic justifies them, not on day one.

## When you do not know yet

Two routes that do not require a catalogue.

The [solution finder](/labs/#solution-finder) on the labs page takes a short description and answers from our service pages, with a rule-based fallback when AI is unavailable. It recommends a service. It does not invent a stack.

The [Cloudflare Audit](/contact/?interest=audit) looks at what you already run and writes down what to change, in what order. [What an audit covers](/insights/what-a-cloudflare-audit-covers/) is the contents of that document. The free [health check](/health-check/) is the outside view of one domain, and it says so.

If the question is really “should this be one system or a pile of toggles”, start at [Cloudflare OS Implementation by Xolqy](/cloudflare-os/) and then pick the row in the table. You can buy one service. The map is there so that service does not ignore the layer next to it.
