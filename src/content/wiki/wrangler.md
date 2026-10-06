---
term: "Wrangler"
category: Compute
summary: "Wrangler is the command-line tool for Workers and the rest of the developer platform. It runs your Worker locally with a faithful simulation of the runtime, deploys it, manages versions and rollbacks, and administers D1, KV, R2, Queues, Vectorize and secrets."
docs: "https://developers.cloudflare.com/workers/wrangler/"
useWhen: "Every Workers project. Install it as a dev dependency so the whole team runs the same version."
pricing: "Free, open source."
pillars: ["websites-and-applications", "managed-cloudflare"]
insights: []
related: ["workers", "workers-builds", "bindings", "secrets", "compatibility-date"]
updatedAt: 2026-10-06
---

## The commands that matter

`wrangler dev` runs the Worker locally with local D1, KV, R2 and Queues; `wrangler deploy` ships it; `wrangler rollback` returns to the previous version; `wrangler secret put` stores a secret; `wrangler d1 migrations apply` applies database migrations; `wrangler types` generates TypeScript types for your bindings. Configuration lives in `wrangler.jsonc`, which we treat as part of the code and review like code.
