---
title: "Cloudflare vs Vercel and Netlify"
description: Vercel and Netlify host the framework. Cloudflare is the network, the WAF and the data stores they are not. The framework host is often the right first choice.
publishedAt: 2026-10-09
audience: both
topics: [Research, Architecture, Websites]
readingMinutes: 6
relatedServices: [websites-and-applications, performance-and-delivery]
type: research
researchRole: spoke
series: edge-cloud-landscape
seriesOrder: 4
---

Vercel and Netlify are not clouds in the hyperscaler sense, and they are not CDNs in the Fastly sense. They are the place a framework gets deployed. Comparing them with Cloudflare as if they were the same kind of thing produces bad advice. This page separates the jobs.

It is a spoke of [the edge cloud landscape](/insights/research/edge-cloud-landscape/). The on-site argument for a site that actually runs on Workers is [why the next website belongs on Workers](/insights/websites-on-cloudflare-workers/).

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>If the team’s work is a framework deploy, Vercel’s defaults are the better developer experience, and Netlify’s functions are a credible alternative. Cloudflare becomes the better platform when the site also needs object storage without internet egress, a SQL database, Zero Trust in front of an admin tool, or a Worker that is the application rather than a plugin.</p>
  <p>Vercel Functions run in one region unless you say otherwise. That single fact is the technical gap. It is not, by itself, a reason to leave.</p>
</aside>

## Where Cloudflare is stronger

**The network is included, not bolted on.** Workers are the same system as the cache, the DNS and the WAF. Vercel’s limits page says Functions run in a single region by default, `iad1`, which you can change, and that Pro and Enterprise can run in more than one region. Fluid compute’s own page says multi-region functions go up to three on Pro and “all” on Enterprise. A global anycast isolate is not what you get on day one. [1](#r1) [6](#r6) [7](#r7)

**Data that is not an add-on.** D1, R2, KV and Hyperdrive are Cloudflare products with public prices. R2’s internet egress is free; Standard storage is $0.015 per GB-month. D1 is SQLite with a 10 GB cap. Hyperdrive reaches a Postgres or MySQL database you already have. Vercel and Netlify are not that data platform. Netlify’s credit-based plan table does list a “Netlify Database” with project and branch quotas, so it is no longer accurate to say Netlify has no database product. It is still not the thing you pick when the database is the product. The decision procedure for Cloudflare’s own stores is [D1, KV or R2](/insights/d1-vs-kv-vs-r2/). [2](#r2) [3](#r3) [4](#r4) [5](#r5) [8](#r8)

**Security in front of the whole hostname.** Access has a published price: free under 50 users, then $7 per user each month. A framework host can put authentication in the application. It is not a Zero Trust network. The [WAF](/wiki/waf/) and [Access](/wiki/zero-trust-access/) entries describe the Cloudflare side. [9](#r9)

**Memory is the wrong boast, so here is the real one.** Cloudflare does not win on function size. It wins when the code is small and the network behaviour is the product: cache rules, HTML at the edge, a form handler, a rewrite. That is the shape of the sites in our [work](/work/) and of the [Pages](/wiki/pages/) and [Workers](/wiki/workers/) entries.

## Where Cloudflare is weaker

**Framework hosting is their job.** Vercel Functions on Fluid compute offer full Node.js coverage, 2 GB of memory on Hobby and 4 GB on Pro and Enterprise, a default duration of 300 seconds, a Pro maximum of 800 seconds, and an extended maximum of 1,800 seconds that the limits page marks as beta. Concurrency scales to 30,000 on Hobby and Pro. Workers offer 128 MB and a CPU ceiling of 5 minutes on the paid plan, defaulting to 30 seconds. If the framework expects a Node server and a few gigabytes, Vercel is the fit and Workers are the compromise. [1](#r1) [6](#r6)

**The meter is easier to understand on Vercel, until it is not.** Hobby includes 4 hours of active CPU, 360 GB-hours of provisioned memory and 1 million invocations. Pro starts at $0.128 per CPU-hour, $0.0106 per GB-hour and $0.60 per million invocations. Active CPU, like Workers CPU time, does not count waiting on I/O. We did not find, on the pages used for this series, a single public bandwidth-overage rate we were willing to put next to R2’s egress line. So this page will not declare Cloudflare cheaper for a content site on Vercel. Check the plan’s bandwidth inclusion against the traffic. Do not take our word for a number we did not cite. [6](#r6) [10](#r10)

**Netlify’s function model is GB-hours, not isolates.** On credit-based plans, functions cost 10 credits per GB-hour. Default memory is 1024 MB. Pro and Enterprise can raise a function to 4096 MB, with vCPU rising in proportion. We are not turning credits into dollars. The page does not state a dollar price per credit in the section we used. What it does state is enough: Netlify will run a larger function than a Worker, and it will bill the wall-clock size of it. [8](#r8) [11](#r11)

**Preview environments and the framework loop.** Both hosts are built around git-connected deploys and preview URLs. Cloudflare can do previews too, and we are not citing a feature matrix for them, because “who has the nicer pull-request deploy” was not something the pricing pages could settle. If that loop is the team’s whole platform, stay. The [Workers Builds](/wiki/workers-builds/) entry is what Cloudflare actually offers, without a beauty contest.

**D1 and R2 do not make Cloudflare a framework host.** A team that wants Next.js, auth from a third-party library, and a Postgres database will fight Workers’ compatibility flag and D1’s 10 GB cap. Hyperdrive plus a hosted Postgres is the grown-up version of that fight. It is still more moving parts than a Vercel project connected to a database URL. [4](#r4) [5](#r5)

## Who should pick which

Choose Vercel or Netlify when the deliverable is the site, the team lives in the framework, and nobody has asked for a WAF policy, a private admin network, or a storage bill dominated by egress.

Choose Cloudflare when those asks have arrived, or when you would rather the application, the cache and the files were one account. The offer for designing that account is [Cloudflare OS Implementation by Xolqy](/cloudflare-os/). The introduction, if you want the decision in writing before a build, is the [€600 session](/shop/#os-introduction) already on the shop.

## The rest of this series

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/) (hub)
- [Cloudflare vs AWS](/insights/research/cloudflare-vs-aws/)
- [Cloudflare vs Azure](/insights/research/cloudflare-vs-azure/)
- [Cloudflare vs Google Cloud](/insights/research/cloudflare-vs-google-cloud/)
- [Cloudflare vs Fastly and Akamai](/insights/research/cloudflare-vs-fastly-akamai/)
- [Cloudflare vs Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/)

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/limits/">Limits · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/pricing/">Pricing · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r3">Cloudflare. <a href="https://developers.cloudflare.com/r2/pricing/">Pricing · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r4">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/limits/">Limits · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r5">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/">Overview · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-09.</li>
  <li id="r6">Vercel. <a href="https://vercel.com/docs/functions/limitations">Vercel Functions limits</a>. Accessed 2026-10-09.</li>
  <li id="r7">Vercel. <a href="https://vercel.com/docs/fluid-compute">Fluid compute</a>. Accessed 2026-10-09.</li>
  <li id="r8">Netlify. <a href="https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/">Credit-based pricing plans</a>. Accessed 2026-10-09.</li>
  <li id="r9">Cloudflare. <a href="https://www.cloudflare.com/en-ca/plans/zero-trust-services/">Zero Trust and SASE plans</a>. Accessed 2026-10-09.</li>
  <li id="r10">Vercel. <a href="https://vercel.com/pricing">Pricing</a>. Accessed 2026-10-09.</li>
  <li id="r11">Netlify. <a href="https://docs.netlify.com/build/functions/usage-and-billing">Functions usage and billing</a>. Accessed 2026-10-09.</li>
</ol>
