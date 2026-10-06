---
term: "Embeddings"
category: Concepts
summary: "An embedding is a list of numbers, typically a few hundred to a few thousand, that an AI model produces to represent the meaning of a piece of text, an image or another input. Inputs with similar meaning produce vectors that sit close together, which is what makes search by meaning possible."
docs: "https://developers.cloudflare.com/workers-ai/models/"
useWhen: "Any time you want to compare things by meaning rather than by exact words: semantic search, grouping similar tickets, finding duplicates, feeding relevant context to an assistant."
pricing: "Producing embeddings is a Workers AI call, billed by tokens processed and cheap relative to text generation. Storing and querying them is a Vectorize cost, billed by dimensions."
pillars: ["ai-and-automation"]
insights: ["cloudflare-vectorize-explained"]
related: ["vectorize", "workers-ai", "rag"]
updatedAt: 2026-10-06
---

## Practical points

The model decides the number of dimensions, and a vector index is created for one dimension count, so the model is chosen first. English content works well with a base-size English model; multilingual content needs a multilingual one. Cosine similarity is the usual comparison for text, and scores need a floor below which a result should be treated as "no match".
