---
title: "Cloudflare vs Fastly and Akamai"
description: Three edge networks, three designs. Fastly publishes purge time and a short map. Akamai publishes the largest POP count. Cloudflare publishes the developer platform.
publishedAt: 2026-10-09
audience: both
topics: [Research, Delivery, Architecture]
readingMinutes: 6
relatedServices: [performance-and-delivery, security-and-zero-trust, cloudflare-migration]
type: research
researchRole: spoke
series: edge-cloud-landscape
seriesOrder: 5
---

Fastly and Akamai are the comparisons that stay inside the edge, which makes them stricter. Cloudflare cannot wave “but we have a database” and leave. On delivery, cache and the shape of the network, they are peers. On everything else a business runs, they are not the same shelf.

This is a spoke of [the edge cloud landscape](/insights/research/edge-cloud-landscape/). The short definition of a Cloudflare location is the [edge and POPs](/wiki/edge-and-pops/) entry. Cache behaviour, separate from the vendor comparison, is the [cache](/wiki/cache/) entry.

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Choose Fastly when the problem is cache control and purge time, and you accept a shorter city list in exchange for larger POPs. Choose Akamai when the buying motion is enterprise delivery and the printed edge count is the requirement. Choose Cloudflare when the edge also has to be the application platform: Workers, R2, Access, a database you can actually name.</p>
  <p>Akamai’s product page for EdgeWorkers does not publish a list price. This page does not invent one.</p>
</aside>

## Where Cloudflare is stronger

**The platform beside the POP.** Workers, R2, D1, Durable Objects, Access and Workers AI are products with public docs and, for the ones priced in this series, public rates. Fastly’s pricing page sells Compute by the request and the vCPU-millisecond. That is a real edge computer. It is not a relational database, a Zero Trust price list, and an object store with free internet egress in one account. Akamai’s EdgeWorkers page describes JavaScript on the edge and a 30-day trial. It does not describe that wider platform, and it does not print a rate. [1](#r1) [2](#r2) [3](#r3) [6](#r6) [7](#r7) [8](#r8)

**A city list you can read, with the caveat in the next section.** Cloudflare’s network page says 348 cities across 8 regions. The regional counts on that page add up to the same 348. Fastly’s map, updated 30 June 2026, does not state a total. Counting the city names and excluding four marked coming soon gives 86. Some of those cities are marked as multiple POPs, so the POP count is higher and unpublished. Akamai prints 4,400+ edge PoPs. Cloudflare is not the density winner against that number. It is the density winner against the Fastly city list, and density is not the only virtue Fastly claims. [4](#r4) [5](#r5) [7](#r7)

**Self-serve, including the security product.** Access is free under 50 users and $7 per user each month after that. A team that needs to put an admin tool behind identity this week can do it without a sales cycle. Akamai’s motion, on the evidence of a product page that asks you to start a trial and wait for a conversation, is the opposite. [9](#r9)

**Objects, if delivery is also a storage problem.** R2 at $0.015 per GB-month with no internet egress fee is a storage product that happens to sit on the same network. Fastly and Akamai will deliver bytes that live somewhere else, and you will pay that somewhere else for the origin read, or you will pay them for delivery. We are not citing a Fastly or Akamai per-gigabyte delivery rate. Fastly’s pricing page, as we used it, was the Compute rate card. Akamai’s was not a rate card at all. [2](#r2)

## Where Cloudflare is weaker

**Purge and the cache story Fastly tells.** Fastly’s network page states a mean purge time under 150 milliseconds with Instant Purge, “as of December 31, 2025”, and sub-millisecond time to first byte at the 99th percentile. Those are Fastly’s figures, not a test we ran. Their argument for the short map is technical: fewer, larger POPs, SSD-backed, so more of the catalogue stays in cache. If your incident history is “the purge was too slow” or “hit ratio collapsed because the content is spread over too many small caches”, Fastly’s design is aimed at you and Cloudflare’s 348-city line is not an answer. [5](#r5)

**Akamai’s footprint, if footprint is the requirement.** 4,400+ edge PoPs, 1+ PBps of edge capacity and 1,200+ networks is what Akamai prints. EdgeWorkers runs JavaScript on that platform, with EdgeKV named on the same page for data at cache speed. For a lightweight rewrite, a header, or a localisation decision in front of an origin you will not move, that distribution is the product. Workers are a more capable computer, at 128 MB against whatever limit Akamai sets, and we are not quoting an EdgeWorkers memory cap because the product page we read does not print one. Third-party blogs do. They are not a source for this series. [7](#r7) [8](#r8)

**Cloudflare’s own “every service, every data centre” line does not survive the product docs.** The network page says it, and the same page says GPUs are still rolling out. D1’s overview is SQLite, with read replicas rather than a writable copy in every city. Workers AI’s overview describes serverless GPUs and an open-model catalogue. It does not say that catalogue runs in every city. Regional Services exist so that some customers can stop traffic being processed in most of those cities, and they are an enterprise add-on. A buyer who needs a pure delivery network with a long enterprise contract will find Fastly and Akamai speaking that language more directly. [3](#r3) [4](#r4) [10](#r10) [11](#r11)

**Delivery price.** We do not have a citable public dollar-per-gigabyte for Fastly delivery or for Akamai. Anyone who tells you a winner on “CDN cost” from this page is ahead of the sources. Compute rates we do have: Fastly includes 10 million Compute requests and 100 million vCPU-milliseconds a month, then $0.50 per million requests and $0.05 per million vCPU-milliseconds in the first paid band. Workers Paid includes 10 million requests and 30 million CPU-milliseconds after $5, then $0.30 and $0.02 per million. The units are not identical. CPU time on Workers excludes network wait; Fastly’s meter is vCPU-milliseconds. Do not divide one price by the other and call it a ratio. [1](#r1) [6](#r6)

## Who should pick which

A media or commerce team whose problem is purge, hit ratio and a cache configuration they want in code should evaluate Fastly on those terms, and should treat Cloudflare’s developer platform as a separate question.

A global enterprise already inside an Akamai contract, with delivery and a security bundle negotiated together, should not rip that out because Workers are pleasant. The bar is a specific failure of the current network, not a preference for a dashboard.

A team that wants the edge to be where the application lives, with storage and access in the same account, is the Cloudflare buyer. That is [Cloudflare OS Implementation by Xolqy](/cloudflare-os/), and it is a different purchase from a CDN renewal. Performance work that stays on the current network is the [performance and delivery](/services/performance-and-delivery/) service, not a forced migration.

## The rest of this series

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/) (hub)
- [Cloudflare vs AWS](/insights/research/cloudflare-vs-aws/)
- [Cloudflare vs Azure](/insights/research/cloudflare-vs-azure/)
- [Cloudflare vs Google Cloud](/insights/research/cloudflare-vs-google-cloud/)
- [Cloudflare vs Vercel and Netlify](/insights/research/cloudflare-vs-vercel-netlify/)
- [Cloudflare vs Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/)

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/pricing/">Pricing · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/r2/pricing/">Pricing · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r3">Cloudflare. <a href="https://developers.cloudflare.com/d1/">Overview · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r4">Cloudflare. <a href="https://www.cloudflare.com/network/">Cloudflare Global Network</a>. Accessed 2026-10-09.</li>
  <li id="r5">Fastly. <a href="https://www.fastly.com/network-map">Network map</a>. Accessed 2026-10-09. Map last updated 30 June 2026, as printed on the page.</li>
  <li id="r6">Fastly. <a href="https://www.fastly.com/pricing">Pricing</a>. Accessed 2026-10-09.</li>
  <li id="r7">Akamai. <a href="https://www.akamai.com/why-akamai/global-infrastructure">Global infrastructure</a>. Accessed 2026-10-09.</li>
  <li id="r8">Akamai. <a href="https://www.akamai.com/products/serverless-computing-edgeworkers">EdgeWorkers</a>. Accessed 2026-10-09.</li>
  <li id="r9">Cloudflare. <a href="https://www.cloudflare.com/en-ca/plans/zero-trust-services/">Zero Trust and SASE plans</a>. Accessed 2026-10-09.</li>
  <li id="r10">Cloudflare. <a href="https://developers.cloudflare.com/data-localization/">Data Localization Suite</a>. Accessed 2026-10-09.</li>
  <li id="r11">Cloudflare. <a href="https://developers.cloudflare.com/workers-ai/">Cloudflare Workers AI</a>. Accessed 2026-10-09.</li>
</ol>
