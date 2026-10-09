---
term: "Secrets and environment variables"
category: Security
summary: "A Worker reads configuration from variables set in wrangler.jsonc and secrets set outside the code: encrypted values stored with the Worker and injected at runtime, never written to the repository. Cloudflare also offers an account-level Secrets Store shared across Workers."
docs: "https://developers.cloudflare.com/workers/configuration/secrets/"
useWhen: "API keys, tokens, signing keys and anything that must not appear in Git. Plain variables are for non-sensitive settings such as a site URL or a model name."
avoidWhen: "Committing a .env or .dev.vars file, pasting a secret into a ticket or chat, or reusing a production secret for local development."
pricing: "Included with Workers."
pillars: ["security-and-zero-trust", "managed-cloudflare"]
insights: ["your-cloudflare-account-should-be-yours"]
related: ["wrangler", "bindings", "ai-gateway", "zero-trust-access"]
updatedAt: 2026-10-06
---

## The routine

`wrangler secret put NAME` for production, a `.dev.vars` file ignored by Git for local work, an example file committed so that a new developer knows which names exist, and rotation whenever a person who knew a secret leaves the project. The security page describes how this applies to client engagements.
