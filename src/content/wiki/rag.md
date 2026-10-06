---
term: "Retrieval-augmented generation (RAG)"
category: Concepts
summary: "RAG is the pattern behind assistants that answer from your own content: retrieve the passages most relevant to the question, then ask a language model to answer using only those passages. It keeps answers grounded, current and attributable without training a model."
useWhen: "Support assistants, internal knowledge bases, product finders, policy and documentation question answering, anywhere a model should answer from approved content rather than from memory."
avoidWhen: "Questions that need reasoning over the whole corpus (RAG retrieves a few passages), and situations where no human-approved content exists to retrieve from."
pricing: "The sum of its parts: embeddings and generation on Workers AI (or another provider through AI Gateway), retrieval on Vectorize, storage in D1, KV or R2."
pillars: ["ai-and-automation"]
insights: ["cloudflare-vectorize-explained"]
related: ["vectorize", "embeddings", "workers-ai", "ai-gateway", "ai-search"]
updatedAt: 2026-10-06
---

## How it works on Cloudflare

Content is split into passages and embedded into Vectorize. At question time the question is embedded, the nearest passages are retrieved and filtered by a score floor, the passages are fetched from D1 or KV, and a chat model is asked to answer only from them, through AI Gateway. The solution finder on the Labs page is this pattern end to end, including the honest fallback when nothing relevant is found.
