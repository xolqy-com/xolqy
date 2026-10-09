---
term: "CDN cache and Cache Rules"
category: Delivery
summary: "Cloudflare's cache keeps copies of your responses in its data centres so repeat requests are answered without reaching your origin. Cache Rules decide what is cached and for how long; Tiered Cache reduces origin hits further; the Cache API gives Workers programmatic control."
docs: "https://developers.cloudflare.com/cache/"
useWhen: "Every site. Static files are cached by default; HTML and API responses can be cached deliberately with Cache Rules when they are the same for everyone."
avoidWhen: "Personalised or authenticated responses, which must either bypass the cache or be cached with a key that includes the user."
pricing: "Caching is included on every plan. Cache Reserve, a persistent layer that keeps objects cached far longer, is a paid add-on billed by storage and operations."
pillars: ["performance-and-delivery", "cloudflare-migration"]
insights: ["cloudflare-migration-runbook", "cloudflare-in-front-or-rebuild-on-workers", "which-cloudflare-products-a-business-needs", "where-cloudflare-keeps-your-data"]
related: ["static-assets", "kv", "r2", "argo-smart-routing", "edge-and-pops"]
updatedAt: 2026-10-06
---

## The rules we set first

A long cache lifetime for fingerprinted assets, a short one with stale-while-revalidate for HTML that changes, bypass for anything with a session cookie, and purge-by-tag or by URL wired into the deploy. On a migration, understanding the existing cache behaviour is step one, because a cache that is too aggressive hides bugs and one that is too timid hides the performance gain.
