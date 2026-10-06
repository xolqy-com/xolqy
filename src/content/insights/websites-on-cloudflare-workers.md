---
title: Why your next website belongs on Cloudflare Workers, and when it does not
description: What changes when a website runs on Workers with Static Assets instead of a server, what it costs, what breaks, and the three questions that decide whether it is the right move for you.
publishedAt: 2026-09-22
audience: both
topics: [Workers, Static Assets, Astro, Hosting]
readingMinutes: 9
relatedServices: [websites-and-applications, cloudflare-migration]
---

Most websites still run the way they did fifteen years ago: a server somewhere, a runtime on it, a CMS generating HTML on every request, a CDN bolted on in front to hide the delay. It works. It is also the reason your site is fast in one city and slow in the rest of the world, why traffic spikes are scary, and why "hosting" is a line in the budget that only ever goes up.

Workers with Static Assets is a different model. This article explains what actually changes, where the catches are, and how to decide.

## What a Workers website is

A Worker is a small program that runs in every Cloudflare location, close to whoever is asking. Static Assets lets that same deployment carry files: HTML, CSS, JavaScript, fonts, images. A request for a page that exists as a file is served straight from the edge without running any code. A request for something dynamic (an API call, a personalised page, a form submission) runs the Worker.

In practice, a site built with a framework such as Astro is prerendered at build time into HTML files, and only the handful of routes that need live data run as code. The visitor in Athens, Singapore or São Paulo gets the page from a location near them, with no origin server involved.

This is not "static hosting with functions". The Worker has access to a full platform in the same deployment: a SQL database (D1), object storage (R2), a key-value store (KV), queues, durable coordination (Durable Objects), AI models, email sending. A contact form that validates input, stores the enquiry, queues a notification and sends an email is a few files in the same repository, not a separate service.

## What changes for the business

**Speed stops depending on geography.** The first byte of a prerendered page comes from the nearest Cloudflare location. For a site whose visitors are spread across countries, this is the single largest improvement available, and it applies to every page.

**Capacity stops being a decision.** There is no instance size to pick and nothing to scale. A campaign that sends ten times the usual traffic is served the same way as a quiet Tuesday. The cost is per request and per unit of storage, so a spike costs more that month and nothing the next.

**Operations shrink.** No operating system to patch, no runtime to upgrade on a schedule, no disk to fill up, no certificate to renew by hand. What remains is application-level: dependencies, content, configuration. For a small team, this is the difference between owning a website and running a server.

**Cost becomes proportional.** At the time of writing, the Workers Paid plan is a small fixed monthly fee plus usage, and static asset requests are free. Many business sites fit within the included allowances. R2 has no egress fees, which matters for sites with downloads or media. We model this per client from real traffic rather than quoting a number here, because the answer depends on request volume and on how much dynamic work the site does.

## What changes for developers

**Prerender by default, render on demand by exception.** Frameworks with Cloudflare adapters (Astro, Next.js via OpenNext, SvelteKit, Nuxt, Remix and others) let you mark which routes are static and which are dynamic. The discipline is to keep the dynamic set small and to cache its output where possible.

**Bindings instead of connection strings.** The Worker reaches D1, KV, R2 and the other services through typed bindings declared in configuration. There are no credentials in environment variables for your own data layer, and the types are generated from the configuration, so a missing binding is a compile error rather than a runtime surprise.

**Local development runs the real runtime.** The Cloudflare Vite plugin runs your site in `workerd` locally, with local simulations of D1, KV, R2, Queues, Durable Objects and Workflows. Workers AI and Vectorize have no local simulation and are used remotely during development. Your code behaves the same locally and in production, which removes a whole class of "works on my machine" problems.

**Deployment is one command, rollback is one command.** `wrangler deploy` uploads the assets and the code as a versioned deployment. `wrangler rollback` returns to the previous one. Branch previews come from Workers Builds or your CI.

## Where the catches are

Honesty about limits is the point of this article, so here are the ones that matter.

**It is a different runtime.** Workers run JavaScript and WebAssembly on V8, not Node.js. Most modern libraries work, and the `nodejs_compat` flag covers a large part of the Node API surface, but anything that needs a native binary, a long-lived process, or a filesystem will not. Image processing with native libraries is the usual example; Cloudflare Images exists for exactly that reason.

**Request time is bounded.** CPU time per request has a limit (configurable, and generous for web work, but it exists). Long-running jobs belong in Queues, Workflows or Durable Object alarms, not in a request. This is a feature once you design for it, and a wall if you do not.

**The CMS question has to be answered.** A Workers site is not a place to install WordPress. If editors need WordPress, it stays where it is as a headless source and the Workers site reads from it, or Cloudflare sits in front of it as a cache and shield. Both are valid. Rebuilding the frontend is a project; fronting the origin is not.

**Vendor dependence is real, in a specific way.** The code is standard web platform code (Request, Response, fetch, Web Crypto), and the frameworks are portable. The bindings and the data services are Cloudflare's. Moving away means replacing D1 with another SQLite or Postgres, R2 with another S3-compatible store, and so on. That is a migration, not a rewrite, but it is not free.

**Some features have plan requirements.** Email sending from Workers, for example, needs the paid plan at the time of writing. We list these per project so there are no surprises on the first invoice.

## Three questions that decide it

**Who are your visitors and where are they?** If they are spread across regions, or on mobile networks, edge delivery is the largest lever you have. If every visitor is in one city on fast connections, the gain is smaller (still real, but smaller).

**How much of the site is actually dynamic?** Marketing sites, documentation, catalogues, content sites: almost nothing, and they are ideal. Applications with heavy per-request computation need the architecture stage to confirm the fit, and sometimes the answer is a Workers frontend with the heavy part elsewhere, connected through Hyperdrive or a Tunnel.

**What does your team maintain today?** If a server, a runtime and a CMS are consuming attention that should go to the product, removing them is worth more than the hosting invoice suggests. If a team already runs that stack well and the site is fast, the case is weaker.

## How we do it

Our website projects follow the pattern above: Astro, prerendered pages, a Worker for the dynamic routes, D1 for records, R2 for files, Queues and Workflows for anything that should not run inside a request. The architecture stage classifies every page and every piece of data before the first line of code, and the result is documented for your team.

This site is built the same way; the [stack page](/stack/) shows every piece and whether it is live. If you want to know whether your site is a fit, the [Cloudflare Audit](/contact/?interest=audit) answers that question with your own data.
