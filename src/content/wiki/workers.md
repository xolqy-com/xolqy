---
term: "Cloudflare Workers"
category: Compute
summary: "Workers is Cloudflare's serverless platform: your code runs in every Cloudflare location, close to the person making the request, with no servers to manage. It handles APIs, server-rendered pages, middleware and whole applications, and it is the runtime underneath most other Cloudflare developer products."
docs: "https://developers.cloudflare.com/workers/"
useWhen: "Any request-driven code: APIs, server rendering, redirects and headers, authentication, webhooks, scheduled jobs, and full applications that use D1, KV, R2 and the rest of the platform through bindings."
avoidWhen: "Long-running CPU-heavy work such as video transcoding or large batch jobs, software that needs a persistent process or local disk, and anything that must run inside one specific country for legal reasons without Cloudflare's data localisation products."
pricing: "A free tier with a daily request allowance and a short CPU budget per request, and a Workers Paid plan at a small monthly fee that includes millions of requests and CPU time, with usage priced per million beyond that. Static assets served next to a Worker are not charged per request."
limits: "128 MB of memory per isolate, a CPU-time limit per request that is configurable on the paid plan, a maximum compressed script size, and no local filesystem. Outbound subrequests and open connections are capped per request."
pillars: ["websites-and-applications", "cloudflare-migration", "performance-and-delivery"]
insights: ["websites-on-cloudflare-workers"]
related: ["static-assets", "bindings", "wrangler", "durable-objects", "edge-and-pops"]
updatedAt: 2026-10-06
---

## How it works

A Worker is a small program written in JavaScript or TypeScript (Python and WebAssembly are also supported) that is deployed to Cloudflare's whole network at once. Requests are handled by V8 isolates rather than containers, so a Worker starts in milliseconds and there is no idle server to pay for. The same `fetch` and web-standard APIs you use in a browser are the programming model.

## Where it fits

Workers is the compute layer of everything we build: an Astro website prerendered to static assets with a few dynamic routes, an API in front of D1, a queue consumer, a workflow, an AI feature. Configuration lives in `wrangler.jsonc`, deployment is one command, and every deploy is a version you can roll back to.
