---
title: "D1, KV or R2: choosing a Cloudflare data store without regretting it"
description: Cloudflare offers three very different places to put data. This guide explains what each one is for, where each one fails when misused, and a decision procedure you can apply to every piece of data in your application.
publishedAt: 2026-10-03
audience: technical
topics: [D1, KV, R2, Durable Objects, Architecture]
readingMinutes: 10
relatedServices: [websites-and-applications, ai-and-automation]
---

The most common architectural mistake we find in audits is not a missing cache or a slow query. It is data in the wrong store: enquiries in KV because it was easy, images in D1 because it was there, session state in R2 because it had no size limit. Each of these works in a demo and fails in production in a specific, predictable way.

This article is the decision procedure we use. It covers D1, KV and R2, and it mentions Durable Objects where they are the real answer.

## The three stores in one paragraph each

**D1** is a relational SQL database (SQLite under the hood) with transactions, indexes, foreign keys, migrations and point-in-time recovery. Writes go to a primary location; reads can be served from replicas with the Sessions API for consistency. It is for records: things with identity, relationships and a correct current value.

**KV** is a global key-value store optimised for reads. Values are cached in every Cloudflare location after first access, so reads are fast everywhere. Writes propagate within about a minute and are last-writer-wins. There are no transactions. It is for configuration, feature flags, rendered fragments and any data that is read far more often than it changes and can tolerate being briefly stale.

**R2** is object storage: files identified by a key, up to very large sizes, S3-compatible, with no egress fees. It stores bytes and metadata; it does not query them. It is for media, uploads, exports, backups, archives and large documents.

If you remember one sentence: **D1 for records, KV for configuration, R2 for files.**

## The failure modes, by store

Knowing what each store is for is less useful than knowing how each one fails when misused, because that is what you are trying to avoid.

### KV as a primary record store

KV is eventually consistent. A write in one location is visible there immediately but may take up to about sixty seconds to be visible elsewhere, and two writes to the same key from different locations resolve by timestamp. If you store an enquiry, an order or an account in KV, you will eventually have one of these: a record that was overwritten by a slightly older version, a list that is missing its newest member in one region, or a counter that is wrong. Each is rare, each is silent, and none can be prevented from the application side.

KV is also not queryable. "All enquiries from last week with status pending" means listing keys with a prefix and fetching each one. That is fine for ten keys and a problem for ten thousand.

This site stores enquiries in D1 for exactly this reason, and uses KV only for public configuration. The brief we built it from said "never use eventually consistent KV as the authoritative enquiry store"; it is the right rule for any record that must be correct.

### D1 as a file store

D1 rows can hold blobs, and the temptation is to store uploaded images or PDFs in them. Database size limits are measured in gigabytes, backups and replication now carry every byte of every file, and reads of large blobs through SQL are slower than streaming from R2. Store the file in R2 and its key in D1.

### R2 as a database

R2 stores and lists objects; it does not query their contents and listing is not a substitute for an index. Applications that keep JSON documents in R2 and "query" by listing and reading end up with an expensive, slow, inconsistent database. If you need to find things by their properties, that is D1.

### D1 for coordination

A shopping cart, a seat reservation, a rate counter or a collaborative document needs a single, serialised view of its state, often with many small writes per second from one user. D1 can hold the final record, but coordinating live state through it means contention and round trips. This is what Durable Objects are for: one object per cart, document or user, with its own storage, processing one request at a time. The finder on this site keeps each AI conversation in a Durable Object for the same reason.

### KV for anything that changes per request

Writing to KV on every request (counters, last-seen timestamps, view counts) runs into write limits per key and produces inaccurate numbers because writes do not merge. Counters belong in Durable Objects (exact) or in analytics (approximate, cheap).

## The decision procedure

For every kind of data in the application, answer these in order.

**1. Does it have to be correct right now, for every reader?**
Yes: it is a record or coordinated state. Go to question 2.
No, a few seconds of staleness is acceptable: go to question 4.

**2. Is it a file or a document measured in megabytes?**
Yes: R2 for the bytes, D1 for the metadata and the key.
No: go to question 3.

**3. Is it updated by many concurrent operations that must be serialised, or does it need to live for one session only?**
Yes: a Durable Object owns it (and may write a summary to D1 afterwards).
No: D1.

**4. Is it read often and written rarely, and is it the same for everyone (or for a large group)?**
Yes: KV, with a TTL that matches how stale it may be.
No, it is per-user or per-request: it is probably not cache data at all; go back to question 1.

**5. Is it a file?**
R2. If it is served to browsers, serve it through a Worker (for access control and headers) or through a public bucket domain with cache rules, and let the CDN cache it.

## Worked examples

**A contact form submission.** Must be correct, is not a file, is not coordinated state: D1. Processing status lives in the same row; events in a second table. A queue message carries the id, not the data.

**Feature flags and site settings.** Read on every request, changed by an administrator occasionally, same for everyone: KV with a short TTL, or no TTL and an explicit update on change.

**A product catalogue.** Records with relationships and queries (by category, price, availability): D1. The rendered category page can be cached in KV or, better, at the CDN with a cache rule and purged on change.

**Product images.** R2, with the key stored on the product row. Served through Cloudflare Images for resizing, or through the CDN with long cache lifetimes and versioned keys.

**A shopping cart.** Per-user, many small writes, must be exact: a Durable Object per cart. On checkout, the order is written to D1 and the cart object expires.

**User sessions.** Short-lived, per-user, read on every request: Durable Objects if the session carries state that changes, KV if it is a signed token lookup that rarely changes, or no store at all if the token is self-contained. Astro's session API on Cloudflare uses KV by default, which is fine for a read-mostly session.

**Uploaded documents for an AI assistant.** The original file in R2; the extracted text chunks and their embeddings in Vectorize; the document's metadata and processing status in D1; the processing pipeline in a Workflow.

**Analytics and counters.** Not any of the three. Workers Analytics Engine or Web Analytics for approximate, high-volume numbers; a Durable Object for the rare exact counter.

## Limits worth knowing before you commit

Limits change, and the current values are in Cloudflare's documentation, so check them when you design. The categories to check are stable: maximum database size and rows read or written per query in D1; maximum value size, writes per second per key and the propagation delay in KV; object size, multipart thresholds and class A/B operation pricing in R2; request and storage limits per Durable Object. Design against the category, then confirm the number.

## How we apply this

In the architecture stage of every project we produce a table: each kind of data, the store it lives in, why, and how it is read, written, cached and deleted. It takes an afternoon and it prevents the audit finding that opens this article. The [Websites & Applications](/services/websites-and-applications/) service includes it; so does the [AI & Automation](/services/ai-and-automation/) service, where the pipeline between R2, D1, Vectorize and Workflows is the whole design.
