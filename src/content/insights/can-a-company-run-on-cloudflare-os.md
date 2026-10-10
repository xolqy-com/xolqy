---
title: "Can a company run on Cloudflare OS?"
description: Cloudflare OS is Cloudflare’s open-source AI workspace. A company can be Cloudflare-first. It should not try to be Cloudflare-only. Sources read on 10 October 2026.
publishedAt: 2026-10-10T12:00:00.000Z
audience: both
topics: ["Research", "Cloudflare OS", Architecture]
readingMinutes: 16
relatedServices: [websites-and-applications, cloudflare-migration, ai-and-automation, security-and-zero-trust, managed-cloudflare]
type: research
researchRole: hub
series: can-a-company-run-on-cloudflare-os
seriesOrder: 0
sourcesAt: 2026-10-10
---

This is for a CTO, or for the owner who will have to live with the choice. Cloudflare OS is Cloudflare’s open-source AI workspace. The Cloudflare platform around it can hold a large part of a digital company. “Exclusive” is the wrong target.

The platform comparison is [the edge cloud landscape](/insights/research/edge-cloud-landscape/). The database split, PostgreSQL through [Hyperdrive](/wiki/hyperdrive/) and [D1](/wiki/d1/) only where an edge copy earns it, is [the hybrid architecture](/insights/research/cloudflare-postgresql-d1-hybrid/). This page is the question those two leave open: can the company itself run on Cloudflare OS?

## The short answer

A digital company can put a large share of its application and control plane on Cloudflare: sites, APIs, files, access, edge data and the path agents use to call tools.

Cloudflare OS does not replace the company. The repository says it is not a traditional computer operating system. It says the point is not that your company “uses Cloudflare OS”, but that you make it your company’s OS: context, skills and connections that match how you already work. [2](#r2)

So the useful conclusion is:

> **Run Cloudflare-first, not Cloudflare-only. Use Cloudflare OS as the AI work layer. Keep the specialist systems of record where they are strongest.**

The company that wins is not the one with the fewest vendors. It is the one that can connect them under a policy, see what an agent did, and replace a component without rebuilding the firm.

## Executive summary

<aside class="research-summary" data-theme="dark">
  <p>Cloudflare OS is an open-source agent workspace Cloudflare built for its own staff and published for other companies to deploy. Workspaces, gadgets and Gatekeepers run on Workers. People enter through Access. Agents start with no access. A Gatekeeper holds the credential and can require a person to approve an action that has a side effect.</p>
  <p>It is early access. The README, still carrying its August 2026 note when read on 10 October 2026, calls version 2 a complete rewrite, capable, with many rough edges. You can deploy it into your own Cloudflare account. A fully managed dashboard deployment is a waitlist, not general availability. A documented install on your own servers, on the open-source workerd runtime, is marked coming soon.</p>
  <p>Headcount figures below are Cloudflare’s own. This page did not count employees or customer organisations. It does not add a price. The only Xolqy prices named are the ones already on the shop.</p>
</aside>

## What Cloudflare OS actually is

Cloudflare OS is an AI productivity environment Cloudflare originally built for its own workforce. The README uses “operating system” in two senses: an operating system for the company to be productive with AI, safely, and an operating system for AI workloads, in the way a traditional operating system manages compute. [2](#r2)

It is not a traditional computer operating system, and it is not a general ERP, CRM, accounting suite, email host or payments network. Those limits are the product’s shape, not a gap in a feature list. The 5 August 2026 post describes three parts: an agent workspace grounded in company context, with an isolated runtime where the agent can write and run code; a security model for access to internal systems; and personal apps people can build, share and keep changing. [1](#r1)

| Part | What the sources say it does |
| --- | --- |
| Agent workspace | A browser workspace: sessions, files, resource access, and company context and skills. You do not need a terminal. [1](#r1) |
| Gadgets and blueprints | A gadget is a private instance of an app, with its own state. A blueprint lets someone else create their own copy of the code, without the original SQLite data, conversation, credentials or connected resources. [1](#r1) [2](#r2) |
| Gatekeepers | A service-specific Worker between Cloudflare OS and an external system. It holds the credential, narrows which resource can be used, logs what was read, and can require approval before a side effect. [1](#r1) [2](#r2) |

The runtime is specific. Every workspace is a Durable Object. Every gadget runs in a Dynamic Worker Facet, with its own SQLite database, separate from the Cloudflare OS runtime. The client runs in a sandboxed frame. Server code in that Dynamic Worker has global outbound networking disabled: it reaches the network only through a capability you granted. Gatekeepers are separate Workers, and they also install facets into a workspace to manage remote access. [1](#r1) [2](#r2)

[Workers](/wiki/workers/) and [Durable Objects](/wiki/durable-objects/) are the platform primitives. There is no wiki entry for Dynamic Workers or for MCP. The product boundary for MCP on this site is the [agents article](/insights/cloudflare-os-kai-agentic-mcp/) plus a Worker.

The word external is the design. The 5 August post says Cloudflare OS reaches systems of record through Gatekeepers, and existing MCP servers through what it calls MCP Server Portals. [1](#r1) The README ships Gatekeeper packages for GitHub, Google, Cloudflare, Supabase, Notion, Confluence, Email Workers, Home Assistant, Slack, Spotify and ZoomInfo. Each one needs its own credentials. The Slack package is documented as read-only: it does not send or modify Slack data. [2](#r2) [5](#r5)

That list is the repository on 10 October 2026. It is not a managed-product catalogue, and it is not a promise that every package is equally finished. Microsoft 365 is not in it. The 1 October post says built-in documents can export to Excel, CSV, PDF, Markdown or HTML, and that Word and PowerPoint export is coming soon. [3](#r3)

## Three questions, not one

“Can we operate exclusively on Cloudflare?” hides three decisions.

| Question | What the sources support |
| --- | --- |
| Can a customer-facing product live mostly on Cloudflare? | Often yes, for sites, APIs, files, access and modest edge data. The limits are in the [landscape hub](/insights/research/edge-cloud-landscape/) and the [hybrid architecture](/insights/research/cloudflare-postgresql-d1-hybrid/). |
| Can Cloudflare OS be a place staff and agents do a lot of work? | That is what it is for. It is early access, and the rollout has to be deliberate. [1](#r1) [2](#r2) |
| Can Cloudflare OS replace every other system? | No. Gatekeepers exist because company data already lives somewhere else. [1](#r1) |

The right ambition is operational coherence: a request, a person, an agent and a data connection pass through a policy you can name. Cloudflare is credible as that layer. Cloudflare OS is the workspace on top of it, not the company.

## What can sit on Cloudflare today

These rows are the platform, not features of the Cloudflare OS repository. Where a wiki entry exists, it is the short definition. Where this page does not cite a limit, it is not stating one.

| Job | Cloudflare-side option | External system |
| --- | --- | --- |
| DNS, TLS and delivery | [DNS](/wiki/dns/), [TLS](/wiki/tls-ssl/), [cache](/wiki/cache/) | A registrar is a separate decision. This page does not audit which TLDs anyone sells. |
| Public sites and portals | [Pages](/wiki/pages/), [Workers](/wiki/workers/) | Not required for many web workloads. |
| APIs and business logic | Workers, [Durable Objects](/wiki/durable-objects/), [Workflows](/wiki/workflows/), [Queues](/wiki/queues/) | Not required for request-shaped work that fits the platform. |
| Bounded internal tools | Cloudflare OS gadgets | Not required for a tool whose state fits a gadget. The gadget is not your CRM. |
| Agent control plane | Cloudflare OS, Workers, [Access](/wiki/zero-trust-access/), [AI Gateway](/wiki/ai-gateway/) | The 5 August post says any model can be used, with every inference call through AI Gateway. The README says many major providers and self-hosted models, with more being added. Model vendors can remain external. [1](#r1) [2](#r2) |
| Who may open a tool | Access, and [Tunnel](/wiki/cloudflare-tunnel/) when the origin should not be public | Usually an identity provider Access already supports. This page does not restate Access pricing. |
| Files and exports | [R2](/wiki/r2/) | Not required for object storage. |
| Small or isolated application data | [D1](/wiki/d1/), Durable Objects, [KV](/wiki/kv/) | Not required when the data shape matches. D1’s size cap is argued in the hybrid piece, not repeated here. |
| A shared operational database | [Hyperdrive](/wiki/hyperdrive/) to PostgreSQL or MySQL | The database can stay outside Cloudflare. Hyperdrive is a Workers product. It is not a component of Cloudflare OS. [6](#r6) |
| Mail, calendar, chat, CRM | A Gatekeeper where the repo has one | Google Workspace is documented, including Gmail read, drafts and send. Slack’s package is read-only. A CRM is normally still the CRM. [3](#r3) [5](#r5) |
| Source code | GitHub Gatekeeper, and the 1 October GitHub workflow | GitHub is the documented host. GitLab is not a Gatekeeper in the README list. You can still keep it as the system of record. [2](#r2) [3](#r3) |
| Accounting, payroll, tax, banking, payment settlement | An approval in front of a specialist system, if you connect one | These stay specialist systems. This page found no Gatekeeper for them. |

A company can be Cloudflare-native at the application and control plane and still refuse to pretend that every useful system is a Cloudflare database.

## Why the security model is the product

Most company AI tools start with a model and then add connectors. Cloudflare OS starts from the opposite problem: an agent that can touch real systems without a long-lived key to all of them.

### Agents start with nothing

Access decides who can enter. Inside, the 5 August post says every agent and app starts with access to nothing. A person grants a specific resource. Generated code receives a typed capability. The credential stays with the Gatekeeper, not in the prompt and not in the gadget. [1](#r1)

The README contrasts that with a harness where MCP servers are configured up front, so broad access is ambient in every chat. [2](#r2)

### A Gatekeeper knows the service

Cloudflare’s own example is GitHub. A Gatekeeper can allow one repository, allow issues but not source, mask a field, apply a rate limit, and require approval before a pull request is merged. The agent sees a small API. The Gatekeeper holds OAuth, enforces the policy, records what was read, and mediates anything with an external side effect. [1](#r1)

Approval is not only a modal that stops the agent. The README says a Gatekeeper can simulate the outcome, let the agent continue, and queue the real actions for a person to accept or reject later, including in bulk. [2](#r2)

Do not read that as “email cannot be sent”. The 1 October post says the Google Workspace Gatekeeper can read Gmail, create drafts and send. Sending is a capability. Whether a person must approve it is a policy. [3](#r3)

### Policy follows what the agent has already seen

If an agent reads a sensitive table and produces a dashboard, sharing the dashboard must not share the table with someone who could not open the table. Cloudflare OS records resource observations. When someone else opens the workspace, views the output or triggers an external action, Gatekeepers check that person’s access to what was observed. A sensitive read can also block a later write, a new collaborator or an outbound call. [1](#r1)

That is not a cure for AI governance. It is a better starting architecture than a chatbot with a key to everything.

## It sits above the systems you already have

<figure class="diagram">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480" role="img" aria-label="People and agents enter a Cloudflare OS workspace, then Access and Gatekeepers. From there the path splits to company systems of record and to Cloudflare-native apps."><defs><marker id="os-arr" viewBox="0 0 8 8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#ff5a1f"/></marker></defs><line x1="320" y1="88" x2="320" y2="116" stroke="#ff5a1f" stroke-width="2" marker-end="url(#os-arr)"/><line x1="320" y1="200" x2="320" y2="228" stroke="#ff5a1f" stroke-width="2" marker-end="url(#os-arr)"/><line x1="320" y1="312" x2="320" y2="336" stroke="#ff5a1f" stroke-width="2"/><polyline points="320,336 162,336 162,360" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linejoin="miter" marker-end="url(#os-arr)"/><polyline points="320,336 478,336 478,360" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linejoin="miter" marker-end="url(#os-arr)"/><g><rect x="36" y="4" width="568" height="84" fill="#f5f5f0" stroke="#0a0a0a" stroke-width="1.5"/><text x="56" y="28" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">REQUEST</text><text x="56" y="52" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">People and AI agents</text><text x="56" y="72" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">Staff and models. Not a key to every system.</text></g><g><rect x="36" y="116" width="568" height="84" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="36" y="116" width="5" height="84" fill="#ff5a1f"/><text x="56" y="140" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">WORKSPACE</text><text x="56" y="164" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Cloudflare OS workspace</text><text x="56" y="184" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">Browser workspace, skills and gadgets</text></g><g><rect x="36" y="228" width="568" height="84" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="36" y="228" width="5" height="84" fill="#ff5a1f"/><text x="56" y="252" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">POLICY</text><text x="56" y="276" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Access and Gatekeepers</text><text x="56" y="296" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">Who may enter, and what an agent may touch</text></g><g><rect x="16" y="360" width="292" height="108" fill="#f5f5f0" stroke="#ff5a1f" stroke-width="2.5"/><rect x="16" y="360" width="5" height="108" fill="#ff5a1f"/><text x="36" y="384" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">RECORD</text><text x="36" y="408" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#0a0a0a">Systems of record</text><text x="36" y="432" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">Git, mail, CRM, finance,</text><text x="36" y="450" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#0a0a0a" fill-opacity="0.68">databases</text></g><g><rect x="332" y="360" width="292" height="108" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="1.5"/><rect x="332" y="360" width="5" height="108" fill="#ff5a1f"/><text x="352" y="384" font-family="JetBrains Mono Variable, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.5" fill="#ff5a1f">EDGE</text><text x="352" y="408" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="18" font-weight="600" fill="#f5f5f0">Cloudflare-native apps</text><text x="352" y="432" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">Workers, R2, D1,</text><text x="352" y="450" font-family="Bricolage Grotesque Variable, system-ui, sans-serif" font-size="14" fill="#f5f5f0" fill-opacity="0.72">Durable Objects</text></g></svg>
<figcaption>Work starts in the workspace. Gatekeepers decide what is allowed. Systems of record stay the source of truth. Cloudflare-native apps are a second path, not a substitute for those systems.</figcaption>
</figure>

A rollout can be valuable while the company keeps Google Workspace or Microsoft 365, a CRM, GitHub or another Git host, PostgreSQL, an accounts package, and more than one model vendor. The 5 August post says inference goes through AI Gateway so the company can choose the model per job, attribute spend, and set budgets and rate limits. [1](#r1)

Cloudflare names two implementation partners in that post, Presidio and Happy Cog. The press page also says “and others”. Xolqy is not named. Nothing on this page is a Cloudflare endorsement. [1](#r1) [4](#r4)

## Early access, in Cloudflare’s own words

Cloudflare’s account of its own use is consistent across two August pages. The 5 August post says thousands of people, across every function, use it every day to create documents and slides, automate repeatable tasks and build small apps. It also says that in May of that year Cloudflare gave every person at the company access to version 1. The press page says thousands of Cloudflare employees, across every team, use it daily. [1](#r1) [4](#r4)

The 1 October post says thousands of organisations have started using the open-source release to work with company data, produce documents and slides, build tools and automate work. [3](#r3)

Those sentences are Cloudflare writing about Cloudflare. They are not an independent census, and they are not a customer case study.

The README is plainer about maturity. Read on 10 October 2026, it still says this:

- The repository is version 2, a complete rewrite of version 1.
- As of the August 2026 release, version 2 is very capable and still has many rough edges.
- Readers should treat that release as early access.
- You can deploy into your own Cloudflare account. The public deploy page describes a wizard that signs in with Cloudflare, creates Workers, KV namespaces and an R2 bucket, and a `workers.dev` URL. Access emails a one-time PIN. That is the wizard, not a finished company rollout.
- Running on your own servers, on open-source workerd, is marked coming soon. The README says the runtime can host it, and that the documentation for that path is not finished. [2](#r2) [7](#r7)

A second repository, the starter, is the place the README points to for a deployment with your own Gatekeepers. It exists. [8](#r8)

The 5 August post said Cloudflare was working on a dashboard product, containers for development workflows, and bringing workspaces into Slack and other chat tools. On 1 October the dashboard path is a waitlist for a fully managed deployment, not general availability. That post does not say containers have shipped, and it does not say the workspace now lives inside Slack. The read-only Slack Gatekeeper is a different thing. [1](#r1) [3](#r3) [5](#r5)

A responsible start is not “every employee, every critical process, next month”. It is a small group, a workspace, two read-only resources, a measurement, and only then a narrowly approved action.

The press page is headed 5 August 2026. Its dateline says 4 August 2026. The body both says Cloudflare “will launch” Cloudflare OS and that it is available now through the open-source repository. The repository and the 5 August post are the availability this page could open. [4](#r4)

## The database question does not go away

A gadget’s SQLite, a Durable Object, D1 and R2 can hold a bounded internal tool: a content tracker, a research app, a proposal draft, a small dashboard. That state is the gadget’s state. It is not automatically the company’s books.

A shared CRM, a commerce core, a ledger or a booking engine that many people contend for is a PostgreSQL problem. The hybrid piece is the argument, including D1’s published cap. This page does not restate those limits.

The path is a recommendation, not a Cloudflare OS feature:

```text
Cloudflare OS or a Worker tool
  -> policy, scope, approval, audit
  -> Hyperdrive
  -> PostgreSQL
  -> outbox
  -> a D1 or cache read model, only if you can rebuild it
```

Hyperdrive pools connections from Workers to an existing PostgreSQL or MySQL database, and it can cache eligible reads. The primary stays where you host it. [6](#r6) Cloudflare-only is the narrower idea. Cloudflare-first, with PostgreSQL where the rows are shared, is the stronger one.

## What Cloudflare-first looks like

Take a digital agency, a publisher, a software studio or a commerce operator. Two layers, kept distinct.

### The platform

- DNS, TLS and the cache are on Cloudflare.
- Public sites run on Pages or Workers.
- APIs run on Workers.
- The public surface uses the [WAF](/wiki/waf/), [rate limiting](/wiki/rate-limiting/) and bot controls where the route needs them, and Access where a person should have to sign in.
- Files and exports sit in R2.
- Small, separate datasets can use D1 and Durable Objects.
- Slow work uses Queues, Workflows and scheduled Workers.
- Model calls go through AI Gateway.
- Tools for agents are remote and scoped. They are not a raw database login.

### The workspace

- Staff ask for research, a briefing, a draft, or a gadget for a job that does not deserve a software project.
- Shared skills hold a repeatable way of working: a checklist, a pricing rule, an incident note. Someone owns the skill, or it goes stale.
- Gatekeepers connect the few systems you named. Write access comes after the read-only path has earned it.
- A known sequence stays code. A model runs only where judgement is the point. The 5 August post describes that split as workflows. [1](#r1)

### What stays outside, on purpose

- PostgreSQL, when the relational core is shared.
- GitHub, as the code host the product documents. Another Git host, if you already have one.
- Google Workspace, if that is where mail and files already live. Microsoft 365, if that is the suite you have, is not a Gatekeeper in the published list.
- Banks, tax systems, payroll and payment networks.
- More than one model vendor, routed through AI Gateway.

That is not impurity. It is a company that owns the operating layer and refuses to rebuild banking.

## A rollout that matches the maturity

This sequence is a recommendation. It is not a Cloudflare programme, and it is not a timeline.

### Phase 1: read-only

Deploy into your Cloudflare account. Connect context and one or two low-risk, read-only resources: a named Drive folder, one GitHub repository, an internal note, a reporting export.

The measure is time saved on research, a briefing or a technical summary. If you cannot name the saving, do not add write access to hide it.

### Phase 2: shared skills

Write skills for work you already repeat: an audit brief, a proposal, onboarding, a publishing check, an incident list. Give each important skill an owner and a review date. Confirm the output is repeatable before anyone grants a write.

### Phase 3: narrow actions

Permit low-risk actions through a Gatekeeper or your own Worker API. Draft an email before you allow send. Create a task. Open a pull request. Draft a quote. Refresh a report. Update a staging row.

A person stays in the path for money, publishing, access changes, deletion and a promise to a customer. The product can send email and can merge a pull request. Phase 3 is the decision not to let it, yet.

### Phase 4: gadgets for internal jobs

A meeting brief, an editorial board, a campaign check, an availability view, a sales dashboard. At this point the workspace is a way to build internal software, with a blueprint if a second team wants its own copy.

### Phase 5: the operational core

Only then should an agent touch a high-value system, and only through a named action. One system of record. Idempotent writes. An audit log you keep. The hybrid piece is the data half of that rule.

## Risks worth writing down

| Risk | Why it matters | A sane response |
| --- | --- | --- |
| Early access | The README still calls the August 2026 release early access, with rough edges. | Pilot. Keep exports. Know how you turn it off. |
| A connector that is too wide | An agent moves information faster than a person. | Start from zero access. Name the resource. |
| Skills that go stale | Context becomes a second, wrong handbook. | An owner and a review date on anything an agent treats as policy. |
| One model supplier | The best model for a job changes, and so does the price. | Route through AI Gateway. Judge cost and quality per task. [1](#r1) |
| A false “Cloudflare-only” story | The diagram hides the CRM, the ledger and the exit path. | Write down the system of record, and how you export. |
| An action with no approval | Money, mail and customer commitments are side effects. | Draft, approve, then execute. Make the write idempotent. |
| Treating the wizard as the rollout | The deploy page stands up Workers, KV and R2 on a `workers.dev` hostname. | That is a sandbox. A company still has to bring context, Gatekeepers and policy. [7](#r7) |

The mature position is a useful workspace, a narrow capability, policy on what the agent has already seen, and a person on the action that leaves the building.

## Verdict

Cloudflare OS makes a particular company imaginable: a browser workspace, agents, internal apps, a capability check, and the Cloudflare platform underneath for delivery, compute and a large part of the application.

The product also tells you not to confuse that with throwing away every other vendor. It connects to systems you already have. It expects more than one model. It is open source so the deployment can become yours. The README still says early access.

Can a company operate exclusively on Cloudflare OS?

**No. Not literally, and not wisely.**

Can it operate Cloudflare-first, with Cloudflare OS as the AI work layer and Cloudflare as the security, application and integration plane?

**Yes. That is the achievable version.**

## Cloudflare OS Implementation by Xolqy

Cloudflare OS is Cloudflare’s open-source platform. Xolqy is an independent implementation partner. Cloudflare’s announcement names Presidio and Happy Cog. It does not name Xolqy, and this is not an endorsement.

Xolqy runs the pilot in phases 1 to 3 above, and the Cloudflare-first build around it. The page is [Cloudflare OS Implementation by Xolqy](/cloudflare-os/). Prices on the shop are unchanged: the [package](/shop/#cloudflare-os) is $2,500, and the [introduction](/shop/#os-introduction) is €600. This page does not add one.

## Also in this research

- [The edge cloud landscape](/insights/research/edge-cloud-landscape/)
- [Cloudflare, PostgreSQL and D1](/insights/research/cloudflare-postgresql-d1-hybrid/)
- [D1](/wiki/d1/), [Hyperdrive](/wiki/hyperdrive/), [R2](/wiki/r2/), [Workers](/wiki/workers/), [Durable Objects](/wiki/durable-objects/)
- [Access](/wiki/zero-trust-access/), [AI Gateway](/wiki/ai-gateway/), [Queues](/wiki/queues/), [Workflows](/wiki/workflows/)

Validate the README’s early-access note, the managed waitlist, Gatekeeper scope and the model bill before you put a consequential workflow on it. The pages below are what this article relied on.

## References

<ol class="refs">
  <li id="r1">Cloudflare. <a href="https://blog.cloudflare.com/cloudflare-os/">Cloudflare OS: an open platform for agents, apps, and work</a>. Phillip Jones and Dan Carter, 5 August 2026. Accessed 2026-10-10. Workspaces, gadgets, blueprints, Gatekeepers, zero access, observation policy, AI Gateway, the GitHub example, Presidio and Happy Cog, and the note that containers and in-chat workspaces were still in progress.</li>
  <li id="r2">Cloudflare. <a href="https://github.com/cloudflare/cloudflare-os">cloudflare/cloudflare-os</a> README. Accessed 2026-10-10. Not a traditional operating system; the two senses of “OS”; version 2 as a complete rewrite; the August 2026 early-access note, still present; Durable Objects, Dynamic Worker Facets and Gatekeeper Workers; the Gatekeeper package list; workerd on your own servers marked coming soon.</li>
  <li id="r3">Cloudflare. <a href="https://blog.cloudflare.com/managed-cloudflare-os/">Cloudflare OS: your company’s agent workspace, managed for you</a>. Phillip Jones, 1 October 2026. Accessed 2026-10-10. Managed waitlist, GitHub repository workflow, Google Workspace Gatekeeper including Gmail drafts and send, export formats, and Cloudflare’s statement that thousands of organisations had started using the open-source release.</li>
  <li id="r4">Cloudflare. <a href="https://www.cloudflare.com/press/press-releases/2026/cloudflare-os-is-the-first-ai-workspace-built-around-how-companies-actually-work/">Cloudflare OS Is the First AI Workspace Built Around How Companies Actually Work</a>. Press page headed 5 August 2026; dateline 4 August 2026. Accessed 2026-10-10. Open-source availability, Cloudflare’s statement on employee use, and named partners including Presidio and Happy Cog.</li>
  <li id="r5">Cloudflare. <a href="https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-slack/README.md">Slack gatekeeper</a>, in the cloudflare-os repository. Accessed 2026-10-10. Read-only access to a workspace, conversation or thread. The package does not send or modify Slack data.</li>
  <li id="r6">Cloudflare. <a href="https://developers.cloudflare.com/hyperdrive/get-started/">Getting started · Cloudflare Hyperdrive docs</a>. Accessed 2026-10-10. Hyperdrive connects Workers to existing PostgreSQL, MySQL and compatible databases. It is not part of Cloudflare OS.</li>
  <li id="r7">Cloudflare. <a href="https://os.cloudflare.app/deploy">Deploy Cloudflare OS</a>. Accessed 2026-10-10. The wizard the README links: Cloudflare sign-in, Workers, KV namespaces, an R2 bucket, a workers.dev URL, and an Access one-time PIN. Built-in models bill through that instance’s AI Gateway.</li>
  <li id="r8">Cloudflare. <a href="https://github.com/cloudflare/cloudflare-os-starter">cloudflare/cloudflare-os-starter</a>. Accessed 2026-10-10. The starter the README points to for a deployment you customise.</li>
</ol>
