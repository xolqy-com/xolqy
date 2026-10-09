---
term: "Durable Objects"
category: Compute
summary: "A Durable Object is a single, globally unique instance of a class with its own storage and strongly consistent state. It runs in one place at a time, which makes it the tool for coordination: sessions, counters, locks, chat rooms, multiplayer state and per-key rate limits."
docs: "https://developers.cloudflare.com/durable-objects/"
useWhen: "State that must be consistent and coordinated: a session, a shopping basket, a game room, a per-customer rate limiter, a WebSocket hub, a queue of work for one tenant."
avoidWhen: "Data that many users read and nobody coordinates (use KV or D1), large files (R2), and workloads that would funnel all traffic through one object, which becomes a bottleneck."
pricing: "Available on both plans. Billed by requests, active duration and storage on the paid plan, with the SQLite-backed storage API as the default and recommended option."
limits: "One instance per id runs at a time, with the same memory limit as a Worker. Storage per object is large but not unbounded, and throughput is bounded by the single instance, so design keys so that load spreads across many objects."
pillars: ["websites-and-applications", "ai-and-automation"]
insights: ["d1-vs-kv-vs-r2", "where-cloudflare-keeps-your-data", "queues-versus-workflows"]
related: ["workers", "workflows", "d1", "rate-limiting"]
updatedAt: 2026-10-06
---

## How it works

Your Worker asks for an object by name or id and gets a stub; calls on the stub are routed to wherever that object currently lives. Inside, the object has a transactional SQLite database, alarms for scheduled work, and WebSocket hibernation so thousands of idle connections cost almost nothing.

## Where it fits

On this site a Durable Object holds each visitor's conversation with the solution finder: bounded turns, paced requests, deleted by an alarm after thirty minutes. The same pattern covers carts, collaborative editing and anything that needs "exactly one of these per key".
