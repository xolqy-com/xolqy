---
term: "AI Gateway"
category: AI
summary: "AI Gateway is a proxy you put between your application and AI providers (Workers AI, OpenAI, Anthropic, Google and others). It adds logging, caching, rate limiting, retries and fallbacks, cost visibility and access control without changing how you call the model."
docs: "https://developers.cloudflare.com/ai-gateway/"
useWhen: "Any application that calls an AI model in production. The visibility alone pays for the fifteen minutes it takes to set up."
pricing: "The core features are free. Extended log storage and some advanced features are paid."
pillars: ["ai-and-automation", "managed-cloudflare"]
insights: []
related: ["workers-ai", "vectorize", "rag", "secrets"]
updatedAt: 2026-10-06
---

## How it works

You create a gateway, point your SDK or Workers AI binding at it, and every request is logged with tokens, cost and latency. Caching returns identical answers to identical prompts without paying twice; rate limits protect your budget from a runaway loop; fallbacks route to another model when one fails. An authenticated gateway rejects requests without a token, and provider keys can be stored in the gateway instead of in every application.
