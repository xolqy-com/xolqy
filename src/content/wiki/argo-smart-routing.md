---
term: "Argo Smart Routing"
category: Delivery
summary: "Argo Smart Routing sends traffic between Cloudflare's edge and your origin over the fastest measured paths inside Cloudflare's network instead of the public internet's default routes, cutting time to first byte for dynamic, uncacheable requests."
docs: "https://developers.cloudflare.com/argo-smart-routing/"
useWhen: "Sites with an origin server far from many of their visitors and a lot of dynamic traffic. Sites fully on Workers with no origin do not need it."
pricing: "A paid add-on with a monthly fee plus a per-gigabyte charge for traffic that uses it."
pillars: ["performance-and-delivery"]
insights: []
related: ["cache", "edge-and-pops", "load-balancing"]
updatedAt: 2026-10-06
---

## Measure first

Argo helps exactly where requests cannot be cached. We turn it on for a week, compare origin response times in the analytics, and keep it only if the numbers justify the bill. A good cache strategy often removes most of the need.
