---
title: "Cloudflare vs Google Cloud"
description: Google Cloud is the regional data platform and the Gemini bill. Cloudflare is the network and the egress-free object store in front of it.
publishedAt: 2026-10-09
audience: both
topics: [Research, "Google Cloud", Architecture]
readingMinutes: 6
relatedServices: [cloudflare-migration, ai-and-automation, performance-and-delivery]
type: research
researchRole: spoke
series: edge-cloud-landscape
seriesOrder: 3
---

Google Cloud’s case is a region you can name, a storage price you can read, and an AI stack aimed at Gemini and the rest of its model garden. Cloudflare’s case is the same one it has against the other hyperscalers: the network is the product, and object egress is not a line on the R2 bill. Neither replaces the other.

This spoke sits under [the edge cloud landscape](/insights/research/edge-cloud-landscape/). Firebase, which is Google’s developer-facing backend, is a different comparison: [Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/).

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Use Cloudflare when the site or the files are the problem and a 128&nbsp;MB Worker is enough computer. Use Google Cloud when the data, the analytics job or the model has to live in a named region, or when Cloud Run’s memory and duration are the shape of the code.</p>
  <p>Cloud Storage’s internet egress starts at $0.12 per GiB on the first public tier we could cite. R2’s internet egress is $0. That comparison is solid. A total-cost comparison that includes CDN offload is not, because this page does not quote a Cloud CDN rate.</p>
</aside>

## Where Cloudflare is stronger

**Object egress.** R2 Standard storage is $0.015 per GB-month and internet egress is free, including Infrequent Access, which still charges $0.01 per GB on retrieval. Google Cloud Storage’s general network table prices data transfer to worldwide destinations, excluding Asia and Australia, at $0.12 per GiB from 0 to 10 tebibytes a month, then $0.11, then $0.08. Inbound transfer is free. The page is in gibibytes. We are not converting that into a “ten times more expensive” slogan, because your destination, your CDN and your free tier change the bill. The direction of the gap, for bytes that go straight to the internet, is not ambiguous. [1](#r1) [5](#r5)

**Request-shaped code on a global network.** Workers Paid includes 10 million requests a month after a $5 minimum, and does not bill wall-clock time spent waiting on I/O. Cloud Run is regional. You pick a region, customer data for that resource stays in the region you selected, and multi-region serving is something you assemble with an external HTTP load balancer. Outbound internet traffic from Cloud Run uses the premium network tier, with 1 GiB free inside North America per month. For a handler that is mostly waiting on a datastore and must run beside it, Cloud Run’s region is a feature. For a handler that should answer from the city nearest the visitor, Workers are the default and Cloud Run is the extra design. [2](#r2) [3](#r3) [6](#r6) [7](#r7)

**A database you refuse to move.** Hyperdrive’s overview names Google Cloud as a place an existing Postgres or MySQL database can stay. D1 does not have to be part of the design. [4](#r4)

## Where Cloudflare is weaker

**Regions are the unit of data.** Google’s locations page says you can deploy across 43 regions and 130 zones, and that a new region launches with Compute Engine, Kubernetes Engine, Cloud Storage, Persistent Disk, Cloud SQL, VPC, Cloud VPN, Key Management and Secret Manager, with further products, including Cloud Run, expected within six months. That is a regional cloud with a stated minimum catalogue. Cloudflare’s 348 cities are cache and compute locations of a different kind, and the Data Localization Suite is how you stop HTTPS being decrypted in all of them. It is an enterprise add-on, not the default. [8](#r8) [9](#r9) [10](#r10)

**Cloud Run is a larger computer.** Workers memory is 128 MB, with CPU time capped at 5 minutes on the paid plan unless you leave the default of 30 seconds. Cloud Run bills vCPU and memory per request or per instance lifetime, in two price tiers by region, and can serve from more than one region only once you put a load balancer in front. We are not quoting a Cloud Run vCPU rate here. The pricing page is long, regional, and easy to mis-copy. The architectural point does not need the rate: Cloud Run is how Google expects you to run a container in a region, and Workers are how Cloudflare expects you to run an isolate everywhere. Containers on Cloudflare are a third option, with their own egress prices, documented on the hub. [2](#r2) [3](#r3) [6](#r6)

**Analytics and the model garden.** BigQuery, the rest of the data stack, and Gemini are why teams are on Google Cloud. Workers AI documents 50+ open-source models and a neuron price. It does not document Gemini as a hosted Google model. If Gemini, or a provisioned endpoint on Google’s agent platform, is the requirement, the bill is Google’s. A Worker in front of it is a network decision, not an AI decision. We did not lift a single Gemini token price into this page. The pricing surface is a catalogue, and a partial quote would pretend to be a comparison. [11](#r11) [12](#r12)

**SQL that is actually SQL at size.** D1’s paid limit is 10 GB per database and cannot be raised. Google’s region launch list includes Cloud SQL. Hyperdrive is the supported way to keep that database and still run Workers. [4](#r4) [13](#r13)

**Lock-in runs both ways.** Leaving BigQuery is a project. Leaving a Worker is a different project. R2 at least speaks enough of the S3 API that an SDK can be repointed, with the gaps the compatibility page lists. Cloud Storage is its own API. Neither story is “portable by default”. [14](#r14)

## Who should pick which

A content or product team whose Google Cloud bill is dominated by storage egress to the public internet should price R2 before they buy another committed-use discount. A team whose asset is a regional dataset, a Cloud SQL instance, or a Gemini deployment should keep it there and, if the website in front is the slow or expensive part, put Cloudflare on the hostname. [1](#r1) [4](#r4) [5](#r5)

The designed version of that second step is [Cloudflare OS](/cloudflare-os/). Product definitions for the Cloudflare side are [Workers](/wiki/workers/), [R2](/wiki/r2/) and [Workers AI](/wiki/workers-ai/).

## The rest of this series

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/) (hub)
- [Cloudflare vs AWS](/insights/research/cloudflare-vs-aws/)
- [Cloudflare vs Azure](/insights/research/cloudflare-vs-azure/)
- [Cloudflare vs Vercel and Netlify](/insights/research/cloudflare-vs-vercel-netlify/)
- [Cloudflare vs Fastly and Akamai](/insights/research/cloudflare-vs-fastly-akamai/)
- [Cloudflare vs Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/)

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/r2/pricing/">Pricing · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/pricing/">Pricing · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r3">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/limits/">Limits · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r4">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/">Overview · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-09.</li>
  <li id="r5">Google Cloud. <a href="https://cloud.google.com/storage/pricing">Cloud Storage pricing</a>. Accessed 2026-10-09.</li>
  <li id="r6">Google Cloud. <a href="https://cloud.google.com/run/pricing">Cloud Run pricing</a>. Accessed 2026-10-09.</li>
  <li id="r7">Google Cloud. <a href="https://docs.cloud.google.com/run/docs/locations">Cloud Run locations</a>. Accessed 2026-10-09.</li>
  <li id="r8">Google Cloud. <a href="https://cloud.google.com/about/locations">Global locations: regions and zones</a>. Accessed 2026-10-09.</li>
  <li id="r9">Cloudflare. <a href="https://www.cloudflare.com/network/">Cloudflare Global Network</a>. Accessed 2026-10-09.</li>
  <li id="r10">Cloudflare. <a href="https://developers.cloudflare.com/data-localization/">Data Localization Suite</a>. Accessed 2026-10-09.</li>
  <li id="r11">Cloudflare. <a href="https://developers.cloudflare.com/workers-ai/">Cloudflare Workers AI</a>. Accessed 2026-10-09.</li>
  <li id="r12">Google Cloud. <a href="https://cloud.google.com/products/gemini-enterprise-agent-platform/pricing">Gemini Enterprise Agent Platform pricing</a>. Accessed 2026-10-09.</li>
  <li id="r13">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/limits/">Limits · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r14">Cloudflare. <a href="https://developers.cloudflare.com/r2/api/s3/api/">S3 API compatibility · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
</ol>
