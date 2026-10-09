---
title: "Cloudflare vs Supabase and Firebase"
description: Supabase and Firebase are databases with auth. Cloudflare is a network that also has a small SQL database. Pick the database when the database is the product.
publishedAt: 2026-10-09
audience: both
topics: [Research, Data, Architecture]
readingMinutes: 6
relatedServices: [websites-and-applications, ai-and-automation]
type: research
researchRole: spoke
series: edge-cloud-landscape
seriesOrder: 6
---

Supabase and Firebase win this comparison whenever the sentence you are trying to finish is “a backend for the product”: Postgres or Firestore, auth, files, and a client SDK. Cloudflare wins when the sentence is “the network in front of the product”, or when the data is small enough for D1 and the egress would have hurt. Using one as a slur against the other wastes a quarter.

This spoke belongs to [the edge cloud landscape](/insights/research/edge-cloud-landscape/). The store-by-store decision on Cloudflare is [D1, KV or R2](/insights/d1-vs-kv-vs-r2/). Firebase’s parent cloud is [Google Cloud](/insights/research/cloudflare-vs-google-cloud/), which is a different argument.

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Start on Supabase when you need Postgres. Start on Firebase when you need Firestore, mobile client libraries and Google’s auth and functions model. Start on Cloudflare when the site, the cache, the WAF and a modest dataset are the whole system.</p>
  <p>The combination the sources actually support is boring: Supabase or Firebase holds the rows, Hyperdrive or an HTTPS call reaches them, Cloudflare carries the hostname. D1 does not become Postgres by enthusiasm.</p>
</aside>

## Where Cloudflare is stronger

**The network those products do not sell.** A Supabase or Firebase project is an origin. DNS, TLS, cache, WAF and a global isolate are Cloudflare’s job, and they are the job described on [Cloudflare OS](/cloudflare-os/) and in the [cache](/wiki/cache/) and [WAF](/wiki/waf/) entries. Neither backend pricing page is a CDN price list.

**Object egress, if the files are large and public.** R2 Standard is $0.015 per GB-month with no internet egress fee. Supabase includes storage in the project; this page does not cite a Supabase storage-egress rate, because the pricing page sections we relied on were the database and the edge functions, not a per-gigabyte delivery table. Firebase’s Spark plan includes 10 GiB a month of Firestore network egress and then Google Cloud pricing on Blaze. For media at volume, R2’s published zero is the number you can take to a spreadsheet. For Firestore’s document traffic, the free 10 GiB matters, and beyond it you are on Google’s network rates, which the [Google Cloud spoke](/insights/research/cloudflare-vs-google-cloud/) cites for Cloud Storage rather than re-deriving here. [1](#r1) [8](#r8)

**A Worker beside the database, not instead of it.** Hyperdrive connects Workers to Postgres, and Supabase is Postgres. The Hyperdrive docs name Neon and other hosts; they also say any Postgres. A Supabase database is a Postgres database. We are not claiming a special integration beyond that. The paid plan does not meter Hyperdrive queries. The free plan allows 100,000 a day. [2](#r2) [3](#r3)

**Price shape for a small SQL database you shard on purpose.** D1 on the paid plan includes 25 billion rows read and 50 million rows written a month, then $0.001 per million rows read and $1.00 per million rows written, and 5 GB of storage before $0.75 per GB-month. The cap is 10 GB per database. If you truly want many small databases, Cloudflare’s limits page allows 50,000 of them on the paid plan and says that is the point. That is a real architecture. It is a bad impersonation of one Supabase project. [4](#r4) [5](#r5)

## Where Cloudflare is weaker

**Postgres.** Supabase’s pricing page is a dedicated Postgres database on every plan. Free includes 500 MB and pauses a project after a week of inactivity, with two active projects. Pro starts at $25 a month, includes 8 GB of disk per project and $10 of compute credit, and does not pause for inactivity. Compute is billed per project on top of the subscription. Edge Functions include 500,000 invocations on Free and 2 million on Pro, then $2 per million. Auth, storage and realtime are part of the project. D1 has SQLite’s SQL semantics, not Postgres extensions, not that disk, and not that auth model. [3](#r3) [6](#r6) [7](#r7)

**Firebase’s client platform.** The Spark plan includes Firestore at 1 GiB, 50,000 document reads a day, 20,000 writes and 20,000 deletes, and 10 GiB of egress. The Blaze plan keeps a free tier and then uses Google Cloud pricing. Cloud Functions on Blaze include 2 million invocations a month, then $0.40 per million. Firestore’s own standard-edition docs, for `us-central1`, price reads at $0.30 per million documents, writes at $0.90 per million and deletes at $0.10 per million, with the daily free quota repeated. There is also a Cloud SQL for PostgreSQL trial on the Firebase pricing page, starting as low as $9.37 a month after the trial, varying by region. Cloudflare has no equivalent of the Firebase client SDKs, phone auth, or that Firestore data model. We will not pretend Workers plus D1 is a mobile backend. [8](#r8) [9](#r9)

**Auth and row-level access.** Both products treat identity and the database as one design. Cloudflare Access is identity in front of an application, priced at $7 per user after the first 50, and it is for your team’s tools more than for your customers’ accounts. Customer auth on Cloudflare is something you build, or something you keep in Supabase or Firebase. [10](#r10)

**Realtime.** Supabase’s pricing table includes Postgres changes, concurrent connections and a message quota. Firebase’s model is a listener on documents. Durable Objects can hold a WebSocket, and they are billed while the socket is awake unless you use the hibernation API. That is a coordination primitive, documented on the Workers price list, not a hosted realtime database. The [Durable Objects](/wiki/durable-objects/) entry says when the primitive is the right tool. [2](#r2) [6](#r6)

**Free tier honesty.** Supabase will pause a free project after a week without traffic. D1’s free tier will refuse queries once the daily row limits hit, until midnight UTC or a paid plan. Firebase’s Spark plan simply stops at the quotas. None of these is “free at production volume”. The pages say so. [5](#r5) [6](#r6) [8](#r8)

## Who should pick which

A product whose core is relational data, policies in the database, and a team that wants SQL they already know: Supabase. Put Cloudflare on the domain when the marketing site, the cache or the WAF is a separate problem.

A product whose core is mobile clients, document data and Google’s SDK: Firebase. Same split.

A brochure site, a member directory that fits in a few gigabytes, a form, an API in front of someone else’s Postgres: Cloudflare, and do not adopt Supabase to feel modern. The [queues and workflows](/insights/queues-versus-workflows/) piece is what background work looks like once you are on this side of the line.

If you want that split designed rather than improvised, the path is [Cloudflare OS](/cloudflare-os/). The database can stay where it is. That is the point of Hyperdrive.

## The rest of this series

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/) (hub)
- [Cloudflare vs AWS](/insights/research/cloudflare-vs-aws/)
- [Cloudflare vs Azure](/insights/research/cloudflare-vs-azure/)
- [Cloudflare vs Google Cloud](/insights/research/cloudflare-vs-google-cloud/)
- [Cloudflare vs Vercel and Netlify](/insights/research/cloudflare-vs-vercel-netlify/)
- [Cloudflare vs Fastly and Akamai](/insights/research/cloudflare-vs-fastly-akamai/)

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/r2/pricing/">Pricing · Cloudflare R2 docs</a>. Accessed 2026-10-09.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/pricing/">Pricing · Cloudflare Workers docs</a>. Accessed 2026-10-09.</li>
  <li id="r3">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/">Overview · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-09.</li>
  <li id="r4">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/limits/">Limits · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r5">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/pricing/">Pricing · Cloudflare D1 docs</a>. Accessed 2026-10-09.</li>
  <li id="r6">Supabase. <a href="https://supabase.com/pricing">Pricing</a>. Accessed 2026-10-09.</li>
  <li id="r7">Supabase. <a href="https://supabase.com/docs/guides/functions/pricing">Edge Functions pricing</a>. Accessed 2026-10-09.</li>
  <li id="r8">Google. <a href="https://firebase.google.com/pricing/">Firebase pricing</a>. Accessed 2026-10-09.</li>
  <li id="r9">Google. <a href="https://firebase.google.com/docs/firestore/standard-edition">Firestore standard edition</a>. Accessed 2026-10-09.</li>
  <li id="r10">Cloudflare. <a href="https://www.cloudflare.com/en-ca/plans/zero-trust-services/">Zero Trust and SASE plans</a>. Accessed 2026-10-09.</li>
</ol>
