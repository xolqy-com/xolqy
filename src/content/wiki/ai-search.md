---
term: "AI Search"
category: AI
summary: "AI Search is Cloudflare's managed retrieval service: give it a data source (uploaded files, an R2 bucket or a website), and it handles chunking, embeddings, indexing, continuous re-syncing and hybrid semantic and keyword search, with optional answer generation."
docs: "https://developers.cloudflare.com/ai-search/"
useWhen: "Search or question answering over documents when you want the result without owning the pipeline, for example a help centre, a policy library or a product documentation site."
avoidWhen: "Cases where you need control over chunking, metadata and ranking, or where the things you search are not documents. Build on Vectorize directly instead."
pricing: "Available on all plans. Usage is charged through the underlying services it drives, such as Workers AI, Vectorize and R2."
pillars: ["ai-and-automation"]
insights: ["cloudflare-vectorize-explained", "which-cloudflare-products-a-business-needs"]
related: ["vectorize", "workers-ai", "rag", "r2"]
updatedAt: 2026-10-06
---

## Where it fits

For many businesses this is the fastest route to "ask a question about our documents" on Cloudflare: upload or point it at a bucket, connect it to a page, done. We reach for Vectorize when the retrieval logic is part of the product and for AI Search when it is a feature that should just work.
