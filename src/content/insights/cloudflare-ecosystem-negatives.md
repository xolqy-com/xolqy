---
title: "The 9 + 1 negatives of the Cloudflare ecosystem"
description: Nine platform limits, and one vendor decision, for a CTO who is about to call a stack Cloudflare-native. Documented bounds, not a reason to avoid Cloudflare. Sources read on 10 October 2026.
publishedAt: 2026-10-10T18:00:00.000Z
audience: both
topics: ["Research", "Architecture", "Cloudflare OS"]
readingMinutes: 21
relatedServices: [websites-and-applications, cloudflare-migration, ai-and-automation, security-and-zero-trust, managed-cloudflare]
type: research
researchRole: hub
series: cloudflare-ecosystem-negatives
seriesOrder: 0
sourcesAt: 2026-10-10
---

This is for a CTO who is about to call a stack Cloudflare-native. Cloudflare joins network delivery, security, serverless compute, storage, databases, queues, identity, observability and AI tooling that companies usually buy and operate separately.

That integration is real. So are the trade-offs.

Cloudflare and Cloudflare OS are Cloudflare’s products. Xolqy does not make them, and this page is not an endorsement. Xolqy is an independent implementation partner. The work is the expertise to fix, set up and configure those products for a client’s stack.

The wrong pitch is: move everything to Cloudflare and the architecture becomes simple.

The more useful truth is:

> **Cloudflare can make the right architecture much simpler. It can also make the wrong architecture fail faster and in more connected ways.**

This is not a list of reasons to avoid Cloudflare. None of the first nine is automatically disqualifying. The tenth, the +1, is a decision the company has to make on purpose. The conclusion is **Cloudflare-first, not Cloudflare-only**: clear boundaries, portable business data, and an architecture that can explain its own failure modes.

The platform comparison is [the edge cloud landscape](/insights/research/edge-cloud-landscape/). Where a shared relational core should sit is [the hybrid architecture](/insights/research/cloudflare-postgresql-d1-hybrid/). Whether the company itself can run on Cloudflare OS is [a separate question](/insights/research/can-a-company-run-on-cloudflare-os/). This page is the list to design for before the adjective goes into a strategy document.

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Nine of these are platform limits with a design answer: placement, a short request, a bounded database, an explicit freshness rule, idempotent jobs, a pinned runtime, correlation you can export, and a cost per business action. The tenth is concentration. Fewer vendors can be a smaller attack surface. It is also a larger blast radius. Design the exit. Do not perform a multi-cloud.</p>
  <p>The numbers below are Cloudflare’s own limits and pricing pages, read on 10 October 2026. Where this page makes an architectural judgement, it says so. It does not report a customer result, a measured saving, or a Xolqy price.</p>
</aside>

## The 9 + 1 at a glance

| # | The negative | What actually overcomes it |
| --- | --- | --- |
| 1 | Too many powerful primitives can create a new kind of complexity. | A written workload and data-placement map. |
| 2 | Workers are not general-purpose servers. | Put short, event-driven work at the edge. Move heavy work deliberately. |
| 3 | D1 is not a universal relational database. | Use D1 for the shape it fits. Use PostgreSQL through Hyperdrive for a shared operational core. |
| 4 | “Global” does not remove consistency and freshness decisions. | Design an explicit canonical-write and read-after-write model. |
| 5 | Asynchronous systems can repeat work. | Make every consequential job idempotent, and operate a dead-letter path. |
| 6 | The runtime evolves, and Node compatibility is not absolute. | Pin compatibility dates, test upgrades, and choose edge-suitable dependencies. |
| 7 | Distributed debugging is harder than debugging one server. | Build business-level observability, correlation and export from day one. |
| 8 | Usage-based billing rewards good architecture and exposes bad architecture. | Model cost per business action, set limits, and test load before growth does it for you. |
| 9 | Agent and AI products are powerful and early. A connector is not governance. | Start read-only, use least privilege, and require approval for consequential actions. |
| +1 | A deeply integrated platform concentrates operational and vendor risk. | Build a real exit and recovery posture, not performative multi-cloud. |

## 1. The ecosystem can create a primitive-selection problem

Cloudflare does not offer one generic database, one generic background-job system and one generic compute product. It offers several different primitives:

- [Workers](/wiki/workers/) for request and event logic;
- [Durable Objects](/wiki/durable-objects/) for coordination and state tied to one identity;
- [D1](/wiki/d1/) for relational, SQLite-shaped data;
- [KV](/wiki/kv/) for distributed key-value access;
- [R2](/wiki/r2/) for objects and files;
- [Queues](/wiki/queues/) and [Workflows](/wiki/workflows/) for asynchronous work;
- [Hyperdrive](/wiki/hyperdrive/) for connecting Workers to an existing PostgreSQL or MySQL database;
- [AI Gateway](/wiki/ai-gateway/), [Workers AI](/wiki/workers-ai/), Agents, and Cloudflare OS for AI workloads.

That range is a strength only if each workload has a home. Without a decision model, a team builds a slightly different architecture for every feature. A cache becomes a source of truth. A Durable Object becomes an accidental monolith. D1 is asked to behave like the company’s warehouse. The store-by-store version of the first mistake is [D1, KV or R2](/insights/d1-vs-kv-vs-r2/).

The problem is not that Cloudflare has many products. The problem is that the products are close enough to look interchangeable when they are not. That sentence is a judgement. The product boundaries underneath it are Cloudflare’s.

### How to overcome it

Before application code, write a one-page placement map for every meaningful data flow.

| Question | Example answer |
| --- | --- |
| What is the source of truth? | PostgreSQL for orders and customer history. |
| What needs a global, low-latency lookup? | A product-availability projection in KV or a D1 read. |
| What must coordinate serially? | One Durable Object per booking-inventory pool. |
| What is a file rather than a database row? | Invoices and uploads in R2. |
| What can happen later? | Image processing or email through Queues or Workflows. |
| What must be read immediately after a write? | The canonical database, not a cacheable path. |

Make this a reviewed engineering artefact, not tribal knowledge. The outcome is fewer “why is this data stale?” meetings six months later.

The placement map is the first deliverable of a Xolqy audit.

## 2. Workers are not general-purpose servers

Workers are a strong place for web-facing code. They run close to the network and remove a large amount of server administration. They are still a managed isolate. CPU time, memory and subrequests are bounded. A Worker is not a virtual machine that keeps a process resident, spends arbitrary memory, or runs a normal operating-system toolchain.

Cloudflare’s limits page, read on 10 October 2026, is specific. Memory is 128 MB per isolate on the Free plan and on the Paid plan. CPU time on an HTTP request is 10 milliseconds on Free. On Paid, the default is 30 seconds and the maximum you can set is 5 minutes. Waiting on the network, including `fetch`, KV and database calls, does not count as CPU time. Cloudflare’s own figure for a typical Worker is about 2.2 milliseconds of CPU per request. That figure is theirs, not a measurement from this page. [1](#r1)

Wall-clock time is a different limit, and it depends on the trigger. An HTTP request has no hard duration cap while the client stays connected. A Cron Trigger, a Queue consumer and a Durable Object alarm are limited to 15 minutes. Subrequests default to 50 per invocation on Free and 10,000 on Paid. [1](#r1)

So the portable failure is not “the request took a long time on the clock.” The failure is a CPU-heavy loop, a payload held in memory, a native binary, or a job that assumed a long-lived process. A report that mostly waits on other systems can still be a poor fit for the request the user is staring at. That is a design judgement. The bounds above are the documented reason.

### How to overcome it

Use a request budget.

<figure class="diagram">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 380" width="640" height="380" role="img" aria-label="A small browser request lands on a Worker. Retryable work goes to Queues or Workflows, files go to R2, and jobs that need a full process leave the isolate."><defs><marker id="neg-arr" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#ff5a1f"/></marker></defs><line x1="320" y1="88" x2="320" y2="120" stroke="#ff5a1f" stroke-width="2" marker-end="url(#neg-arr)"/><line x1="320" y1="200" x2="320" y2="224" stroke="#ff5a1f" stroke-width="2"/><line x1="125" y1="224" x2="513" y2="224" stroke="#ff5a1f" stroke-width="2"/><line x1="125" y1="224" x2="125" y2="248" stroke="#ff5a1f" stroke-width="2" marker-end="url(#neg-arr)"/><line x1="319" y1="224" x2="319" y2="248" stroke="#ff5a1f" stroke-width="2" marker-end="url(#neg-arr)"/><line x1="513" y1="224" x2="513" y2="248" stroke="#ff5a1f" stroke-width="2" marker-end="url(#neg-arr)"/><g><rect x="36" y="8" width="568" height="80" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><text x="56" y="32" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">REQUEST</text><text x="56" y="54" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">Keep the browser request small</text><text x="56" y="74" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">Authenticate, validate, one write, then respond</text></g><g><rect x="36" y="120" width="568" height="80" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="36" y="120" width="5" height="80" fill="#ff5a1f"/><text x="56" y="144" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">COMPUTE</text><text x="56" y="166" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Worker</text><text x="56" y="186" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">CPU time is capped. Memory is 128 MB.</text></g><g><rect x="36" y="248" width="178" height="112" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><rect x="36" y="248" width="5" height="112" fill="#ff5a1f"/><text x="52" y="272" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">LATER</text><text x="52" y="296" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="15" font-weight="600" fill="#0a0a0a">Queues, Workflows</text><text x="52" y="318" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="13" fill="#0a0a0a" fill-opacity="0.68">Idempotent work</text></g><g><rect x="230" y="248" width="178" height="112" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><rect x="230" y="248" width="5" height="112" fill="#ff5a1f"/><text x="246" y="272" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">FILES</text><text x="246" y="296" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="15" font-weight="600" fill="#0a0a0a">R2</text><text x="246" y="318" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="13" fill="#0a0a0a" fill-opacity="0.68">Not isolate memory</text></g><g><rect x="424" y="248" width="178" height="112" fill="#ecece6" stroke="#0a0a0a" stroke-width="1.5"/><rect x="424" y="248" width="5" height="112" fill="#ff5a1f"/><text x="440" y="272" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">ELSEWHERE</text><text x="440" y="296" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="15" font-weight="600" fill="#0a0a0a">Separate compute</text><text x="440" y="318" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="13" fill="#0a0a0a" fill-opacity="0.68">When it needs a process</text></g></svg>
<figcaption>The Worker is the fast, secure control path. Queues, R2 and a separate computer are choices, not leftovers.</figcaption>
</figure>

1. Keep the browser request small. Authenticate, validate, make the minimum synchronous write, and return a useful response.
2. Put slow or retryable work on Queues or Workflows. [Queues or Workflows](/insights/queues-versus-workflows/) is the split between a message and a long process.
3. Store intermediate files in R2 rather than holding them in the isolate.
4. Use a separate compute environment when the job needs a full Linux process, memory beyond the isolate, a long stretch of CPU, or a native toolchain.
5. Show job state to the user. Do not make them wait inside the request.

This is ordinary distributed-system design. Cloudflare works best when the edge is the control path, not a place to recreate an old application server.

Xolqy writes that request budget into the architecture, and names the jobs that do not belong on the isolate.

## 3. D1 is not a universal relational database

D1 is useful inside sharp boundaries. On the Workers Paid plan, one D1 database holds a maximum of 10 GB. The limits page says that cap cannot be increased. Each individual database is inherently single-threaded and processes queries one at a time. If too many requests arrive together, D1 queues them, and a full queue returns an overloaded error. Cloudflare designs D1 for horizontal scale-out across many smaller databases, such as per-user, per-tenant or per-entity databases, and says you are billed for queries and storage rather than per database. [2](#r2)

That is what D1 is good at: compact edge-native relational data, tenant-scoped data, catalogue projections, preferences, metadata and bounded workflow state.

It is not a claim that D1 should be the canonical database for every shared, write-heavy operational system. The architecture for that case is [Cloudflare, PostgreSQL and D1](/insights/research/cloudflare-postgresql-d1-hybrid/): Workers and Hyperdrive in front, PostgreSQL as the shared transactional core, D1 only where an edge copy earns the place. This page does not repeat that argument, and it does not repeat the gigabyte ranges in that article. Those ranges are labelled estimates there. They are not reused here as facts.

A shared CRM can still be the wrong shape for one D1 database when the file would fit. Everyone writing to one database, activity timelines, permissions, cross-customer reporting, and a transaction that spans customers, opportunities, billing and audit history are contention and relationship problems. File size is the wrong question. That is a judgement. The 10 GB cap and the single-threaded execution model are the documented part. [2](#r2)

### How to overcome it

Use this rule:

> **Use D1 when the relational unit is deliberately bounded. Use PostgreSQL when the business needs one shared, complex, durable relational core.**

The path, in one line: Worker, then policy and validation, then Hyperdrive, then the PostgreSQL transaction, then an outbox, then an optional D1, KV or R2 projection. Hyperdrive’s own caching notes cover both PostgreSQL and MySQL. [4](#r4)

Xolqy records that rule on the placement map: which relational unit is D1, and which is PostgreSQL.

## 4. Global distribution does not remove consistency and freshness decisions

“The database is global” sounds like a property that solves data design. It does not.

D1 read replication can lower read latency and raise read throughput. It is not automatic. Queries use a replica only through the Sessions API. Without that API, they keep running on the primary. A session is one logical sequence of queries, and the API provides sequential consistency inside that session. A replica can still be behind the primary. The session’s bookmark is how a later read waits until it is at least as current as an earlier write. You still choose which reads may use a replica and which must see the latest primary. [3](#r3)

Hyperdrive is a separate switch. Query caching is on by default. It caches eligible read-only queries and does not cache writes. It does not invalidate a cached read when the application writes. The default maximum age is 60 seconds, with 15 further seconds of stale-while-revalidate. For a read that must be fresh, Cloudflare’s guidance is a second Hyperdrive configuration with caching disabled. The examples on that page are authentication, sessions, permissions, billing state, admin settings, and a read immediately after a write. [4](#r4)

Neither behaviour is a defect. Both are normal distributed-system trade-offs. The danger is acting as if “global” means “every read is instantly correct for every purpose.”

### How to overcome it

Write a small freshness contract for every important screen and API.

- Where is the canonical write made?
- Which paths may be cached, or read from a replica?
- What does a user see immediately after changing data?
- Which data needs a session bookmark, or a cache-disabled Hyperdrive binding?
- How long may a dashboard, a search index or an analytics page be stale?

| Workflow | A sound default |
| --- | --- |
| A user changes their password | Canonical write, then a fresh read path. |
| A customer opens a product catalogue | An edge cache or a replicated read is often fine. |
| Finance opens an unpaid invoice just created | A canonical database read. |
| An executive analytics dashboard | An asynchronously refreshed projection can be the right staleness. |

The overcome is not “make every read strongly consistent.” It is making freshness a business decision instead of an accident. The longer account of Hyperdrive’s cache, including the difference from the [CDN cache](/wiki/cache/), is the hybrid article.

Xolqy writes that freshness contract beside the placement map, one row per screen that would hurt if it were stale.

## 5. Async work is reliable only if your business action tolerates retries

Queues and Workflows make durable background processing much easier to build. Durable does not mean exactly once, and the two products do not share one guarantee.

Cloudflare Queues provides at-least-once delivery. A message is delivered at least once, and in rare cases it can be delivered again. Cloudflare’s own example of the danger is an email API or a payment API that must reject the duplicate. [5](#r5)

A dead-letter queue is not created for you. The consumer configuration names one. The dead-letter page says delivery is retried three times by default, and that a message which exhausts those retries is deleted permanently if no dead-letter queue is set. A message that lands on a dead-letter queue with no consumer of its own is kept for four days and then deleted. [6](#r6)

Workflows are different. A step might be retried more than once. If the engine restarts in the middle of a step, that step starts again. Deterministic step names cache state, which is what stops a finished step from being rerun without a reason. Cloudflare’s rules still tell you to make the step idempotent. [7](#r7)

Many teams build the queue and assume the platform removed the hard part. The hard part moved into the business action: proving that processing the same instruction twice is safe.

### How to overcome it

Every consequential background message needs:

- a stable business identifier;
- an idempotency key at the receiving system or in the database;
- a transaction or outbox when a database write emits the message;
- bounded retries, with errors classified into retryable and final;
- a dead-letter queue, a consumer for it, and a human procedure before the four-day delete;
- an audit record of what occurred.

A simple rule helps:

> **Assume any external call can be attempted twice. Design it so the business result still happens once.**

A worker can enqueue “send invoice 123.” The email action should first check whether invoice 123 was already sent for that event version. The queue is safe because the business operation is safe.

Xolqy does not treat a queue as finished until the idempotency key and the dead-letter path are named.

## 6. The runtime evolves, and Node compatibility is not absolute

Workers is a web-standard-first runtime, not an ordinary Node.js process. Compatibility has improved. It is still a subset.

Cloudflare documents Node.js APIs in two forms. Built-ins are mostly full implementations, and a few are partial. APIs that are not in the runtime are polyfilled so a package can import them. Calling an unimplemented method throws. Some modules, including `node:child_process`, are non-functional stubs: the import succeeds, and there is no working toolchain behind it. [9](#r9)

`node:fs` is not a server disk. It is a virtual file system. Files bundled with the Worker are readable under `/bundle`. `/tmp` is writable and exists only for that request. Temporary files count towards the isolate’s memory. Watching files, globbing, permissions and real timestamps are not the Node behaviour. A dependency that expects a persistent disk, a native binary, or `child_process` will not behave as it does on a server. [10](#r10)

The runtime also changes. Compatibility dates and flags are how a deployed Worker avoids inheriting every breaking change. Cloudflare says old dates stay supported. New features sometimes require a current date, and the docs generally describe current behaviour. Updating the date is a release decision, tested on the Workers runtime, not only under local Node. [8](#r8)

### How to overcome it

Treat the runtime as a versioned platform. The wiki term is [compatibility date](/wiki/compatibility-date/).

1. Set and commit a compatibility date for every Worker.
2. Upgrade it on a release cadence, after reading the flags that date turns on.
3. Test on the Workers runtime in CI, not only in local Node.
4. Keep a small approved set of libraries for database access, validation, auth, serialisation and observability.
5. Put server-only code behind an HTTP or queue boundary instead of fighting the isolate.
6. Roll a critical Worker forward with a way back.

The goal is to consume platform changes as an engineering team.

Xolqy pins the compatibility date in the repository and upgrades it as a release, not as a surprise.

## 7. Debugging a distributed edge application takes more discipline

A conventional application may have one region, a few servers and one database. A Cloudflare journey may involve a Worker, a cache rule, an Access policy, a Durable Object, a Queue consumer, an R2 object, a Hyperdrive connection, a third-party API and an agent action.

Cloudflare’s observability docs describe logs, traces, dashboard metrics (requests, errors, CPU time, wall time), and Issues, which group recurring failures. The logs page calls that grouping Workers Issues. OpenTelemetry export, on the page read for this article, covers logs and traces. Metrics are not in that export list. The tools are real. They do not by themselves answer a customer incident. [11](#r11) [13](#r13)

The questions that still need an owner:

- Which customer request caused this background task?
- Which Worker version made the decision?
- Which person, or which approval, allowed the action?
- Which database mutation was made?
- Did the user receive a cached, replicated or fresh answer?
- Can we still investigate after Workers Logs have expired?

Workers Logs are stored in the Cloudflare account, not on a machine you control. New Workers are created with the observability setting enabled. A Worker writes those logs only when the setting is on. Retention is 3 days on the Workers Free plan and 7 days on Workers Paid. The limits table states a maximum retention of 7 days. There is also a daily account cap; after it, Cloudflare applies a 1% sample for the rest of that day. From 1 December 2026, Cloudflare’s pricing note says Workers Logs move to Observability pricing. Until that date, the Free and Paid table is the one in force. [12](#r12)

“Seven days by default, locally” is the wrong summary. Three days and seven days are both documented, seven is the maximum on that table, and the logs are not local.

### How to overcome it

Build observability around the business event.

- Carry a correlation ID through the Worker, the Queue or Workflow, the database event and the third-party call.
- Log structured event names and safe business identifiers. Do not log raw sensitive payloads.
- Record the deployment version, the policy decision and the data-source type where they matter.
- Define objectives for outcomes: checkout success, booking-confirmation latency, report completion.
- Export logs and traces if the plan’s retention is shorter than the investigation you will actually need. Logpush and OpenTelemetry are the documented exits. [12](#r12) [13](#r13)
- Add synthetic checks for the few customer journeys that must not fail silently.

The platform gives you instrumentation. [Web analytics and observability](/wiki/web-analytics-observability/) is the product map. The system still needs an operational story.

Xolqy defines the correlation ID and the export destination in the audit, before the first production incident.

## 8. Usage-based economics can surprise teams that think in server costs

Cloudflare pricing is not one monthly server bill. The meters that matter here, from the pricing pages read on 10 October 2026:

- Workers Standard bills requests and CPU time. Duration on a Worker is not a charge. [14](#r14)
- D1 bills rows read, rows written and storage. [14](#r14)
- Queues bill operations. A delivered message is typically a write, a read and a delete. Each retry is another read. There is no egress charge on Queues. [15](#r15)
- Workflows bill requests and CPU time on the Workers meters, plus steps and stored state. [16](#r16)
- R2 bills storage and two classes of operations. Egress bandwidth to the internet is free on every storage class. Infrequent Access adds a data-retrieval fee, which is not an egress charge. [17](#r17)
- Workers AI is priced by model, in neurons, with a per-token view on the pricing page. This article does not reprint that rate card. [18](#r18)
- Workers Logs bill log events above the included amount, on the retention described above. [12](#r12)

A poor query, a retry loop, an unbounded endpoint, oversized logs or a large AI prompt can become a cost event. “Serverless is cheap” is not a cost model. Nothing in this section is a reconstructed bill, and nothing is a Xolqy price.

### How to overcome it

Manage cost at the level the business understands.

| Measure | The better question |
| --- | --- |
| Worker CPU | How much CPU does one checkout, one import or one agent task consume? |
| D1 reads | How many rows does one useful screen read, after indexes? |
| Queue operations | What is the retry rate, and the operations, per completed job? |
| AI | What does one answer cost, on the model and the prompt size you actually call? |
| Observability | Which logs are needed to operate, and which are duplicates? |

Then set protection: a CPU limit, a rate limit, a load test on representative data, an alert on retry growth, and a review before any endpoint can fan out or attach a large model context. The aim is not to optimise on day one. It is to see unit economics while the product is still small enough to change.

Xolqy prices the design per business action from the account’s own usage. The audit does not invent a bill.

## 9. Cloudflare OS and agent tooling are early, and a connector is not governance

Cloudflare OS is Cloudflare’s open-source agent workspace: company context, small applications, and Gatekeepers as the security framework in the repository’s own description. It is also explicitly early access. The README, still carrying its August 2026 note when read on 10 October 2026, calls version 2 a complete rewrite, capable, with many rough edges. [19](#r19)

That maturity, what a Gatekeeper actually constrains, and where a company should stop, are [Can a company run on Cloudflare OS?](/insights/research/can-a-company-run-on-cloudflare-os/). This page does not re-explain them.

The wider risk is older than that repository. A connection to GitHub, Google Workspace, a CRM or a database does not make an agent safe, accurate or fit for unsupervised action. An agent can misunderstand a task, overreach the data it can see, produce a convincing wrong answer, or repeat an action after a failure. Least privilege reduces blast radius. It does not replace judgement, approval, testing or an owner.

### How to overcome it

Use a staged deployment.

1. Start with read-only knowledge and low-risk research.
2. Connect one bounded system at a time.
3. Give every agent a named owner, a narrow purpose and an explicit data scope.
4. Require approval before sending, changing, publishing, spending, deleting or granting access.
5. Keep action logs, and test failure cases, not only the happy path.
6. Use code for rules. Use an agent where interpretation is the point.
7. Keep a manual route for every critical process until its failure modes are understood.

Cloudflare OS can be a work layer. It is not proof that an agent should operate every business system unsupervised.

Xolqy starts that agent read-only, with a named owner, and treats Cloudflare OS as Cloudflare’s product to configure.

## +1. A deeply integrated Cloudflare stack concentrates risk

This is the strategic negative.

If Cloudflare manages DNS, the CDN, the WAF, access, Workers, edge storage, the AI gateway and the path into internal tools, one provider sits on a large part of the company’s digital path.

That is not automatically bad. Fewer vendors can mean fewer weak joins, a faster incident call and a smaller security surface. It also means a larger blast radius for a provider incident, a bad configuration, an account-access problem, a pricing change, or a product decision that no longer fits. This page does not invent an uptime figure, and it does not claim Cloudflare never fails.

The answer is not a theatre production called multi-cloud, where every small workload is duplicated. The answer is a designed exit and a designed recovery. [The landscape hub](/insights/research/edge-cloud-landscape/) is the general lock-in comparison. The hybrid article is the data half: PostgreSQL remains a portable relational core when it is the system of record.

### How to overcome it

Define portability and recovery before the platform is indispensable.

- Keep infrastructure configuration in version control, and reproducible.
- Keep canonical business data in a form you can export, restore and check.
- Write the dependency map: what breaks if Workers, Access, DNS, R2 or one third-party API is unavailable?
- Keep an incident channel that does not itself depend on the same login.
- Design degradation: cached public pages, read-only customer screens, queued submissions, a manual back office.
- Keep a documented origin and data-recovery path for any system whose downtime has a commercial or regulatory cost.
- Run an exit or recovery exercise for one critical workflow.

For some companies, an independent DNS provider or another compute path is worth the cost. For others, it is not. Make that an explicit decision from recovery objectives.

Xolqy writes the exit and recovery path for the one workflow whose downtime has a commercial cost.

## What a mature Cloudflare-first architecture looks like

The right outcome is clarity, not purity.

| Cloudflare should own | A specialist or portable system may own |
| --- | --- |
| Edge delivery, security, rate limits and traffic control | Canonical complex relational data |
| Public APIs and application logic | Payments, banking, ERP and payroll |
| Identity-aware access and zero-trust policy | A CRM or an industry system of record |
| Fast read models, files and event routing | Long-running compute, where a process is actually required |
| Agent access mediation, model routing and audit boundaries | Source hosting, collaboration and regulated tooling |

For every important capability, a company should be able to answer:

1. What is the source of truth?
2. What happens during a retry?
3. Which path must be fresh?
4. Which policy allows the action?
5. How do we investigate a failure?
6. What happens if this Cloudflare product is unavailable?
7. How would we move or recover it?

If the team can answer those questions, Cloudflare is an unusually strong operating layer. If it cannot, another Cloudflare product will not make the system simpler. It will connect the unexamined assumptions.

## Final position

Cloudflare’s ecosystem does not fail because it lacks every feature of a hyperscaler, a virtual machine, PostgreSQL, an ERP or a mature SaaS suite. It becomes risky when a company expects it to be all of those things at once.

The best use is a secure, fast, governed front door, and increasingly a work and agent control plane, around the systems that already hold the durable truth.

> **Use Cloudflare to reduce operational friction. Cloudflare-first, not Cloudflare-only. Architecture, data ownership and recovery still exist.**

## What to do with this

Want these 7 questions answered for your stack? [Start with a Xolqy audit](/shop/#cloudflare-audit).

The packaged review is the [Cloudflare Audit](/shop/#cloudflare-audit). [What an audit covers](/insights/what-a-cloudflare-audit-covers/) is the contents of that report. [Cloudflare OS Implementation by Xolqy](/cloudflare-os/) is the separate implementation engagement, and it starts with an audit of its own. This page does not add a price.

## Also in this research

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/)
- [Cloudflare, PostgreSQL and D1](/insights/research/cloudflare-postgresql-d1-hybrid/)
- [Can a company run on Cloudflare OS?](/insights/research/can-a-company-run-on-cloudflare-os/)
- [D1, KV or R2](/insights/d1-vs-kv-vs-r2/)
- [Queues or Workflows](/insights/queues-versus-workflows/)
- [Workers](/wiki/workers/), [D1](/wiki/d1/), [Hyperdrive](/wiki/hyperdrive/), [Queues](/wiki/queues/), [Workflows](/wiki/workflows/), [Durable Objects](/wiki/durable-objects/), [KV](/wiki/kv/), [R2](/wiki/r2/)
- [Compatibility date](/wiki/compatibility-date/), [observability](/wiki/web-analytics-observability/), [AI Gateway](/wiki/ai-gateway/), [Workers AI](/wiki/workers-ai/)

Validate the live limits, the retention table and the pricing meters before you commit a production design. The pages below are what this article relied on.

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/limits/">Limits · Cloudflare Workers docs</a>. Accessed 2026-10-10. 128 MB memory per isolate on Free and Paid. HTTP CPU time of 10 ms on Free, and a Paid default of 30 seconds up to 5 minutes. Network waiting is not CPU time. Cloudflare’s stated average of about 2.2 ms. No hard HTTP wall-time limit while the client stays connected. Fifteen-minute wall time for Cron Triggers, Queue consumers and Durable Object alarms. Subrequest defaults.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/limits/">Limits · Cloudflare D1 docs</a>. Accessed 2026-10-10. Workers Paid maximum of 10 GB per database, the statement that the cap cannot be increased, single-threaded execution, the overloaded error when the queue is full, and horizontal scale-out across smaller per-user, per-tenant or per-entity databases.</li>
  <li id="r3">Cloudflare. <a href="https://developers.cloudflare.com/d1/best-practices/read-replication/">Global read replication · Cloudflare D1 docs</a>. Accessed 2026-10-10. Sessions API required for replica reads, sequential consistency within a session, and replica lag.</li>
  <li id="r4">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/concepts/query-caching/">Query caching · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-10. Caching of eligible read-only queries for PostgreSQL and MySQL, the 60-second default maximum age, 15 seconds of stale-while-revalidate, no invalidation on write, and a cache-disabled configuration for authentication, sessions, permissions, billing state, admin settings and reads immediately after a write.</li>
  <li id="r5">Cloudflare. <a href="https://developers.cloudflare.com/queues/reference/delivery-guarantees/">Delivery guarantees · Cloudflare Queues docs</a>. Accessed 2026-10-10. At-least-once delivery, rare duplicate delivery, and idempotency keys for email or payment APIs.</li>
  <li id="r6">Cloudflare. <a href="https://developers.cloudflare.com/queues/configuration/dead-letter-queues/">Dead Letter Queues · Cloudflare Queues docs</a>. Accessed 2026-10-10. A dead-letter queue is consumer configuration, not a default. Three retries by default. Messages that exhaust retries with no dead-letter queue are deleted. A dead-letter queue with no consumer keeps messages for four days.</li>
  <li id="r7">Cloudflare. <a href="https://developers.cloudflare.com/workflows/build/rules-of-workflows/">Rules of Workflows · Cloudflare Workflows docs</a>. Accessed 2026-10-10. A step might be retried multiple times, so Cloudflare recommends idempotent steps. A restart can begin an in-progress step again. Deterministic step names cache state and avoid rerunning a finished step without reason.</li>
  <li id="r8">Cloudflare. <a href="https://developers.cloudflare.com/workers/configuration/compatibility-dates/">Compatibility dates · Cloudflare Workers docs</a>. Accessed 2026-10-10. Dates and flags opt a Worker into runtime changes. Old dates remain supported. Updating the date is deliberate.</li>
  <li id="r9">Cloudflare. <a href="https://developers.cloudflare.com/workers/runtime-apis/nodejs/">Node.js compatibility · Cloudflare Workers docs</a>. Accessed 2026-10-10. A subset of Node.js APIs: native implementations, partial implementations, polyfills that throw when called, and non-functional stubs including <code>node:child_process</code>.</li>
  <li id="r10">Cloudflare. <a href="https://developers.cloudflare.com/workers/runtime-apis/nodejs/fs/">fs · Cloudflare Workers docs</a>. Accessed 2026-10-10. <code>node:fs</code> is an in-memory virtual file system: read-only bundle files, a per-request <code>/tmp</code>, and device files. Temporary files count towards the memory limit. Watch, glob, permissions and real timestamps are not provided.</li>
  <li id="r11">Cloudflare. <a href="https://developers.cloudflare.com/workers/observability/">Observability · Cloudflare Workers docs</a>. Accessed 2026-10-10. Logs, traces, Issues for grouped failures, and dashboard metrics including request counts, error rates, CPU time and wall time.</li>
  <li id="r12">Cloudflare. <a href="https://developers.cloudflare.com/workers/observability/logs/workers-logs/">Workers Logs · Cloudflare Workers docs</a>. Accessed 2026-10-10. Logs stored in the Cloudflare account. New Workers have observability enabled by default. Retention of 3 days on Free and 7 days on Paid. Maximum retention of 7 days. The daily account cap and the 1% sample after it. The note that Observability pricing begins on 1 December 2026.</li>
  <li id="r13">Cloudflare. <a href="https://developers.cloudflare.com/workers/observability/exporting-opentelemetry-data/">OpenTelemetry export · Cloudflare Observability docs</a>. Accessed 2026-10-10. The export types listed on the page are Cloudflare Traces, Workers Traces and Workers Logs.</li>
  <li id="r14">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/pricing/">Pricing · Cloudflare Workers docs</a>. Accessed 2026-10-10. Workers requests and CPU time, with no duration charge. D1 rows read, rows written and storage. Workers Logs included events and the same 3-day and 7-day retention.</li>
  <li id="r15">Cloudflare. <a href="https://developers.cloudflare.com/queues/platform/pricing/">Pricing · Cloudflare Queues docs</a>. Accessed 2026-10-10. Operations per 64 KB written, read or deleted. A typical delivery is three operations. Each retry incurs another read. No egress charge.</li>
  <li id="r16">Cloudflare. <a href="https://developers.cloudflare.com/workflows/reference/pricing/">Pricing · Cloudflare Workflows docs</a>. Accessed 2026-10-10. Requests, CPU time, storage and steps. Step and storage billing applies from the date stated on that page, 10 August 2026.</li>
  <li id="r17">Cloudflare. <a href="https://developers.cloudflare.com/r2/pricing/">Pricing · Cloudflare R2 docs</a>. Accessed 2026-10-10. Storage and Class A and Class B operations. No egress-bandwidth charge for any storage class. A separate data-retrieval fee on Infrequent Access.</li>
  <li id="r18">Cloudflare. <a href="https://developers.cloudflare.com/workers-ai/platform/pricing/">Pricing · Cloudflare Workers AI docs</a>. Accessed 2026-10-10. Model use priced in neurons, with a per-model token equivalent. The rate card is not reprinted here.</li>
  <li id="r19">Cloudflare. <a href="https://github.com/cloudflare/cloudflare-os">cloudflare/cloudflare-os</a> README. Accessed 2026-10-10. Not a traditional operating system. Gatekeepers as the security framework. Version 2 as a complete rewrite. The August 2026 early-access note, still present, including “many rough edges.”</li>
</ol>
