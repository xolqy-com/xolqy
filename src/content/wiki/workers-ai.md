---
term: "Workers AI"
category: AI
summary: "Workers AI runs open AI models on Cloudflare's GPUs, called from a Worker through a binding or over HTTP: text generation, embeddings, image generation, speech to text, translation and classification, with no model hosting on your side."
docs: "https://developers.cloudflare.com/workers-ai/"
useWhen: "Embeddings for search, assistants grounded in your content, summarisation, extraction, moderation and other features where an open model is good enough and data should stay inside your Cloudflare account."
avoidWhen: "Tasks that need a specific frontier model from another provider; use AI Gateway in front of that provider instead, and keep Workers AI for the parts it does well."
pricing: "Billed in neurons, a unit that normalises across models, with a free daily allowance on the free plan and a per-thousand-neurons price on the paid plan. Embeddings are cheap; large text models cost more per request."
limits: "A catalogue of supported models rather than any model, rate limits per model, and context-length limits per model. Model availability changes often; check the catalogue before designing around one."
pillars: ["ai-and-automation"]
insights: ["cloudflare-vectorize-explained"]
related: ["vectorize", "ai-gateway", "embeddings", "rag", "ai-search"]
updatedAt: 2026-10-06
---

## Where it fits

On this site Workers AI produces the embeddings for the solution finder and answers questions from retrieved passages. The models are named in configuration so they can be changed without touching code. Every call goes through AI Gateway so that logs, caching and rate limits come for free.
