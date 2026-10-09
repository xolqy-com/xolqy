---
title: "Cloudflare vs AWS"
description: Where Cloudflare is the cheaper, simpler edge, and where AWS remains the right place for the system of record, the memory, and the model catalogue.
publishedAt: 2026-10-09
audience: both
topics: [Research, AWS, Architecture]
readingMinutes: 6
relatedServices: [cloudflare-migration, websites-and-applications, performance-and-delivery]
type: research
researchRole: spoke
series: edge-cloud-landscape
seriesOrder: 1
---

AWS is the default this comparison has to beat, not a cartoon of “the old cloud”. It already has regions, a CDN, object storage, serverless functions and a large model catalogue. Cloudflare wins specific rows. It does not win the platform.

The map this page belongs to is [the edge cloud landscape](/insights/research/edge-cloud-landscape/). The practical version of “do not rebuild for sport” is [in front, or a rebuild](/insights/cloudflare-in-front-or-rebuild-on-workers/).

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Choose Cloudflare for the network, for object storage whose internet egress is not billed, and for request-shaped code that fits in 128&nbsp;MB. Leave the system of record on AWS when it is already a regional database, and leave Lambda in place when the function needs gigabytes of memory.</p>
  <p>CloudFront already exists to stop you paying S3’s internet rate. A Cloudflare migration that ignores that is a mood, not a saving.</p>
</aside>

## Where Cloudflare is stronger

**Internet egress on objects.** R2 Standard is $0.015 per GB-month, and the pricing page charges nothing for internet egress on Standard or Infrequent Access. Infrequent Access still charges $0.01 per GB to read the data back. S3’s pricing page, in a worked example, puts data transfer out from Europe (Ireland) to the internet at $0.09 per GB, and it exempts the first 100 GB a month across services, with the exceptions the page lists. Transfer from S3 to CloudFront is one of the paths the page says is not charged. [1](#r1) [8](#r8) [9](#r9)

So the saving is real when bytes leave S3 straight to the internet. It is not automatic when CloudFront is already in front. CloudFront’s own pricing page says transfer from AWS origins to CloudFront is waived, and it sells flat-rate plans that bundle CDN, WAF and some edge compute. This page does not quote a CloudFront per-gigabyte viewer rate. The pay-as-you-go table was not in a form we could cite cleanly. [9](#r9)

**A legible request price, if the isolate fits.** Workers Paid is a $5 monthly minimum, then 10 million requests and 30 million CPU-milliseconds included, then $0.30 and $0.02 per extra million. Waiting on the network is not CPU time. Lambda’s page charges $0.20 per million requests and then duration in GB-seconds, with a free tier of one million requests and 400,000 GB-seconds, and memory from 128 MB to 10,240 MB. For a small handler, Workers can be the simpler meter. For a heavy one, Lambda’s memory knob is the product Cloudflare does not have. [2](#r2) [3](#r3) [7](#r7)

**One network in front of an AWS origin.** Hyperdrive’s docs are explicit that Workers can query Postgres or MySQL that already lives on AWS, without moving the rows. That is the migration we will actually recommend: application and cache on Cloudflare, database left alone. [5](#r5)

## Where Cloudflare is weaker

**Memory and job shape.** 128 MB and a CPU ceiling of 5 minutes on the paid plan (30 seconds unless you raise it) is the Workers box. Lambda’s upper memory is 10,240 MB. Containers on Cloudflare exist and are billed apart from Workers, including egress at $0.025 per GB in North America and Europe after 1 TB included. They are not a reason to pretend Workers are EC2. [2](#r2) [3](#r3) [7](#r7) [11](#r11)

**The database.** D1 is SQLite, capped at 10 GB per database on the paid plan, and the limits page says the cap cannot be raised. AWS is where a regional relational database already is, for a great many teams. Hyperdrive is the bridge. Replacing that database with D1 to “be on Cloudflare” is not supported by D1’s own limits. [4](#r4) [5](#r5)

**Models.** Workers AI is 50+ open-source models, billed in neurons at $0.011 per 1,000 after 10,000 free a day. Bedrock’s pricing page lists providers including Anthropic, OpenAI, Meta, Mistral, Amazon and others, and describes batch inference at 50% below on-demand. If the requirement is one of those hosted models, Bedrock is the product. A Worker can still call it. That is an AWS bill plus a Cloudflare bill, which should be said out loud. [6](#r6) [10](#r10)

**Residency and the region.** AWS’s infrastructure page says 124 Availability Zones in 39 geographic regions, and that each region is built from multiple zones. The regions documentation, the same day, says an account is provided 34 regions. Cloudflare’s network page lists 348 cities and also claims every service runs in every data centre. D1 is SQLite with a 10 GB cap, not that city list, and the Data Localization Suite, which restricts where HTTPS is decrypted, is an enterprise add-on. An auditor who wants the system of record inside one AWS region is not answered by a city count. [4](#r4) [12](#r12) [13](#r13) [14](#r14) [15](#r15)

**Breadth.** This research did not inventory AWS. The absence of a citation for a particular AWS service is not a claim that Cloudflare has it. The working assumption: if the workload is a specialised AWS service the team already runs, Cloudflare does not replace it.

**S3 compatibility is partial.** R2’s compatibility page documents unsupported operations, object lock among them. Pointing an SDK at R2 is a real migration path for ordinary objects. It is not a promise that every S3 feature comes with you. [16](#r16)

## What to move, and what to leave

Move the hostname, the cache and the small dynamic handlers when the Workers limits fit, and move public objects when the S3-to-internet line is the one you pay. Leave IAM, the regional database, and any job that needs Lambda’s memory. Reach the database with Hyperdrive if the code moves and the rows must not. [5](#r5)

That staged shape is also the one in [which Cloudflare products a business needs](/insights/which-cloudflare-products-a-business-needs/) and in the [Workers](/wiki/workers/), [R2](/wiki/r2/) and [Hyperdrive](/wiki/hyperdrive/) entries. If the outcome of the comparison is “yes, design it as one Cloudflare system”, the offer is [Cloudflare OS](/cloudflare-os/), not a new price invented for this page.

## The rest of this series

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/) (hub)
- [Cloudflare vs Azure](/insights/research/cloudflare-vs-azure/)
- [Cloudflare vs Google Cloud](/insights/research/cloudflare-vs-google-cloud/)
- [Cloudflare vs Vercel and Netlify](/insights/research/cloudflare-vs-vercel-netlify/)
- [Cloudflare vs Fastly and Akamai](/insights/research/cloudflare-vs-fastly-akamai/)
- [Cloudflare vs Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/)

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/r2/pricing/">Pricing · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/pricing/">Pricing · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r3">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/limits/">Limits · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r4">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/limits/">Limits · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r5">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/">Overview · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-09.</li>
  <li id="r6">Cloudflare. <a href="https://developers.cloudflare.com/workers-ai/platform/pricing/">Pricing · Cloudflare Workers AI docs</a>. Accessed 2026-10-09.</li>
  <li id="r7">Amazon Web Services. <a href="https://aws.amazon.com/lambda/pricing/">AWS Lambda pricing</a>. Accessed 2026-10-09.</li>
  <li id="r8">Amazon Web Services. <a href="https://aws.amazon.com/s3/pricing/">Amazon S3 pricing</a>. Accessed 2026-10-09.</li>
  <li id="r9">Amazon Web Services. <a href="https://aws.amazon.com/cloudfront/pricing/">Amazon CloudFront pricing</a>. Accessed 2026-10-09.</li>
  <li id="r10">Amazon Web Services. <a href="https://aws.amazon.com/bedrock/pricing/">Amazon Bedrock pricing</a>. Accessed 2026-10-09.</li>
  <li id="r11">Cloudflare. <a href="https://developers.cloudflare.com/containers/platform/pricing/">Pricing · Cloudflare Containers docs</a>. Accessed 2026-10-09.</li>
  <li id="r12">Amazon Web Services. <a href="https://aws.amazon.com/about-aws/global-infrastructure/">Global Infrastructure</a>. Accessed 2026-10-09.</li>
  <li id="r13">Amazon Web Services. <a href="https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html">AWS Regions</a>. Accessed 2026-10-09.</li>
  <li id="r14">Cloudflare. <a href="https://www.cloudflare.com/network/">Cloudflare Global Network</a>. Accessed 2026-10-09.</li>
  <li id="r15">Cloudflare. <a href="https://developers.cloudflare.com/data-localization/">Data Localization Suite</a>. Accessed 2026-10-09.</li>
  <li id="r16">Cloudflare. <a href="https://developers.cloudflare.com/r2/api/s3/api/">S3 API compatibility · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
</ol>
