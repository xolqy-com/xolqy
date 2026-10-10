---
title: "Cloudflare, PostgreSQL and D1: the hybrid architecture"
description: Cloudflare stays the product platform. PostgreSQL holds the relational truth. D1 is the edge database you add only when it earns the place.
publishedAt: 2026-10-10
audience: both
topics: ["Research", "Architecture", "Data"]
readingMinutes: 18
relatedServices: [websites-and-applications, cloudflare-migration, ai-and-automation, security-and-zero-trust]
type: research
researchRole: hub
series: cloudflare-postgresql-d1-hybrid
seriesOrder: 0
sourcesAt: 2026-10-10
---

This is a guide for a CTO, or for the owner who has to live with the architecture afterwards. Cloudflare is the product platform. PostgreSQL can be the system of record. [D1](/wiki/d1/) stays in the design where an edge database improves it.

The platform comparison lives in [the edge cloud landscape](/insights/research/edge-cloud-landscape/). The database products people actually weigh against D1 are in the [Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/) spoke. This page is the architecture that follows once you have decided the shared rows should not all live in one SQLite database.

## The important correction: Cloudflare is not “D1 only”

The wrong framing is:

> D1 versus PostgreSQL: choose one and accept the limits of the other.

The useful framing is:

> **Cloudflare is the global application, security, edge-compute and agent-control platform. PostgreSQL can be the durable relational core. D1 is an additional edge-native database where it genuinely improves the design.**

A shared CRM, a booking engine or a commerce core can use PostgreSQL and still be a Cloudflare product. The platform gets sharper when each part does the job it is built for.

- **[Workers](/wiki/workers/) and [Pages](/wiki/pages/)** run the web application, the APIs, the customer portal and a remote MCP server close to users.
- **[WAF](/wiki/waf/), [DDoS protection](/wiki/ddos-protection/), [rate limiting](/wiki/rate-limiting/) and [Access](/wiki/zero-trust-access/)** protect the public surface and the agent-facing surface. [Zero Trust without a VPN](/insights/zero-trust-without-a-vpn/) is the short version of Access.
- **[Hyperdrive](/wiki/hyperdrive/)** lets Workers reach PostgreSQL with the drivers and ORMs you already use. Cloudflare pools those connections across its network and can cache eligible reads. [1](#r1) [2](#r2)
- **PostgreSQL** holds the canonical relational truth: customers, orders, bookings, permissions, transactions, workflows and the audit history.
- **D1** is optional. Use it for an independent database per tenant, for compact operational data, for an edge read model, or for a projection you can rebuild.
- **[R2](/wiki/r2/)** holds attachments, import and export files, images, documents and recordings.
- **[Queues](/wiki/queues/), [Workflows](/wiki/workflows/), [Durable Objects](/wiki/durable-objects/) and [KV](/wiki/kv/)** cover asynchronous work, multi-step processes, coordination and configuration. [Queues or Workflows](/insights/queues-versus-workflows/) is the split between a message and a long process.

For many serious products, that assignment is the strongest Cloudflare architecture. D1’s paid plan caps one database at 10 GB, and the limits page says the cap cannot be increased. Cloudflare’s storage guide points Hyperdrive at an existing Postgres or MySQL database — including a single database on the scale that page illustrates as “1TB, 100TB or more” — and points D1 at lightweight relational data. Past 10 GB, the same guide’s advice for D1 is to split into smaller databases. [3](#r3) [5](#r5)

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Keep Cloudflare as the application, the security perimeter and the agent control plane. Put the shared relational truth in PostgreSQL, and reach it from Workers through Hyperdrive. Add D1 when a tenant boundary, a rebuildable read model or a small edge-native module is the actual requirement.</p>
  <p>D1 remains a good database for data that is naturally independent and stays inside the per-database limit. It is a poor sole system of record for a shared CRM, for contended stock and bookings, or for company-wide reporting. The store-by-store version of that choice is <a href="/insights/d1-vs-kv-vs-r2/">D1, KV or R2</a>.</p>
  <p>Platform limits below are from vendor documentation read on 10 October 2026. The gigabyte and row ranges in the CRM illustration are labelled estimates. They are not measurements, and they are not a customer result.</p>
</aside>

## The hybrid model in one picture

<figure class="diagram">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 788" width="640" height="788" role="img" aria-label="Request path from a user or agent, through the Cloudflare edge, a Worker and Hyperdrive, into PostgreSQL as the only authority, then an outbox and rebuildable copies."><defs><marker id="hybrid-arr" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#ff5a1f"/></marker></defs><line x1="320" y1="88" x2="320" y2="120" stroke="#ff5a1f" stroke-width="2" marker-end="url(#hybrid-arr)"/><line x1="320" y1="204" x2="320" y2="236" stroke="#ff5a1f" stroke-width="2" marker-end="url(#hybrid-arr)"/><line x1="320" y1="320" x2="320" y2="352" stroke="#ff5a1f" stroke-width="2" marker-end="url(#hybrid-arr)"/><line x1="320" y1="436" x2="320" y2="468" stroke="#ff5a1f" stroke-width="2" marker-end="url(#hybrid-arr)"/><line x1="320" y1="552" x2="320" y2="584" stroke="#ff5a1f" stroke-width="2" marker-end="url(#hybrid-arr)"/><line x1="320" y1="668" x2="320" y2="700" stroke="#ff5a1f" stroke-width="2" marker-end="url(#hybrid-arr)"/><g><rect x="36" y="4" width="568" height="84" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><text x="56" y="28" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">REQUEST</text><text x="56" y="52" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">User, staff UI or AI agent</text><text x="56" y="72" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">A person or a model. Not a database login.</text></g><g><rect x="36" y="120" width="568" height="84" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="36" y="120" width="5" height="84" fill="#ff5a1f"/><text x="56" y="144" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">EDGE</text><text x="56" y="168" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Cloudflare edge</text><text x="56" y="188" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">CDN, WAF, Access and rate limits</text></g><g><rect x="36" y="236" width="568" height="84" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="36" y="236" width="5" height="84" fill="#ff5a1f"/><text x="56" y="260" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">COMPUTE</text><text x="56" y="284" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Worker</text><text x="56" y="304" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">Application and remote MCP tools</text></g><g><rect x="36" y="352" width="568" height="84" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="36" y="352" width="5" height="84" fill="#ff5a1f"/><text x="56" y="376" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">POOL</text><text x="56" y="400" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Hyperdrive</text><text x="56" y="420" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">Pooled connection to PostgreSQL</text></g><g><rect x="36" y="468" width="568" height="84" fill="#f5f5f0" stroke="#ff5a1f" stroke-width="2.5"/><rect x="36" y="468" width="5" height="84" fill="#ff5a1f"/><text x="56" y="492" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">RECORD</text><text x="56" y="516" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">PostgreSQL</text><text x="56" y="536" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">Canonical transactions. The only authority.</text></g><g><rect x="36" y="584" width="568" height="84" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><text x="56" y="608" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">EVENTS</text><text x="56" y="632" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">Outbox</text><text x="56" y="652" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">Events and background work</text></g><g><rect x="36" y="700" width="568" height="84" fill="#ecece6" stroke="#0a0a0a" stroke-width="1.5"/><text x="56" y="724" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">COPIES</text><text x="56" y="748" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">Rebuildable edge state</text><text x="56" y="768" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">D1 projections, R2 files, analytics feeds</text></g></svg>
<figcaption>PostgreSQL is the only authority on this path. D1, R2 and analytics sit downstream, and each of them must be safe to rebuild.</figcaption>
</figure>

PostgreSQL is the only database that has to be authoritative. Everything downstream of it has to be:

- explicitly scoped;
- safe to rebuild;
- clearly labelled as cache, projection or temporary state;
- never a hidden second source of truth.

Cloudflare then gives you global product speed and an agent-ready action layer. PostgreSQL gives you a mature relational system of record. [Where Cloudflare keeps data](/insights/where-cloudflare-keeps-your-data/) is the placement question; this page is the ownership question.

## Where D1 is not the best canonical store

| Business requirement | Why D1 alone is the wrong canonical store | The Cloudflare hybrid | A D1 role, if you need one |
| --- | --- | --- | --- |
| One shared CRM that will outgrow a single small database | A paid D1 database has a hard 10 GB maximum, and that cap cannot be increased. | Run the CRM in managed PostgreSQL. Keep the Worker API, the edge security and the MCP tools on Cloudflare, and connect them with Hyperdrive. | Per-tenant preferences, a fast read summary, an agent session checkpoint. |
| Many concurrent writes to shared orders, stock or bookings | One D1 database is single-threaded and processes queries one at a time. Contended work queues, and a full queue returns an overloaded error. | PostgreSQL is the transaction authority. Workers validate the action, send an idempotency key, and call PostgreSQL through a pooled Hyperdrive connection. | A read-only availability projection, or a catalogue view that can be slightly behind. |
| Reporting across every customer | A D1 database per tenant isolates well, and it makes a global join somebody else’s system. | Keep shared business data, and the reporting queries, in PostgreSQL. Send events onward when a warehouse is actually required. | A tenant-local dashboard, or a derived aggregate. |
| Rich SQL, extensions, an established ORM, BI tools | D1 is a SQLite-oriented database with a deliberately smaller surface. | Workers connect to PostgreSQL with native drivers and ORMs through Hyperdrive. Choosing PostgreSQL does not force you back to a traditional server as the API. | None required. |
| Payments, a ledger, inventory, or a workflow that must not double-apply | The issue is the shared transactional domain, not whether D1 can store a row. | PostgreSQL is the transaction boundary. Cloudflare owns the security, the API policy, the MCP approval flow and the observability around it. | A rebuildable read model only. |
| Large uploads, PDFs, images, email exports, recordings | Neither relational database should be the file store. | R2 holds the objects behind the same Cloudflare application. PostgreSQL stores the metadata and the permissions. | Small metadata, if you need it at the edge. |

Every row ends in the same place: keep Cloudflare as the product platform, and plug in a PostgreSQL core that fits the job. The 10 GB cap, the single-threaded execution model and the overloaded-queue behaviour are Cloudflare’s own limits page. [5](#r5) The connection path is Hyperdrive, which Workers docs recommend for PostgreSQL. [1](#r1) [2](#r2)

## What Cloudflare adds to PostgreSQL

PostgreSQL on its own is a database. Cloudflare is what turns it into a global product: the application, the security, the files, the jobs and the agent boundary.

### A global application without a traditional API server

A request can land on a Worker. That Worker handles routing and application logic, authenticated API endpoints, form validation and abuse controls, tenant resolution, rate limits, caching decisions, request observability, and MCP tool hosting.

The Worker then talks to PostgreSQL through Hyperdrive. Hyperdrive keeps a connection pool inside Cloudflare’s network, which is how you avoid the usual serverless failure: thousands of short-lived isolates each opening their own database connection. The getting-started guide describes the pool as removing the TCP, TLS and authentication round trips that otherwise happen before a query can be sent. You use the Hyperdrive connection string with existing drivers and ORMs. The database stays wherever you host it. [1](#r1) [2](#r2)

That is the optimisation. Cloudflare optimises the path from the Worker to the database. It does not relocate the primary.

### PostgreSQL without giving up edge speed

A write to a regional PostgreSQL primary still travels to that region. Cloudflare can remove connection-setup cost, and it can put the application and the security layer near the user. It cannot repeal the distance to the primary.

For reads that are safe to cache, Hyperdrive caches eligible query results. The default maximum age is 60 seconds, and you can set another. Hyperdrive does not invalidate a cached read when the application writes. When a read must show the write immediately, use a separate Hyperdrive configuration with caching disabled. That is an explicit consistency decision. [1](#r1)

Hyperdrive’s query cache is not the [CDN cache](/wiki/cache/). One caches eligible database reads. The other caches HTTP responses. Treat them as two switches, and name which one a given screen is allowed to use.

### An MCP and agent control plane

The agent should not open PostgreSQL.

It calls a tool hosted on a Worker:

```text
AI agent
  -> Cloudflare Access / OAuth / scoped permission
  -> Worker MCP tool
  -> tenant and policy checks
  -> PostgreSQL domain transaction via Hyperdrive
  -> audit event and structured result
```

Cloudflare’s remote MCP guide describes a deployment with no authentication, and a deployment with authentication and authorisation. In the second, a user signs in, and the server can decide which tools that user’s agent may call. Access can be the identity provider, or you can use a third-party OAuth service. [4](#r4)

That is the leverage. Cloudflare is the secure, globally deployed decision and execution layer above the database. The business version of the same idea is [agents and MCP](/insights/cloudflare-os-kai-agentic-mcp/). There is no separate wiki entry for MCP; the product boundary is the Worker plus Access.

### One platform for files, cache, jobs and data

You can keep the application, the security, the agent tools, the files and the database connectivity on one platform, and still leave the relational engine on PostgreSQL. Cloudflare’s storage guide describes applications that combine these products on purpose: KV for some state, R2 for files, Hyperdrive for a hosted Postgres or MySQL database. [3](#r3)

| Responsibility | Cloudflare | PostgreSQL |
| --- | --- | --- |
| Customer-facing site and app | Workers, Pages, CDN | None |
| API and business-tool endpoint | Worker | Durable domain data |
| Agent and MCP server | Worker, Access or OAuth, tool policy | The transaction, behind domain code |
| Relational system of record | Hyperdrive | Tables, constraints, transactions, indexes |
| Attachments and import files | R2 | File metadata and access references |
| Read-heavy global response | CDN cache, a D1 projection, or Hyperdrive’s query cache | The origin truth |
| Background processing | Queues, Workflows, Workers | Outbox and job state when the state is relational |

Choosing PostgreSQL keeps the product on Cloudflare. The database is an open relational core in the role where it is strongest. [In front, or a rebuild](/insights/cloudflare-in-front-or-rebuild-on-workers/) is the same instinct applied to a migration: move the application when that is the win, and leave the system of record where it already works.

## A shared CRM, as an illustration

Take a shared CRM on the scale of two million customers. That customer count is a scenario for the argument. It is not a deployment this page measured, and it is not a result from a Xolqy client.

A CRM of that size is not automatically too large for D1 by raw row count. A contacts table can stay modest. A real shared CRM then accumulates activity, pipelines, proposals, consent history, imports, integration events, an audit trail for staff and for agents, and the reports people run across teams.

As an illustration only, a lean contacts table at that scale might land around 2–6 GB once ordinary indexes are included, and the activity history might run to something like 20–100 million rows. Those two ranges are illustrative estimates. They are not measurements, they are not from a vendor page, and they are not a sizing guarantee for your schema. Use them to picture the shape of the problem. Then measure your own tables.

The shape is a PostgreSQL problem. The product around it is still a Cloudflare product. [Which Cloudflare products a business needs](/insights/which-cloudflare-products-a-business-needs/) is the buying version of that sentence.

### A layout that matches the jobs

| Data or responsibility | Best home | Why |
| --- | --- | --- |
| Customers, accounts, contacts, deals, orders, permissions | PostgreSQL | Shared relational truth: joins, constraints, transactions, reporting. |
| Worker API, dashboard backend, webhooks | Cloudflare Workers | The global application control plane, the security, and a fast deploy. |
| Worker-to-PostgreSQL connection | Hyperdrive | Pooled connectivity built for Workers, with the drivers and ORMs you already have. |
| Agent tools | A remote MCP server on a Worker | Access or OAuth, scope checks, idempotency, an approval step, an audit event. |
| Documents, CSVs, quote PDFs, images | R2 | Object storage, rather than a binary column in the relational database. |
| A hot, read-heavy summary | D1 or cache, rebuilt from PostgreSQL events | Low latency at the edge, without a second source of truth. |
| Sync, rebuild and export work | Queues, Workflows, Workers | Slow work stays off the customer request. |

### An agent prepares a proposal

1. An authenticated user asks an agent to prepare a proposal for a booked event.
2. The Worker MCP tool checks the user’s company, role and approved scope.
3. The Worker runs one PostgreSQL transaction. Availability, the pricing version, the venue option and the customer details are evaluated together.
4. PostgreSQL writes a draft proposal and an audit or outbox event.
5. A background job builds the PDF in R2 and, if you have defined one, refreshes a D1 read model.
6. The agent receives a structured result: proposal id, price, validity, and whether a person still has to approve it.
7. Only an approved tool may send the proposal or lock a scarce slot.

The product surface is Cloudflare throughout. PostgreSQL is the relational engine inside the system.

## Where D1 is the right tool

D1 is a strong product when you use it as an edge database. The mistake is treating it as the mandatory home for every business row. The decision procedure for D1 against KV and R2 is [the data-store guide](/insights/d1-vs-kv-vs-r2/). The short definition is the [D1 wiki entry](/wiki/d1/).

D1 is an excellent fit for:

- one compact, naturally independent database per tenant, property, location, merchant or project;
- a read model derived from PostgreSQL and distributed for global reads;
- lightweight product configuration, or a pricing and catalogue snapshot;
- agent task or session state, when that state is bounded and is not the financial or legal record;
- a focused edge-native application that will stay well under the per-database limit;
- a portable local database while you develop an edge-first service.

D1 read replication can place read-only copies closer to users. You only get sequential consistency for those copies through the Sessions API. Without Sessions, queries stay on the primary. That machinery belongs to one D1 database. It is not a log you can use to rebuild a second system of record. [6](#r6)

D1 should usually not be the only canonical store for:

- a shared CRM that will grow through history and reporting;
- commerce orders, refunds, stock and commission reconciliation;
- a booking or inventory engine where many users contend for the same scarce resource;
- a cross-tenant analytics system;
- a document or file archive.

Use D1 where it produces an edge advantage. Use PostgreSQL where the relational depth is the advantage.

## Two architectures that both stay on Cloudflare

### Pattern A: D1 first

Use this when the product breaks into small independent workspaces.

<figure class="diagram">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 364" width="640" height="364" role="img" aria-label="Pattern A. A user reaches a Cloudflare Worker, which uses D1 per tenant, R2 for files, and Queues for background work."><defs><marker id="pattern-a-arr" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#ff5a1f"/></marker></defs><line x1="320" y1="92" x2="320" y2="120" stroke="#ff5a1f" stroke-width="2" marker-end="url(#pattern-a-arr)"/><polyline points="320,204 320,240 114,240 114,268" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linejoin="miter" marker-end="url(#pattern-a-arr)"/><polyline points="320,204 320,268" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linejoin="miter" marker-end="url(#pattern-a-arr)"/><polyline points="320,204 320,240 526,240 526,268" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linejoin="miter" marker-end="url(#pattern-a-arr)"/><g><rect x="150" y="8" width="340" height="84" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><text x="170" y="32" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">REQUEST</text><text x="170" y="56" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">User</text><text x="170" y="76" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">One workspace at a time</text></g><g><rect x="90" y="120" width="460" height="84" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="90" y="120" width="5" height="84" fill="#ff5a1f"/><text x="110" y="144" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">COMPUTE</text><text x="110" y="168" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Worker, API and MCP</text><text x="110" y="188" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">The product runs on Cloudflare</text></g><g><rect x="16" y="268" width="196" height="84" fill="#f5f5f0" stroke="#ff5a1f" stroke-width="2.5"/><rect x="16" y="268" width="5" height="84" fill="#ff5a1f"/><text x="36" y="292" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">DATA</text><text x="36" y="316" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">D1</text><text x="36" y="336" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="13" fill="#0a0a0a" fill-opacity="0.68">A database per tenant</text></g><g><rect x="222" y="268" width="196" height="84" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="222" y="268" width="5" height="84" fill="#ff5a1f"/><text x="242" y="292" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">FILES</text><text x="242" y="316" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">R2</text><text x="242" y="336" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="13" fill="#f5f5f0" fill-opacity="0.72">Documents and exports</text></g><g><rect x="428" y="268" width="196" height="84" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="428" y="268" width="5" height="84" fill="#ff5a1f"/><text x="448" y="292" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">JOBS</text><text x="448" y="316" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Queues</text><text x="448" y="336" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="13" fill="#f5f5f0" fill-opacity="0.72">Background work</text></g></svg>
<figcaption>Pattern A. Each tenant gets its own small D1 database. Files go to R2. Slow work goes to a queue.</figcaption>
</figure>

A local-business product is the usual example: each restaurant, villa, building or shop has its own operational dataset. An illustrative estimate for that dataset is a few megabytes up to a few hundred megabytes — think of a band around 5–300 MB, as a picture of the shape, not as a measurement. At that size the per-database limit is not the constraint. The separate database is the isolation.

### Pattern B: PostgreSQL at the core, D1 at the edge

Use this when the business shares one set of customers, the workflow is more than a form, and somebody has to report across the company.

<figure class="diagram">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 636" width="640" height="636" role="img" aria-label="Pattern B. A user or AI client reaches a Worker and MCP control plane, then Hyperdrive and PostgreSQL. An outbox fans out to a D1 read model and to R2, BI and integrations."><defs><marker id="pattern-b-arr" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#ff5a1f"/></marker></defs><line x1="320" y1="84" x2="320" y2="108" stroke="#ff5a1f" stroke-width="2" marker-end="url(#pattern-b-arr)"/><line x1="320" y1="188" x2="320" y2="212" stroke="#ff5a1f" stroke-width="2" marker-end="url(#pattern-b-arr)"/><line x1="320" y1="292" x2="320" y2="316" stroke="#ff5a1f" stroke-width="2" marker-end="url(#pattern-b-arr)"/><line x1="320" y1="396" x2="320" y2="420" stroke="#ff5a1f" stroke-width="2" marker-end="url(#pattern-b-arr)"/><line x1="320" y1="500" x2="320" y2="518" stroke="#ff5a1f" stroke-width="2"/><polyline points="320,518 174,518 174,540" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linejoin="miter" marker-end="url(#pattern-b-arr)"/><polyline points="320,518 466,518 466,540" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linejoin="miter" marker-end="url(#pattern-b-arr)"/><g><rect x="48" y="4" width="544" height="80" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><text x="68" y="28" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">REQUEST</text><text x="68" y="52" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">User or AI client</text><text x="68" y="72" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">Staff, customer or agent</text></g><g><rect x="48" y="108" width="544" height="80" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="48" y="108" width="5" height="80" fill="#ff5a1f"/><text x="68" y="132" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">CONTROL</text><text x="68" y="156" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Worker and MCP</text><text x="68" y="176" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">Policy, scope and the API</text></g><g><rect x="48" y="212" width="544" height="80" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="48" y="212" width="5" height="80" fill="#ff5a1f"/><text x="68" y="236" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">POOL</text><text x="68" y="260" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Hyperdrive</text><text x="68" y="280" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">Pooling, and a cache for eligible reads</text></g><g><rect x="48" y="316" width="544" height="80" fill="#f5f5f0" stroke="#ff5a1f" stroke-width="2.5"/><rect x="48" y="316" width="5" height="80" fill="#ff5a1f"/><text x="68" y="340" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">RECORD</text><text x="68" y="364" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">PostgreSQL</text><text x="68" y="384" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">The canonical core</text></g><g><rect x="48" y="420" width="544" height="80" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><text x="68" y="444" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">EVENTS</text><text x="68" y="468" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">Outbox</text><text x="68" y="488" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">What changed, ready to fan out</text></g><g><rect x="48" y="540" width="252" height="88" fill="#ecece6" stroke="#0a0a0a" stroke-width="1.5"/><text x="68" y="564" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">EDGE</text><text x="68" y="588" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="17" font-weight="600" fill="#0a0a0a">D1 projection</text><text x="68" y="608" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="13" fill="#0a0a0a" fill-opacity="0.68">A read model you can rebuild</text></g><g><rect x="340" y="540" width="252" height="88" fill="#ecece6" stroke="#0a0a0a" stroke-width="1.5"/><text x="360" y="564" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">DOWNSTREAM</text><text x="360" y="588" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="17" font-weight="600" fill="#0a0a0a">R2, BI, integrations</text><text x="360" y="608" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="13" fill="#0a0a0a" fill-opacity="0.68">Files and other systems</text></g></svg>
<figcaption>Pattern B. The Worker reaches PostgreSQL through Hyperdrive. The boxes after the outbox are projections, not a second system of record.</figcaption>
</figure>

The examples are a multi-brand e-shop, an event-catering CRM, an insurance CRM, or a commerce operation with shared stock and orders. Cloudflare still owns the edge, the application delivery, the security, the API and MCP surface, and the asynchronous workflow. PostgreSQL owns the transactions.

## How a hybrid stays honest

A hybrid gets complicated when nobody can say which system is allowed to be right. Four rules prevent that.

### One canonical write path

For a shared business fact, one system has authority.

```text
PostgreSQL owns: customer, order, booking, payment, permission, inventory, invoice.
```

D1 may hold a copy only when that copy can be rebuilt from PostgreSQL or from the event stream.

### Do not treat a cache as a transaction engine

For stock, payments, the last booking slot and any state a lawyer would ask about:

- read and write through the canonical PostgreSQL transaction;
- send an idempotency key;
- do not decide from a stale cache on its own;
- refresh the D1 or cache projection after the authoritative change.

### Add D1 for a reason you can name

Do not add D1 because it is on the account. Add it when it earns one of these:

- a faster global read;
- tenant isolation;
- less operational work for a small, bounded domain;
- an edge read path that still works if the primary is briefly awkward to reach;
- a simple product module that is actually independent.

### Agents call actions, not SQL

Do not expose a raw database tool.

```text
Bad:  execute_sql(sql)
Good: create_quote_draft(account_id, lines, idempotency_key)
Good: reserve_venue_option(venue_id, starts_at, customer_id)
Good: get_customer_summary(customer_id)
```

The Worker enforces who is calling and what they are allowed to do. PostgreSQL enforces the durable state change. D1, if it is in the path, serves a defined edge purpose.

## Portability, speed and security

### Portability

PostgreSQL is a broad, open ecosystem. You choose the managed provider, the region, the backup policy, the analytics connection and a future migration path. Cloudflare remains the application edge. It does not become the only format your business data can take. Leaving a Worker is still a rewrite of the application. Leaving the database is a separate, often smaller, piece of work. [The landscape hub](/insights/research/edge-cloud-landscape/) makes that distinction for lock-in in general. It holds here too.

### Speed

For the customer, the Worker is still near the edge. Hyperdrive pools connections across Cloudflare’s network. Eligible reads can be served from Hyperdrive’s query cache, from a D1 projection, or from ordinary CDN cache.

An authoritative write has to reach the PostgreSQL primary, because a correct write has to reach a durable authority somewhere. Cloudflare makes that path operationally clean. It does not delete the distance, and it should not weaken the write in order to print a lower latency number.

### Security

The database does not have to be a public application endpoint. Workers can be the controlled gateway. Access and OAuth can scope which people, and which agent tools, are allowed to act. PostgreSQL adds database roles and row-level policy as defence in depth. The regional story — where the primary sits, and what you can pin — is [where the data lives](/insights/where-cloudflare-keeps-your-data/).

## Scorecard

| If this is true | Prefer this architecture |
| --- | --- |
| Each customer or workspace has a small, independent operational world. | A D1-first Cloudflare application. |
| One company shares customers, reporting, workflow, money or availability. | Cloudflare, Hyperdrive and a PostgreSQL core. |
| You need a global application and a durable relational truth. | Cloudflare and PostgreSQL, with D1 only for read models you have measured. |
| Agents must act on company data without a raw SQL door. | Worker-hosted MCP tools, auth and scope, an approval step, and PostgreSQL transactions. |
| Catalogue, profile or configuration reads must be fast globally. | Cache or a D1 projection, sourced from PostgreSQL when the data is shared. |
| You hold documents, media or import files. | R2, plus PostgreSQL metadata. Do not force the files into D1. |

## What to do with this

Cloudflare is a composable platform.

- D1 is an elegant edge-native database where it fits.
- Hyperdrive makes PostgreSQL feel native to Workers.
- Workers, Access, WAF, rate limits and remote MCP are the global application and agent layer.
- R2, Queues and the rest of the platform cover files and asynchronous work.
- PostgreSQL gives the business a robust, portable, relational system of record.

If you are the CTO, or the owner who will sign for the system, the default for a serious operational product is:

> **Cloudflare everywhere around the product. PostgreSQL at the durable transactional core. D1 at the edge only where it makes the product faster, simpler or more isolated.**

Cloudflare wins the architecture. PostgreSQL strengthens the part that holds the company’s truth.

## Move to Cloudflare OS with Xolqy

The reading stops here. The build is [Cloudflare OS](/cloudflare-os/): compute, data, security, AI and delivery designed as one system, in an account you own. The published offers are unchanged. The [Cloudflare OS package](/shop/#cloudflare-os) is $2,500. The [introduction](/shop/#os-introduction) is €600. This page does not add a price.

The wider argument for treating the platform as one system is [Cloudflare as an operating system](/insights/cloudflare-as-an-operating-system/).

## Also in this research

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/) (hub of the comparison series)
- [Cloudflare vs Supabase and Firebase](/insights/research/cloudflare-vs-supabase-firebase/)
- [D1, KV or R2](/insights/d1-vs-kv-vs-r2/)
- [Where Cloudflare keeps your data](/insights/where-cloudflare-keeps-your-data/)
- [In front, or a rebuild](/insights/cloudflare-in-front-or-rebuild-on-workers/)

Validate live service limits, pricing, regional routing, cache-consistency requirements and the managed-PostgreSQL provider before you commit a production design. The pages below are what this article relied on.

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/get-started/">Getting started · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-10. Connection pooling, existing drivers and ORMs, default query caching, the 60-second default maximum age, and cache-disabled reads for read-after-write consistency.</li>
  <li id="r2">Cloudflare. <a href="https://developers.cloudflare.com/workers/databases/connecting-to-databases/">Connect to databases · Cloudflare Workers docs</a>. Accessed 2026-10-10. Hyperdrive is the recommended way for Workers to reach PostgreSQL.</li>
  <li id="r3">Cloudflare. <a href="https://developers.cloudflare.com/workers/platform/storage-options/">Choose a data or storage product · Cloudflare Workers docs</a>. Accessed 2026-10-10. Using R2, KV, D1 and Hyperdrive together, including Hyperdrive to hosted Postgres or MySQL.</li>
  <li id="r4">Cloudflare. <a href="https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/">Build a Remote MCP server · Cloudflare Agents docs</a>. Accessed 2026-10-10. Remote MCP on Workers, with and without authentication, and tool access scoped to the user’s permissions.</li>
  <li id="r5">Cloudflare. <a href="https://developers.cloudflare.com/d1/platform/limits/">Limits · Cloudflare D1 docs</a>. Accessed 2026-10-10. The 10 GB paid-plan maximum per database, the statement that the cap cannot be increased, and single-threaded query execution.</li>
  <li id="r6">Cloudflare. <a href="https://developers.cloudflare.com/d1/best-practices/read-replication/">Global read replication · Cloudflare D1 docs</a>. Accessed 2026-10-10. Sessions API, read replicas, and sequential consistency.</li>
</ol>
