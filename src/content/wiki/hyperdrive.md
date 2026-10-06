---
term: "Hyperdrive"
category: Data
summary: "Hyperdrive makes an existing Postgres or MySQL database usable from Workers: it pools connections near the database and caches read queries, so a globally distributed Worker is not opening a new database connection on every request."
docs: "https://developers.cloudflare.com/hyperdrive/"
useWhen: "Applications that must keep their database where it is (an existing Postgres on a cloud provider, a managed database with data-residency rules) but want the frontend and API on Workers."
avoidWhen: "New applications with no existing database: D1 is simpler and cheaper to operate."
pricing: "Included with Workers on both plans. You still pay your database provider."
pillars: ["cloudflare-migration", "websites-and-applications"]
insights: []
related: ["d1", "workers", "cloudflare-tunnel"]
updatedAt: 2026-10-06
---

## Where it fits

Hyperdrive is the usual answer when a migration to Cloudflare must happen in stages: the site moves to Workers first, the database stays, and the data move is decided later with real numbers. A private database can be reached through a Cloudflare Tunnel instead of a public endpoint.
