---
title: "The edge cloud landscape: Cloudflare vs the world"
description: A sourced comparison of Cloudflare with hyperscalers, edge networks, application hosts and backend platforms. Ten dimensions, four verdicts, and the places Cloudflare is the weaker choice.
publishedAt: 2026-10-09
audience: both
topics: ["Research", "Cloudflare OS", Architecture]
readingMinutes: 22
relatedServices: [websites-and-applications, cloudflare-migration, performance-and-delivery, security-and-zero-trust, managed-cloudflare]
type: research
researchRole: hub
series: edge-cloud-landscape
seriesOrder: 0
---

This is the hub of a research series, not a product pitch. It compares Cloudflare with the platforms a team actually chooses between: the three hyperscalers, the edge networks, the application hosts, and the backend-as-a-service products. Each comparison has its own page. The point of this one is the map, the method, and the verdicts that the sources support.

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Cloudflare is a global network that also runs application code, object storage without internet-egress fees, a SQLite database with a hard size cap, and a Zero Trust access product with a published per-user price. It is not a substitute for a hyperscaler’s regional catalogue, and it is not a Postgres host.</p>
  <p>Use it when the workload fits a 128&nbsp;MB isolate, when object egress is the painful line on the bill, or when DNS, cache and access control should be the same system as the application. Keep AWS, Azure or Google Cloud when the system of record, the compliance boundary or the GPU training job already lives there. Keep Supabase or Firebase when the product is a database with auth, not a network. Keep Vercel when the framework deploy is the job and the network is not.</p>
  <p>Nothing below is a measurement we ran. Prices are public list prices on 9 October 2026. Negotiated enterprise discounts are not published, so they are not guessed.</p>
</aside>

## Methodology

Sources are vendor documentation and pricing pages, read on 9 October 2026. Each factual claim in this series points at a numbered reference. Access dates are that day. We did not run latency tests, load tests or bill reconstructions against a live account.

Three rules kept the writing honest.

**List price, not a deal.** AWS, Azure, Google Cloud, Fastly and Akamai all sell through contracts. A number on this page is a public rate or a figure the vendor prints on its own site. If the public page does not state a number, the comparison stays qualitative.

**Do not collapse different counts.** AWS’s infrastructure page says 39 regions and 124 Availability Zones, and also “750+” CloudFront points of presence. The regions documentation, on the same day, says an account is provided 34 regions. Azure’s infrastructure page says “80+” regions; Microsoft Learn says “over 70”. Cloudflare’s network page says 348 cities and, elsewhere on the same page, “330+”. Those are reported as published, not averaged.

**No invented results.** There are no customer names, no before-and-after percentages, and no “typical saving”. The only Xolqy prices mentioned are ones already on the [shop](/shop/#cloudflare-os): the Cloudflare OS package at $2,500 (compare-at $5,000) and the [€600 introduction](/shop/#os-introduction).

Where Cloudflare is the weaker fit, the spoke pages say so in their own section, not in a footnote.

## Comparison matrix

The cells are summaries. Every figure in them is repeated, with its source, in the notes under the table. “The limit” is the constraint this research treats as real, not a slogan.

<div class="matrix">
<table>
  <thead>
    <tr>
      <th>Dimension</th>
      <th>Cloudflare, as documented</th>
      <th>The limit this research accepts</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Compute</td>
      <td>Workers isolates. Paid plan from $5 a month: 10 million requests and 30 million CPU-milliseconds included, then $0.30 and $0.02 per extra million. Memory 128 MB. CPU default 30 seconds, ceiling 5 minutes.</td>
      <td>Not a virtual machine. Lambda memory runs to 10,240 MB. Vercel Functions reach 4 GB on Pro. Containers on Cloudflare are a separate meter, and their egress is billed.</td>
    </tr>
    <tr>
      <td>Storage and egress</td>
      <td>R2 Standard storage $0.015 per GB-month. Internet egress is free on Standard and Infrequent Access. Infrequent Access still charges a retrieval fee.</td>
      <td>S3, Cloud Storage and Azure Blob charge internet egress. R2’s S3 API is not full S3. Workers themselves are not billed for egress; Containers are.</td>
    </tr>
    <tr>
      <td>Database</td>
      <td>D1 is SQLite. Paid databases cap at 10 GB and that cap cannot be raised. Hyperdrive pools and caches queries to an existing Postgres or MySQL database, including ones on AWS, Google Cloud and Azure.</td>
      <td>D1 is the wrong primary store for a large relational system. Supabase is Postgres. The hyperscalers sell managed Postgres, MySQL and their own proprietary databases at sizes D1 does not claim.</td>
    </tr>
    <tr>
      <td>Security and Zero Trust</td>
      <td>Access is free for teams under 50 users, then $7 per user each month on the pay-as-you-go plan. Data Localization Suite is an enterprise add-on that chooses where HTTPS is decrypted.</td>
      <td>A hyperscaler’s identity system and regional catalogue are already how many enterprises pass audits. Single-country Regional Services drop automatic failover outside that country.</td>
    </tr>
    <tr>
      <td>AI inference</td>
      <td>Workers AI: 50+ open-source models, 10,000 neurons a day free, then $0.011 per 1,000 neurons on the paid plan. Some named models require a paid method.</td>
      <td>Bedrock, Azure AI Foundry and Google’s agent platform sell a wider model catalogue, including frontier models Workers AI does not host. Workers AI is not that catalogue.</td>
    </tr>
    <tr>
      <td>Agents and MCP</td>
      <td>Cloudflare’s Agents docs describe a durable runtime: identity, local SQL, scheduling, and MCP as a way to call external tools.</td>
      <td>The runtime is real and it is Cloudflare-shaped. Model choice still depends on Workers AI or on some other provider you call yourself.</td>
    </tr>
    <tr>
      <td>Network footprint</td>
      <td>The network page lists 348 cities across 8 regions. The same page also says “330+” and prints two different figures for how close 95% of users are.</td>
      <td>City count is not the same thing as an AWS region or an Akamai edge POP. Akamai prints 4,400+ edge PoPs. Fastly argues for fewer, larger POPs and does not print one POP total.</td>
    </tr>
    <tr>
      <td>Pricing model</td>
      <td>A $5 Workers minimum, then usage. R2 bills storage and operations, not internet egress. Zone plans for DNS, CDN and WAF are a separate price list we do not restate here.</td>
      <td>Hyperscaler bills are a stack of service meters plus egress. Vercel bills active CPU, provisioned memory and invocations. Fastly bills Compute requests and vCPU time, and sells delivery separately.</td>
    </tr>
    <tr>
      <td>Lock-in</td>
      <td>R2 speaks the S3 API, with documented gaps. Hyperdrive leaves the database where it is. Workers, D1, Durable Objects and Agents do not have a second implementation.</td>
      <td>Leaving a Worker is a rewrite. Leaving an EC2 instance or a Postgres database is a different kind of work, often smaller. Both are lock-in. They are not the same lock-in.</td>
    </tr>
    <tr>
      <td>Developer experience</td>
      <td>One network, Wrangler, and bindings for the data stores. The platform docs show a <code>nodejs_compat</code> flag when a library needs it. The memory cap does not move.</td>
      <td>Vercel is the smoother path for a framework that already assumes its hosting. AWS is the deeper console, and the more complicated one. Cloudflare is neither of those.</td>
    </tr>
  </tbody>
</table>
</div>

### Compute

On the Workers Paid plan the account minimum is $5 a month. That plan includes 10 million requests and 30 million CPU-milliseconds, then charges $0.30 per additional million requests and $0.02 per additional million CPU-milliseconds. Duration while the isolate waits on the network is not a Workers charge. CPU time defaults to 30 seconds and can be raised to 5 minutes on paid; cron and queue handlers have their own ceilings. Free is 100,000 requests a day and 10 milliseconds of CPU. Memory is 128 MB on both plans. A Worker has a one-second startup-time limit. [1](#r1) [2](#r2)

Cloudflare’s Workers product page describes the runtime as having no cold starts. The limits page, read the same day, still publishes the startup-time limit and the 128 MB cap. Both statements are Cloudflare’s. This research does not treat “no cold starts” as a measurement. [2](#r2) [3](#r3)

Containers are the escape hatch for a workload that needs a real container, and they are priced differently. On the paid plan, memory, CPU and disk have included amounts and then per-second rates. Egress from Containers is not free: North America and Europe are $0.025 per GB after 1 TB included, with other regions at $0.05 or $0.04 and a 500 GB allotment. A container is also fronted by a Worker and a Durable Object, which have their own meters. [1](#r1) [19](#r19)

Lambda’s pricing page charges $0.20 per million requests, with a free tier of one million requests and 400,000 GB-seconds a month, and lets you set memory from 128 MB to 10,240 MB. That is a different shape: more memory, a duration charge, and a regional place the function runs. Azure Functions’ consumption plan includes one million requests and 400,000 GB-seconds, and the storage account it creates is billed separately. Cloud Run is regional, with request-based or instance-based billing, and its outbound internet transfer uses the premium network tier, with 1 GiB free inside North America. Vercel Functions on Fluid compute go to 2 GB on Hobby and 4 GB on Pro. [22](#r22) [29](#r29) [34](#r34) [40](#r40)

The practical line: if the code is request-shaped and fits in 128 MB, Workers are a coherent price. If it needs gigabytes of memory, a long CPU-heavy job, or a GPU training run, Cloudflare is the wrong primary computer. Containers narrow that gap and reintroduce an egress line the Workers price list had removed.

### Storage and egress

R2 Standard storage is $0.015 per GB-month. Class A operations are $4.50 per million, Class B $0.36 per million. Internet egress is free for Standard and for Infrequent Access. Infrequent Access storage is $0.01 per GB-month and charges $0.01 per GB to retrieve data. The free tier is 10 GB-month, one million Class A and ten million Class B, on Standard only. [4](#r4)

That egress line is the cleanest difference with object storage on the hyperscalers. The S3 pricing page’s worked example states a data-transfer-out charge of $0.09 per GB from Europe (Ireland) to the internet, and the page also says the first 100 GB a month out to the internet is free across services, with exceptions it lists for China and GovCloud. Transfer from S3 to CloudFront is among the transfers the page says are not charged. Google Cloud Storage’s general network price, for the first tier to worldwide destinations excluding Asia and Australia, is $0.12 per GiB. Azure’s bandwidth page gives the first 100 GB a month free, then $0.087 per GB for the next 10 TB from North America or Europe. [23](#r23) [28](#r28) [33](#r33)

Two limits stop this becoming a slogan. First, R2’s S3 compatibility page says implementation is incomplete: object lock and website redirects are among the operations marked unsupported, and the get-started guide’s advice is to point an S3 SDK at a different endpoint, not to assume every S3 feature exists. Second, “Cloudflare does not charge egress” is false for Containers, as the compute note above says. Workers and R2 are the products whose price lists waive internet egress. [5](#r5) [6](#r6) [19](#r19)

Buckets can take a location hint and a jurisdiction, including the EU, via the S3 API. That is a residency control for the objects, not a promise that every other Cloudflare product stays in the same place. [44](#r44)

### Database

D1 is a serverless database with SQLite’s SQL semantics. On the paid plan a single database holds at most 10 GB, and the limits page says that cap cannot be increased. The design Cloudflare describes is many smaller databases: up to 50,000 per paid account. Reads include 25 billion rows a month, then $0.001 per million rows. Writes include 50 million rows, then $1.00 per million. Storage includes 5 GB, then $0.75 per GB-month. D1’s own pricing notes say it does not add an egress charge. Free caps a database at 500 MB, with a 5 GB account total. [7](#r7) [8](#r8) [9](#r9)

That is a good database for tenant-shaped or modest relational data, which is also how this site’s own writing treats [D1, KV and R2](/insights/d1-vs-kv-vs-r2/). It is a bad database for a system of record that expects a large Postgres, extensions, or more than 10 GB in one database. The [D1 wiki entry](/wiki/d1/) is the short version of the same limit.

Hyperdrive is the grown-up answer when the rows should stay where they are. It accelerates queries from Workers to existing Postgres or MySQL, including databases on AWS, Google Cloud, Azure, Neon and PlanetScale, and Postgres-compatible systems such as CockroachDB. Paid-plan queries through Hyperdrive are unlimited; the free plan allows 100,000 a day. Caching and pooling are included, not a second meter. [1](#r1) [10](#r10)

Supabase’s pricing page is a Postgres product: the Pro plan starts at $25 a month, with 8 GB of disk included per project and $10 of compute credit. Firebase’s Spark plan includes Firestore up to 1 GiB, with daily read and write quotas, and the Blaze plan then follows Google Cloud pricing. Neither is a global anycast application network. They are better databases than D1 for the jobs they were built for. The spoke on [Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/) goes further. [42](#r42) [43](#r43)

KV, for completeness, is on the same Workers price list: the paid plan includes 10 million key reads and 1 GB stored, then $0.50 per million reads and $0.50 per GB-month. It is not a record store. The [KV](/wiki/kv/) entry and the [data-placement article](/insights/where-cloudflare-keeps-your-data/) say why. [1](#r1)

### Security and Zero Trust

Cloudflare Access, on the Zero Trust plans page, is free for teams under 50 users. Pay-as-you-go is $7 per user each month. The contract plan is a custom annual price. The same family of plans covers gateway, CASB and DLP, with DLP on the free and pay-as-you-go plans described as free for the first 10 GB and then $1 per GB-month. [16](#r16)

That is a published ZTNA price, which is unusual, and it is the product behind our note on [Zero Trust without a VPN](/insights/zero-trust-without-a-vpn/). The [Access wiki entry](/wiki/zero-trust-access/) defines the mechanism. It does not, by itself, satisfy a regulator.

The Data Localization Suite is how Cloudflare offers a choice of where keys are stored, where metadata is kept, and which data centres may decrypt HTTPS. The docs label it an enterprise-only paid add-on. Regional Services can restrict processing to a region. For a single country other than the United States, Cloudflare’s own SLA note says there is no automatic failover if in-country capacity is unavailable, because traffic is not allowed to leave. [17](#r17) [18](#r18)

An enterprise that already runs workloads inside an AWS region, an Azure geography or a Google Cloud region, and whose audit is built around that boundary, does not become compliant by moving the edge. The hyperscalers’ compliance catalogues are broader than anything this page counted, because we did not count them. The honest recommendation is in the verdicts below, and in [where Cloudflare keeps data](/insights/where-cloudflare-keeps-your-data/).

WAF, bot and cache behaviour on a zone are real Cloudflare products. This page does not restate Free, Pro, Business or Enterprise zone prices, because those plan pages were not the sources for the figures above. The [WAF](/wiki/waf/) entry is the product definition.

### AI inference

Workers AI’s overview says the catalogue is 50+ open-source models, invoked from Workers or over the API, alongside AI Gateway and Vectorize. Pricing is $0.011 per 1,000 neurons. Everyone gets 10,000 neurons a day at no charge. Above that, the Workers Paid plan is required. The pricing page also names models, including some Moonshot, Z.ai and DeepSeek models, that need a paid billing method or prepaid AI Gateway credits. [11](#r11) [12](#r12)

Amazon Bedrock’s pricing page sells on-demand tokens across a provider list that includes Anthropic, OpenAI, Meta, Mistral, DeepSeek, Google, Amazon and others, with batch inference at a discount the page describes as 50% against on-demand. Azure AI Foundry’s models page describes a catalogue it states as 11,000+ models, and Azure OpenAI is priced as its own service with global, data-zone and regional deployment types. Google’s locations page is not an AI price list; its generative pricing lives on the agent-platform pricing pages, which are a catalogue rather than a single rate this research will pretend to summarise. [25](#r25) [30](#r30) [31](#r31)

So: Workers AI is a real inference product with a short, open-model list and a neuron meter. It is the weaker choice when the requirement is a named frontier model, a provisioned throughput commitment, or a data-zone deployment of that model. Calling another provider from a Worker, or through AI Gateway, is available and is a different bill. [11](#r11) [12](#r12)

The [Workers AI](/wiki/workers-ai/) and [Vectorize](/wiki/vectorize/) entries, and the [Vectorize article](/insights/cloudflare-vectorize-explained/), are the on-site explanations. This series does not add a new price for them.

### Agents and MCP

Cloudflare’s Agents documentation describes sessions with a durable identity, local SQL storage, scheduling and recoverable execution, plus channels (chat, email, voice, Slack, webhooks) and tools that include a browser, a sandbox, AI Search and MCP. The MCP page shows an agent connecting to an external MCP server and passing those tools into a model call, including a Workers AI model. The starter it documents uses Workers AI by default and says other providers can be swapped in. [13](#r13) [14](#r14)

That is a platform for agents, not a claim that the agents are better. The state lives in Cloudflare’s runtime. Moving it means moving the state model, which is the lock-in row of the matrix. Bedrock, Foundry and Google’s agent platform are the equivalent shelves on the hyperscalers, with the model catalogues in the previous section. We did not find a public, comparable “price per agent” that would survive a citation, so this row stays qualitative on price.

The essay on [agents, MCP and Cloudflare OS](/insights/cloudflare-os-kai-agentic-mcp/) is the opinionated companion. This page does not repeat its commercial argument.

### Network footprint

Cloudflare’s network page, read on 9 October 2026, says “348 cities · 8 regions” above the city lists. Adding the regional counts printed beside those lists (54, 64, 57, 19, 33, 71, 36, 14) comes to 348. The same page’s marketing lines also say “330+”. On distance, the page shows both “250 ms to 95% of the world’s Internet users” and a later claim that 95% of the connected population is within 50 milliseconds. This research reports the contradiction and does not pick a latency number. [15](#r15)

AWS’s global infrastructure page says the cloud spans 124 Availability Zones in 39 geographic regions, with announced plans for more, and “750+” CloudFront POPs plus 15 regional edge caches. The regions documentation says there are currently 34 regions provided by an account. A region is not a Cloudflare city, and a CloudFront POP is not an Availability Zone. [20](#r20) [21](#r21)

Azure’s infrastructure page says “80+ Azure regions”. Microsoft Learn’s regions overview says Azure provides over 70 regions, and that a geography is the data-residency boundary. Google Cloud’s locations page says 43 regions and 130 zones. [26](#r26) [27](#r27) [32](#r32)

Fastly’s network map, last updated 30 June 2026, argues for fewer, more powerful POPs. It does not print a single POP total. Counting the city names on that page, and leaving out four marked “coming soon”, gives 86 cities. Asterisks mark cities with more than one POP, so 86 is not a POP count. The page states 622 Tbps of connected capacity, and a mean purge time under 150 ms with Instant Purge, “as of December 31, 2025”. It also states sub-millisecond TTFB at the 99th percentile. Those performance lines are Fastly’s published claims, not results we measured. [35](#r35)

Akamai’s global infrastructure page prints 4,400+ edge PoPs, 1+ PBps of edge capacity and 1,200+ networks. EdgeWorkers is JavaScript at that edge, with a 30-day trial on the product page. The product page does not publish a list price. [37](#r37) [38](#r38)

Density and capability are different axes. Akamai prints the largest edge count of the pages we read. Cloudflare prints a city count and says, on that same page, that every service runs in every data centre. Product docs complicate the slogan: D1’s overview describes read replicas, so the writable database is not “every city”; the same network page says GPUs are still rolling out; Regional Services exist specifically to stop some processing from happening everywhere. Workers AI is the inference product on those GPUs. Its overview does not say the catalogue is in every city. [7](#r7) [11](#r11) [15](#r15) [17](#r17)

### Pricing model

Cloudflare’s developer-platform bill is a minimum plus meters: Workers, KV, D1, R2, Durable Objects, Containers, Workers AI. Several of those meters are documented above. Zone plans are extra and were not priced in this series. [1](#r1) [4](#r4)

AWS, Azure and Google Cloud bill per service, and internet egress is a first-class line, with the examples in the storage section. CloudFront’s pricing page adds another shape: flat-rate plans that bundle CDN, WAF, DNS, logs and some edge compute, and a statement that data transfer from AWS origins to CloudFront is waived. This page does not quote a CloudFront per-gigabyte rate, because the pay-as-you-go table was not in a form we could cite cleanly beside those plan descriptions. [24](#r24)

Vercel’s price list for Functions is active CPU time, provisioned memory and invocations. Hobby includes 4 CPU-hours, 360 GB-hours and 1 million invocations. Pro starts at $0.128 per CPU-hour, $0.0106 per GB-hour and $0.60 per million invocations. Fastly Compute includes 10 million requests and 100 million vCPU-milliseconds, then $0.50 per million requests and $0.05 per million vCPU-milliseconds in the first paid bands, with lower rates further up the table. Delivery is a different Fastly product; this series does not cite a Fastly per-gigabyte delivery rate. [36](#r36) [39](#r39)

Netlify’s credit-based plans bill function compute in GB-hours at 10 credits per GB-hour. The functions page says the default memory is 1024 MB and that paid plans can raise it to 4096 MB. We are not converting those credits into dollars, because the page we used does not state a dollar value per credit. [41](#r41)

### Lock-in

R2 reduces storage lock-in relative to a purely proprietary API, because S3 SDKs work against its endpoint, and it increases honesty about lock-in by documenting the missing operations. Hyperdrive reduces database lock-in by leaving Postgres or MySQL in place. [5](#r5) [6](#r6) [10](#r10)

Workers, D1, Durable Objects and the Agents runtime do not travel. A Durable Object’s storage API is only reachable from inside the object. The paid-plan request price on the Workers price list is $0.15 per million after one million included, and duration is wall-clock while the object is active, billed as if 128 MB is allocated. That is a coordination primitive, and it is also a rewrite if you leave. [1](#r1)

AWS lock-in is real too. The difference is that a large part of an AWS estate can be a virtual machine, a Kubernetes cluster or a Postgres database, which other clouds also run. A Worker is a better trade when you want the network and accept the rewrite, and a worse trade when portability of the compute is a requirement you actually have.

### Developer experience

The platform is one account and a CLI, which is the experience [Cloudflare OS](/cloudflare-os/) is built around and which the [Workers](/wiki/workers/) and [Wrangler](/wiki/wrangler/) entries describe. Hyperdrive’s docs set `nodejs_compat` so that Node database drivers can run. That flag is not a promise of an unrestricted Node server: the memory and CPU limits still apply. [2](#r2) [10](#r10)

Vercel’s limits page is explicit that Functions run in a single region by default (`iad1`), with full Node.js coverage, and that Pro can add regions. If the team’s daily work is a framework deploy, that default is a feature. If the team’s daily work is a global cache, a WAF and a Worker in the same change, Cloudflare is the tighter loop and Vercel is the extra vendor. The [Vercel and Netlify spoke](/insights/research/cloudflare-vs-vercel-netlify/) holds that comparison.

AWS is the other extreme: more services than a person can hold in their head, which is also why a team already on AWS should not “move to Cloudflare” as a mood. The spoke says what to move and what to leave.

## Verdicts

These follow from the matrix. They are not a ranking of companies.

### A startup

If the product is a site or an API, the data is modest or tenant-shaped, and nobody is asking for a region-pinned system of record, Cloudflare is the simpler bill: one network, no R2 internet-egress line, and a request price that is legible. [1](#r1) [4](#r4)

If the first screen of the product is Postgres, row-level security, auth and realtime, Supabase matches that shape and D1 does not. Put Cloudflare in front later if the cache and the WAF become the problem. Do not start by pretending D1 is Postgres. [7](#r7) [8](#r8) [42](#r42)

If the team is shipping a framework and the hosting is the only infrastructure they want to think about, Vercel’s defaults are the path of least resistance, until bandwidth, a WAF or a long-lived data model forces a second decision. [40](#r40)

### A content site

Object egress is the line that hurts on S3, Cloud Storage and Azure Blob, at the public rates cited above. R2’s price list removes that line and keeps a storage and operations line. That is the concrete case for Cloudflare on a media-heavy or download-heavy site. [4](#r4) [23](#r23) [28](#r28) [33](#r33)

It is not the only case. CloudFront in front of S3 is how AWS tells you to avoid the S3-to-internet charge, and the CloudFront page says origin transfer from AWS is waived. Whether that ends cheaper depends on the CloudFront rate for your viewers, which this page does not quote. Fastly is the alternative when purge time and cache behaviour are the actual complaint: they publish a mean purge under 150 ms and a small, high-density map, not a 348-city one. [15](#r15) [24](#r24) [35](#r35)

Vercel or Netlify can host the site. Whether their included bandwidth survives your traffic is a plan question. We did not cite a comparable overage rate, so we will not announce a winner on bandwidth.

### An enterprise with compliance needs

If the requirement is “HTTPS for this hostname is only decrypted in a chosen region”, Cloudflare’s documented answer is the Data Localization Suite, sold as an enterprise add-on, with the single-country failover exclusion written down. That is a real control. It is not included in a free zone, and it does not relocate every store. D1, R2 and Durable Objects have their own placement rules, described in [where the data lives](/insights/where-cloudflare-keeps-your-data/). [17](#r17) [18](#r18) [44](#r44)

If the requirement is a system of record inside a named region, on a platform the auditor already knows, the hyperscaler the organisation already uses is the default. Cloudflare can still terminate DNS, cache and access in front of it. Moving the database to win a diagram is not supported by this research. Azure’s own docs treat a geography as the residency boundary; AWS and Google sell regions for the same reason. [20](#r20) [27](#r27) [32](#r32)

We did not compare certification lists. Anyone who needs a count of attestations should read the vendors’ compliance pages and their contract, not this one.

### A team already on AWS

Stay, unless a specific meter is the problem. Lambda, S3, CloudFront, RDS or Aurora, and IAM are a complete platform. Rebuilding them on Workers because the edge is fashionable is the mistake [in front, or a rebuild](/insights/cloudflare-in-front-or-rebuild-on-workers/) is about.

The move that the sources support is narrower. Put Cloudflare on the things it is actually sharp at: DNS and TLS, a cache, Access in front of an admin tool, R2 when S3 egress is the bill, a Worker when the handler fits in 128 MB. Leave the relational database where it is and reach it with Hyperdrive if the application code moves. [1](#r1) [4](#r4) [10](#r10)

The same shape applies to Azure and Google Cloud. Those spokes are the detail.

## What this research does not claim

No latency ranking. Cloudflare’s own page disagrees with itself on the 95th-percentile distance, and we did not measure Fastly’s purge time or TTFB.

No total cost for “a typical company”. The matrices are rates and limits, not a bill.

No POP total for Fastly. The 86 figure is a count of city names on their map.

No dollar price for Akamai delivery or EdgeWorkers. The pages we used do not print one.

No claim that Workers never charge for egress. Containers do.

No new Xolqy price. The commercial step, if you want one, is [Cloudflare OS](/cloudflare-os/): the [package on the shop](/shop/#cloudflare-os) and the [introduction](/shop/#os-introduction).

## The other pages

Each spoke is a decision against one class of rival, including where Cloudflare loses.

1. [Cloudflare vs AWS](/insights/research/cloudflare-vs-aws/)
2. [Cloudflare vs Azure](/insights/research/cloudflare-vs-azure/)
3. [Cloudflare vs Google Cloud](/insights/research/cloudflare-vs-google-cloud/)
4. [Cloudflare vs Vercel and Netlify](/insights/research/cloudflare-vs-vercel-netlify/)
5. [Cloudflare vs Fastly and Akamai](/insights/research/cloudflare-vs-fastly-akamai/)
6. [Cloudflare vs Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/)

For the product definitions rather than the comparison, start with the [wiki](/wiki/): [Workers](/wiki/workers/), [R2](/wiki/r2/), [D1](/wiki/d1/), [Hyperdrive](/wiki/hyperdrive/), [Durable Objects](/wiki/durable-objects/), [edge locations](/wiki/edge-and-pops/), [Workers AI](/wiki/workers-ai/). The essay [Cloudflare as an operating system](/insights/cloudflare-as-an-operating-system/) is the argument for treating the platform as one system. [Which products a business needs](/insights/which-cloudflare-products-a-business-needs/) is the buying guide. This series is the “against whom”.

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/pricing/">Pricing · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/limits/">Limits · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r3">Cloudflare. <a href="https://www.cloudflare.com/en-ca/developer-platform/products/workers/">Cloudflare Workers product page</a>. Accessed 2026-10-09.</li>
  <li id="r4">Cloudflare. <a href="https://developers.cloudflare.com/r2/pricing/">Pricing · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r5">Cloudflare. <a href="https://developers.cloudflare.com/r2/api/s3/api/">S3 API compatibility · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r6">Cloudflare. <a href="https://developers.cloudflare.com/r2/get-started/s3/">S3 · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r7">Cloudflare. <a href="https://developers.cloudflare.com/d1/">Overview · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r8">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/limits/">Limits · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r9">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/pricing/">Pricing · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r10">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/">Overview · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-09.</li>
  <li id="r11">Cloudflare. <a href="https://developers.cloudflare.com/workers-ai/">Cloudflare Workers AI</a>. Accessed 2026-10-09.</li>
  <li id="r12">Cloudflare. <a href="https://developers.cloudflare.com/workers-ai/platform/pricing/">Pricing · Cloudflare Workers AI docs</a>. Accessed 2026-10-09.</li>
  <li id="r13">Cloudflare. <a href="https://developers.cloudflare.com/agents/">Agents · Cloudflare Agents docs</a>. Accessed 2026-10-09.</li>
  <li id="r14">Cloudflare. <a href="https://developers.cloudflare.com/agents/tools/mcp/">MCP · Cloudflare Agents docs</a>. Accessed 2026-10-09.</li>
  <li id="r15">Cloudflare. <a href="https://www.cloudflare.com/network/">Cloudflare Global Network</a>. Accessed 2026-10-09.</li>
  <li id="r16">Cloudflare. <a href="https://www.cloudflare.com/en-ca/plans/zero-trust-services/">Zero Trust and SASE plans</a>. Accessed 2026-10-09.</li>
  <li id="r17">Cloudflare. <a href="https://developers.cloudflare.com/data-localization/">Data Localization Suite</a>. Accessed 2026-10-09.</li>
  <li id="r18">Cloudflare. <a href="https://developers.cloudflare.com/data-localization/regional-services/">Regional Services · Data Localization Suite</a>. Accessed 2026-10-09.</li>
  <li id="r19">Cloudflare. <a href="https://developers.cloudflare.com/containers/platform/pricing/">Pricing · Cloudflare Containers docs</a>. Accessed 2026-10-09.</li>
  <li id="r20">Amazon Web Services. <a href="https://aws.amazon.com/about-aws/global-infrastructure/">Global Infrastructure</a>. Accessed 2026-10-09.</li>
  <li id="r21">Amazon Web Services. <a href="https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html">AWS Regions</a>. Accessed 2026-10-09.</li>
  <li id="r22">Amazon Web Services. <a href="https://aws.amazon.com/lambda/pricing/">AWS Lambda pricing</a>. Accessed 2026-10-09.</li>
  <li id="r23">Amazon Web Services. <a href="https://aws.amazon.com/s3/pricing/">Amazon S3 pricing</a>. Accessed 2026-10-09.</li>
  <li id="r24">Amazon Web Services. <a href="https://aws.amazon.com/cloudfront/pricing/">Amazon CloudFront pricing</a>. Accessed 2026-10-09.</li>
  <li id="r25">Amazon Web Services. <a href="https://aws.amazon.com/bedrock/pricing/">Amazon Bedrock pricing</a>. Accessed 2026-10-09.</li>
  <li id="r26">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/explore/global-infrastructure">Azure global infrastructure</a>. Accessed 2026-10-09.</li>
  <li id="r27">Microsoft. <a href="https://learn.microsoft.com/en-us/azure/reliability/regions-overview">What are Azure regions?</a> Accessed 2026-10-09.</li>
  <li id="r28">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/pricing/details/bandwidth/">Bandwidth pricing</a>. Accessed 2026-10-09.</li>
  <li id="r29">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/pricing/details/functions/">Azure Functions pricing</a>. Accessed 2026-10-09.</li>
  <li id="r30">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/pricing/details/azure-openai/">Azure OpenAI Service pricing</a>. Accessed 2026-10-09.</li>
  <li id="r31">Microsoft Azure. <a href="https://azure.microsoft.com/en-us/pricing/details/ai-foundry-models/microsoft/">Foundry Models pricing</a>. Accessed 2026-10-09.</li>
  <li id="r32">Google Cloud. <a href="https://cloud.google.com/about/locations">Global locations: regions and zones</a>. Accessed 2026-10-09.</li>
  <li id="r33">Google Cloud. <a href="https://cloud.google.com/storage/pricing">Cloud Storage pricing</a>. Accessed 2026-10-09.</li>
  <li id="r34">Google Cloud. <a href="https://cloud.google.com/run/pricing">Cloud Run pricing</a>. Accessed 2026-10-09.</li>
  <li id="r35">Fastly. <a href="https://www.fastly.com/network-map">Network map</a>. Accessed 2026-10-09. Map last updated 30 June 2026, as printed on the page.</li>
  <li id="r36">Fastly. <a href="https://www.fastly.com/pricing">Pricing</a>. Accessed 2026-10-09.</li>
  <li id="r37">Akamai. <a href="https://www.akamai.com/why-akamai/global-infrastructure">Global infrastructure</a>. Accessed 2026-10-09.</li>
  <li id="r38">Akamai. <a href="https://www.akamai.com/products/serverless-computing-edgeworkers">EdgeWorkers</a>. Accessed 2026-10-09.</li>
  <li id="r39">Vercel. <a href="https://vercel.com/pricing">Pricing</a>. Accessed 2026-10-09.</li>
  <li id="r40">Vercel. <a href="https://vercel.com/docs/functions/limitations">Vercel Functions limits</a>. Accessed 2026-10-09.</li>
  <li id="r41">Netlify. <a href="https://docs.netlify.com/build/functions/usage-and-billing">Functions usage and billing</a>. Accessed 2026-10-09.</li>
  <li id="r42">Supabase. <a href="https://supabase.com/pricing">Pricing</a>. Accessed 2026-10-09.</li>
  <li id="r43">Google. <a href="https://firebase.google.com/pricing/">Firebase pricing</a>. Accessed 2026-10-09.</li>
  <li id="r44">Cloudflare. <a href="https://developers.cloudflare.com/r2/reference/data-location/">Data location · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
</ol>
