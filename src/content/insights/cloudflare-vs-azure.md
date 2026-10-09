---
title: "Cloudflare vs Azure"
description: Azure is the residency boundary and the Microsoft identity stack. Cloudflare is the network in front of it, not a replacement for the region.
publishedAt: 2026-10-09
audience: both
topics: [Research, Azure, Architecture]
readingMinutes: 6
relatedServices: [cloudflare-migration, security-and-zero-trust, websites-and-applications]
type: research
researchRole: spoke
series: edge-cloud-landscape
seriesOrder: 2
---

Azure’s advantage in this comparison is not a faster CDN. It is that a geography is a residency boundary Microsoft documents, and that the identity, the office estate and the OpenAI deployment often already sit in the same tenant. Cloudflare does not replace that tenant. It can stand in front of it.

This is a spoke of [the edge cloud landscape](/insights/research/edge-cloud-landscape/). How placement actually works on Cloudflare is [where the data lives](/insights/where-cloudflare-keeps-your-data/).

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Cloudflare is the stronger edge when the pain is internet egress, a published Zero Trust price, or a Worker that fits the isolate. Azure is the stronger cloud when the system of record must stay inside an Azure geography, when the team already runs Entra, or when the model has to be an Azure OpenAI deployment with a stated data boundary.</p>
  <p>The two region counts Microsoft publishes do not match. This page cites both and does not average them.</p>
</aside>

## Where Cloudflare is stronger

**Egress, stated plainly.** R2 does not charge internet egress. Standard storage is $0.015 per GB-month. Azure’s bandwidth page prices internet egress on the Microsoft Premium Global Network at nothing for the first 100 GB a month, then $0.087 per GB for the next 10 TB from North America or Europe to any destination. Asia, Australia, the Middle East and Africa start the paid tiers at $0.12 per GB; South America at $0.181. The page also says transfer from an Azure origin to Azure Front Door Standard or Premium is free. As with CloudFront on AWS, “use the CDN” is Microsoft’s own way to take the origin-egress line off. R2 still removes the line rather than routing around it. [1](#r1) [6](#r6)

**A small function with a short price list.** Workers Paid starts at $5 a month with 10 million requests included. Azure Functions’ consumption plan includes one million requests and 400,000 GB-seconds a month per subscription, and the pricing page says the storage account created with the function app is not inside that grant. For a modest HTTP handler, both are cheap. The difference that matters is the ceiling: Workers stay at 128 MB of memory. [2](#r2) [3](#r3) [7](#r7)

**Zero Trust with a number on the page.** Access is free under 50 users and $7 per user each month on pay-as-you-go. That is a ZTNA product you can buy without a custom quote. It is not Entra, and it is not a claim about Microsoft 365. The mechanism is the one in [Zero Trust without a VPN](/insights/zero-trust-without-a-vpn/) and the [Access](/wiki/zero-trust-access/) entry. [8](#r8)

**Leaving the database in Azure.** Hyperdrive connects Workers to Postgres or MySQL, and the docs name Azure as one of the places that database may already be. The rows do not have to move for the request path to. [4](#r4)

## Where Cloudflare is weaker

**The geography is the product.** Microsoft Learn says a geography is the data-residency boundary, that Azure has over 70 regions, and that you pick a region inside the geography when residency matters. The Azure infrastructure marketing page says “80+” regions. Both pages were live on 9 October 2026. Cloudflare can restrict which data centres decrypt HTTPS, but only through the Data Localization Suite, which the docs call an enterprise-only add-on. Single-country Regional Services, except the United States, come with an SLA exclusion: no automatic failover outside the country. [9](#r9) [10](#r10) [11](#r11) [12](#r12)

**Identity you already operate.** This page does not cite an Entra price, because we did not use one. The qualitative point is enough: a company whose employees, groups and conditional access already live in Microsoft’s directory does not gain simplicity by inventing a second identity plane for the same people. Access can still gate a single internal application. It should not be sold as a replacement directory.

**Functions that are not isolates.** The consumption grant is similar in spirit to Lambda’s free tier, and the memory story is not. Workers do not offer a memory setting. Microsoft’s own functions guidance says a function app should use a storage account in the same region for performance, and that the portal will only offer an existing account in that region. Moving that function to a 128 MB global isolate is a redesign, not a lift. [3](#r3) [7](#r7) [16](#r16)

**Models with a data boundary.** Azure OpenAI’s pricing page describes global, data-zone and regional deployments, the regional option stated as “up to 27 regions”, plus provisioned throughput and a batch discount the page puts at 50% for global standard. Foundry’s models page describes a catalogue it states as 11,000+ models. Workers AI is 50+ open-source models at $0.011 per 1,000 neurons. Those are different products. Use Azure when the requirement is a named deployment boundary for a frontier model. Use Workers AI when an open model at the edge is actually the requirement. [13](#r13) [14](#r14) [15](#r15)

**D1 is still 10 GB of SQLite.** Nothing about Azure changes the D1 cap. A system of record that already lives in an Azure region should stay there unless you have a separate reason to shard it into 10 GB databases. This spoke does not price those Azure databases. [5](#r5)

## Who should pick which

An organisation whose compliance story is “the data stays in this Azure geography”, and whose users already authenticate with Microsoft, should keep Azure as the system of record and treat Cloudflare as the edge: DNS, cache, WAF, and Access only where it replaces a VPN for a specific app. [10](#r10) [11](#r11)

A team without that constraint, paying Azure bandwidth on objects that are not going through Front Door, should price R2 against that $0.087 line before they renew. [1](#r1) [6](#r6)

If the conclusion is a designed Cloudflare system rather than a single product, it is [Cloudflare OS](/cloudflare-os/). The published shop offers are unchanged.

## The rest of this series

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/) (hub)
- [Cloudflare vs AWS](/insights/research/cloudflare-vs-aws/)
- [Cloudflare vs Google Cloud](/insights/research/cloudflare-vs-google-cloud/)
- [Cloudflare vs Vercel and Netlify](/insights/research/cloudflare-vs-vercel-netlify/)
- [Cloudflare vs Fastly and Akamai](/insights/research/cloudflare-vs-fastly-akamai/)
- [Cloudflare vs Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/)

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/r2/pricing/">Pricing · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/pricing/">Pricing · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r3">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/limits/">Limits · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r4">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/">Overview · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-09.</li>
  <li id="r5">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/limits/">Limits · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r6">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/pricing/details/bandwidth/">Bandwidth pricing</a>. Accessed 2026-10-09.</li>
  <li id="r7">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/pricing/details/functions/">Azure Functions pricing</a>. Accessed 2026-10-09.</li>
  <li id="r8">Cloudflare. <a href="https://www.cloudflare.com/en-ca/plans/zero-trust-services/">Zero Trust and SASE plans</a>. Accessed 2026-10-09.</li>
  <li id="r9">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/explore/global-infrastructure">Azure global infrastructure</a>. Accessed 2026-10-09.</li>
  <li id="r10">Microsoft. <a href="https://learn.microsoft.com/en-us/azure/reliability/regions-overview">What are Azure regions?</a> Accessed 2026-10-09.</li>
  <li id="r11">Cloudflare. <a href="https://developers.cloudflare.com/data-localization/">Data Localization Suite</a>. Accessed 2026-10-09.</li>
  <li id="r12">Cloudflare. <a href="https://developers.cloudflare.com/data-localization/regional-services/">Regional Services · Data Localization Suite</a>. Accessed 2026-10-09.</li>
  <li id="r13">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/pricing/details/azure-openai/">Azure OpenAI Service pricing</a>. Accessed 2026-10-09.</li>
  <li id="r14">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/pricing/details/ai-foundry-models/microsoft/">Foundry Models pricing</a>. Accessed 2026-10-09.</li>
  <li id="r15">Cloudflare. <a href="https://developers.cloudflare.com/workers-ai/platform/pricing/">Pricing · Cloudflare Workers AI docs</a>. Accessed 2026-10-09.</li>
  <li id="r16">Microsoft. <a href="https://learn.microsoft.com/en-us/azure/azure-functions/storage-considerations">Storage considerations for Azure Functions</a>. Accessed 2026-10-09.</li>
</ol>
