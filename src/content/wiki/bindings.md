---
term: "Bindings"
category: Concepts
summary: "A binding is how a Worker reaches another Cloudflare resource: a D1 database, a KV namespace, an R2 bucket, a queue, a Durable Object, Workers AI, Vectorize or another Worker appears as a property on the `env` object, with no connection strings, keys or SDKs to manage."
docs: "https://developers.cloudflare.com/workers/runtime-apis/bindings/"
useWhen: "Every resource a Worker uses. Declared in wrangler.jsonc, typed with `wrangler types`, and emulated locally by `wrangler dev`."
pricing: "Free. The resources behind them are billed on their own terms."
pillars: ["websites-and-applications"]
insights: []
related: ["workers", "wrangler", "secrets", "d1", "kv", "r2"]
updatedAt: 2026-10-06
---

## Why it matters for security

Because access goes through bindings, a Worker has no credentials to leak for the resources it uses. The permission is the binding itself, which exists only in that Worker's configuration. That is one of the reasons the security page can say that secrets stay out of code.
