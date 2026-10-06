---
term: "Workers KV"
category: Data
summary: "KV is a global key-value store optimised for reads: after the first read, a value is cached in every Cloudflare location, so lookups are fast everywhere. Writes propagate within about a minute and the last writer wins, which makes it ideal for configuration and poor for records."
docs: "https://developers.cloudflare.com/kv/"
useWhen: "Feature flags, configuration, rendered fragments, redirects, session tokens with a TTL, and any data read far more often than it changes."
avoidWhen: "Anything that needs transactions, counters, or an exact current value immediately after a write. Not an authoritative store for business records."
pricing: "Daily free allowances of reads, writes and storage on the free plan; per-million reads and writes and per-gigabyte storage on the paid plan, with reads an order of magnitude cheaper than writes."
limits: "Values up to 25 MiB, keys up to 512 bytes, eventual consistency of roughly a minute, and a limit of one write per second to the same key."
pillars: ["performance-and-delivery", "websites-and-applications"]
insights: ["d1-vs-kv-vs-r2"]
related: ["d1", "r2", "cache", "workers"]
updatedAt: 2026-10-06
---

## Where it fits

On this site KV holds a manifest of what the solution finder has indexed. Nothing in it is authoritative; if it vanished, a reindex would rebuild it. That is the test for KV: would you be fine regenerating it?
