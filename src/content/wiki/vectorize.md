---
term: "Vectorize"
category: Data
summary: "Vectorize is Cloudflare's vector database. It stores embeddings, the numeric representations of meaning produced by AI models, and finds the stored items closest to a query, which is how semantic search, recommendations and assistants grounded in your own content are built on Workers."
docs: "https://developers.cloudflare.com/vectorize/"
useWhen: "Semantic search over your content, retrieval for an AI assistant, 'similar items' recommendations, deduplication and classification by meaning."
avoidWhen: "Results that must be visible immediately after a write (indexing is asynchronous), heavy filtering across many fields, and models above 1,536 dimensions."
pricing: "Billed by vector dimensions stored and queried, with a free allowance on the free plan and a larger one on the paid plan. A small knowledge base typically costs nothing; a large catalogue search costs single-digit dollars a month."
limits: "Up to 1,536 dimensions, 20 million vectors per index, 10 KiB of metadata per vector, 10 metadata indexes for filtering, and namespaces to partition an index. Writes become searchable after an asynchronous indexing step."
pillars: ["ai-and-automation"]
insights: ["cloudflare-vectorize-explained"]
related: ["workers-ai", "embeddings", "rag", "ai-gateway", "ai-search"]
updatedAt: 2026-10-06
---

## Where it fits

The solution finder on this site is a complete small example: service content split into passages, embedded with Workers AI, stored in a cosine index, queried with a score floor, and answered through AI Gateway with an honest fallback. The full guide, with limits, pricing and a worked cost example, is the Vectorize article in Insights.
