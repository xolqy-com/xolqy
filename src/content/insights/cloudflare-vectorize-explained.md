---
title: "Cloudflare Vectorize explained: what a vector database is for, what it costs, and when to use it"
description: Vectorize is Cloudflare's vector database. This guide explains embeddings and similarity search in plain terms, what Vectorize actually stores, its limits and pricing with a worked example, how a query runs end to end from a Worker, and when a different tool is the better choice.
publishedAt: 2026-10-06
audience: both
topics: [Vectorize, Workers AI, AI Gateway, RAG, Search, Architecture]
readingMinutes: 13
relatedServices: [ai-and-automation, websites-and-applications]
---

Vectorize is Cloudflare's vector database: a store for embeddings, the lists of numbers that models produce to represent the meaning of a piece of text, an image or a product, and a query engine that finds the stored items closest in meaning to whatever you ask. It runs inside your Cloudflare account, is called from a Worker through a binding, and pairs with Workers AI, which produces the embeddings. It is the piece that lets a site search by meaning rather than by keyword, give an assistant your own content to answer from, or recommend "things like this one".

This guide is written for two readers at once: the business owner who wants to know what the service is and what it costs, and the engineer who wants the limits, the query path and the design rules. Figures are from Cloudflare's documentation as of October 2026, and the sources are linked at the end. Prices and limits change; the shape of the advice does not.

## What is a vector, and why would a database store them?

An embedding model reads an input (a paragraph, a product title, a support ticket) and returns a fixed-length list of numbers, typically 384 to 1,536 of them. That list is a vector. Its useful property is geometric: inputs with similar meaning produce vectors that sit close together, and unrelated inputs produce vectors far apart. "Reset my password" and "I cannot log in" land near each other even though they share no words.

A vector database stores these vectors with an id and some metadata, and answers one question quickly: given a new vector, which stored vectors are nearest? Nearness is measured with a distance metric. Vectorize supports three:

- **Cosine**: compares direction, ignores length. The default choice for text embeddings.
- **Euclidean**: straight-line distance. Used when magnitude carries meaning.
- **Dot product**: fast, suited to models trained for it, scores are not bounded.

The metric is fixed when an index is created, as is the dimension count, so the first decision is which embedding model you will use, because the model decides both.

## What Vectorize actually is

Vectorize is a managed, globally distributed vector index. You create an index with a name, a dimension count and a metric, then insert vectors with ids and optional metadata, and query it with a vector plus a few options. There is nothing to provision or scale, and it is generally available on both the Free and Paid Workers plans.

The things it does not do are as important as the things it does. Vectorize stores vectors, ids and small metadata; it does not store your documents. The text a vector came from lives in D1, KV or R2, and your Worker fetches it after the query returns ids. Vectorize also does not produce embeddings. Workers AI does that, or any other embedding model you call over HTTP.

The current limits, for indexes created on the generally available version:

| Limit | Value |
| --- | --- |
| Indexes per account | 50,000 on Workers Paid, 100 on Free |
| Vectors per index | 20,000,000 |
| Dimensions per vector | up to 1,536 |
| Metadata per vector | 10 KiB |
| Metadata indexes per index (for filtering) | 10 |
| Namespaces per index | 50,000 on Paid, 1,000 on Free |
| topK per query | 100, or 50 when returning values or metadata |
| Vectors per upsert | 1,000 through the Workers binding, 5,000 through the HTTP API |

Two behaviours matter in design. First, writes are asynchronous: an upsert is written durably at once, but the vectors become searchable after a background job runs, which for large batches means minutes rather than milliseconds. A product that inserts a record and queries for it on the next request will not find it; design for that. Second, metadata filtering only works on properties that had a metadata index before the vectors were inserted. Vectors upserted before the index was created are not filterable on that property until they are re-upserted.

## How a query runs, end to end

A semantic search or a "chat with our content" feature on Cloudflare is five steps, and all five run in one Worker request:

1. **Embed the question.** The Worker sends the user's text to Workers AI, for example `@cf/baai/bge-base-en-v1.5`, and receives a 768-dimension vector. Multilingual content uses a multilingual model such as `@cf/baai/bge-m3` instead; the index dimensions must match the model.
2. **Query the index.** `env.VECTORIZE.query(vector, { topK: 5, returnMetadata: 'all', filter: { lang: 'en' } })` returns the nearest ids with scores and metadata. Namespaces narrow the search to one tenant, language or content type before similarity is computed.
3. **Apply a score floor.** Cosine scores run from 0 to 1. A result at 0.3 is not an answer, it is the least bad option. Decide a floor per use case (on this site it is 0.45) and treat anything below it as "nothing relevant".
4. **Hydrate.** Fetch the passages for the returned ids from D1 or KV, where the full text lives. Vectorize returned pointers, not content.
5. **Answer or display.** For search, render the passages. For an assistant, send the passages plus the question to a chat model through AI Gateway, which adds logging, caching and rate limits, and instruct the model to answer only from what it was given.

The code for the middle of that path is short:

```ts
const { data } = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [question] });
const matches = await env.VECTORIZE.query(data[0], { topK: 5, returnMetadata: 'all' });
const hits = matches.matches.filter((m) => m.score >= 0.45);
const rows = await env.DB.prepare(`SELECT id, text FROM chunks WHERE id IN (${hits.map(() => '?').join(',')})`)
  .bind(...hits.map((m) => m.id)).all();
```

Indexing is the mirror image: split each source document into passages of a few hundred words, embed each passage, and upsert vectors whose ids are deterministic (a hash of the source and the chunk position) so that re-indexing replaces rather than duplicates.

## What it costs

Vectorize bills two things, both measured in dimensions rather than vectors, so a 384-dimension model costs a quarter of a 1,536-dimension model for the same data.

| | Workers Free | Workers Paid |
| --- | --- | --- |
| Queried vector dimensions | 30 million per month included | first 50 million per month included, then $0.01 per million |
| Stored vector dimensions | 5 million included | first 10 million included, then $0.05 per 100 million per month |

Cloudflare's own example of how queried dimensions add up: an index of 10,000 vectors at 384 dimensions receiving 100 queries counts (10,000 + 100) × 384 = 3.878 million queried dimensions. Stored dimensions are simply vectors × dimensions.

A worked example at two sizes, using a 768-dimension model:

- **A company knowledge base:** 5,000 passages and 20,000 questions a month. Stored: 5,000 × 768 = 3.84 million dimensions. Queried: (5,000 + 20,000) × 768 = 19.2 million. Both inside the Free plan. The Vectorize cost is zero; you pay only for the Workers AI calls that produce embeddings and answers.
- **A product catalogue search:** 200,000 items and 1,000,000 searches a month on Workers Paid. Stored: 153.6 million dimensions, of which 10 million are included, so about $0.07. Queried: (200,000 + 1,000,000) × 768 = 921.6 million, of which 50 million are included, so about $8.72. Under $9 a month for the index itself.

Embedding generation is billed by Workers AI separately, by tokens processed, and is small at these volumes. The expensive part of an AI feature is almost never the vector database; it is the chat model, which is why the answer step should be optional and cached.

## When Vectorize is the right choice

It fits when the content already lives in your Cloudflare account, when you want search or an assistant without running another service, when the corpus is up to tens of millions of items, and when queries come from Workers and should answer in a few hundred milliseconds from anywhere. Multi-tenant products map cleanly onto namespaces. Costs scale with use and start at zero.

It is the wrong tool in a few specific cases:

- **You need results immediately after a write.** Indexing is asynchronous. If a user creates a record and must find it on the next screen, keep a D1 query for the fresh records alongside the vector search, or accept the delay.
- **You need rich filtering on many fields.** Ten metadata indexes per index, with string matching on the first 64 bytes, is enough for language, tenant, type and date, not for a faceted catalogue. Do the heavy filtering in D1 and use Vectorize for ranking.
- **Your model produces more than 1,536 dimensions.** Choose a different model or reduce dimensions at embedding time.
- **You want keyword and semantic search combined without building it.** Combine D1 full-text search with Vectorize yourself, or use AI Search below.
- **The corpus exceeds 20 million vectors per index.** Shard across indexes by tenant or by time.

## Vectorize, AI Search, and the alternatives

Cloudflare also offers **AI Search**, a managed service that takes a data source (files you upload, an R2 bucket, or a website), does the chunking, embedding, indexing and continuous re-syncing for you, and exposes semantic and hybrid search with optional generation. It is the right choice when you want the outcome without owning the pipeline. Vectorize is the right choice when you want control over chunking, metadata, ids and the retrieval logic, or when vectors come from something other than documents, such as products or user behaviour.

Outside Cloudflare, the common alternatives are a vector extension inside a relational database (pgvector on Postgres, reachable from Workers through Hyperdrive) and dedicated managed vector databases. The honest comparison:

| | Vectorize | pgvector on Postgres | Dedicated managed vector DB |
| --- | --- | --- | --- |
| Where it runs | Inside the Cloudflare account, called from Workers | Your database server or provider | Vendor's cloud, over HTTP |
| Scale per index | 20 million vectors | Limited by the database instance | Very large, by plan |
| Filtering | Up to 10 indexed metadata fields, namespaces | Full SQL, joins with your own tables | Rich, vendor-specific |
| Consistency after writes | Asynchronous, seconds to minutes | Immediate | Varies, often near-immediate |
| Cost model | Dimensions stored and queried, free tier | Instance size you already pay for | Per pod, per unit or per query |
| Operations | None | Index tuning, vacuuming, memory | None, plus a vendor relationship |

If your records already live in Postgres and the queries join vectors with relational data, pgvector keeps everything in one place. If you are building on Workers and the content lives in D1, KV or R2, Vectorize removes a service and a network hop.

## How this website uses it

The solution finder on the [Labs page](/labs/) is a small, complete example. The knowledge base is built from the approved text of the six service pages and the homepage FAQs, split by section into passages. Each passage is embedded with `@cf/baai/bge-base-en-v1.5` (768 dimensions) and upserted into a cosine index called `xolqy-knowledge`, with a deterministic id per passage and a manifest of what was indexed kept in KV. A visitor's question is embedded the same way, the top five matches above a 0.45 floor are retrieved, and a chat model answers through AI Gateway using only those passages. When the index is empty or the model is unavailable, the finder falls back to keyword rules and says so on screen rather than inventing an answer. Reindexing is a single action in the staff area, which is behind Cloudflare Access.

Everything in that paragraph is visible on the [stack page](/stack/) with its live status.

## Rules we apply on every Vectorize project

1. **Pick the model first, then create the index.** Dimensions and metric are fixed per index. Changing models means a new index and a full re-embed.
2. **Create metadata indexes before the first upsert.** Language, tenant and content type at minimum. Filters on unindexed metadata silently return nothing useful.
3. **Keep the text elsewhere.** Metadata is for filtering and display hints. The passage itself lives in D1 or KV, keyed by the same id.
4. **Use deterministic ids.** A hash of source and chunk position means re-indexing is an upsert, not a duplicate, and deleted sources can be removed by id.
5. **Batch and wait.** Upsert in batches of up to 1,000 from a Worker, then poll before you tell the user the content is searchable.
6. **Set a score floor and a fallback.** Below the floor, say there is no good match. An assistant that always answers is an assistant that sometimes lies.
7. **Evaluate with real questions.** Twenty questions from actual customers, checked by hand, beat any benchmark. Re-run them after every re-index.
8. **Route generation through AI Gateway.** Logs, caching and rate limits cost nothing to turn on and are the first thing you need when something goes wrong.

## Frequently asked questions

### Is Vectorize available on the Free plan?

Yes. The Free plan includes 30 million queried vector dimensions a month and 5 million stored vector dimensions, enough for a knowledge base of a few thousand passages with tens of thousands of questions a month.

### Does Vectorize store my documents?

No. It stores vectors, ids and up to 10 KiB of metadata per vector. The documents stay in D1, KV, R2 or wherever they already live, and your Worker fetches them by id after a query.

### How fresh are search results after I add content?

Writes are durable immediately but searchable after an asynchronous indexing job, typically seconds for small batches and minutes for very large ones. Design flows so that a user is not expected to find a record on the very next request.

### Can I filter results by language, tenant or category?

Yes, through metadata filters on up to 10 indexed properties per index (string, number or boolean) and through namespaces, which partition the index before similarity is computed. Create the metadata indexes before inserting vectors.

### Which embedding model should I use?

For English content, `@cf/baai/bge-base-en-v1.5` at 768 dimensions is a good default on Workers AI. For multilingual content, `@cf/baai/bge-m3`. The model fixes the index dimensions, so choose before creating the index.

### What does a typical small deployment cost?

For a knowledge base of a few thousand passages and tens of thousands of queries a month, the Vectorize cost is zero on the Free plan. The costs that remain are Workers AI usage for embeddings and answers, which at that volume are a few dollars a month at most.

## Sources

- [Vectorize overview](https://developers.cloudflare.com/vectorize/), Cloudflare docs
- [Vectorize limits](https://developers.cloudflare.com/vectorize/platform/limits/), Cloudflare docs
- [Vectorize pricing](https://developers.cloudflare.com/vectorize/platform/pricing/), Cloudflare docs
- [Inserting vectors](https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/) and [metadata filtering](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/), Cloudflare docs
- [AI Search](https://developers.cloudflare.com/ai-search/), Cloudflare docs

If you are deciding whether a search or assistant feature belongs on Cloudflare, the [AI & Automation](/services/ai-and-automation/) service is where that conversation starts.
