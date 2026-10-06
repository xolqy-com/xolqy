---
term: "Load Balancing"
category: Delivery
summary: "Cloudflare Load Balancing distributes traffic across several origins with health checks, failover and steering by geography, latency or weight. When an origin fails its health check, traffic moves away from it automatically."
docs: "https://developers.cloudflare.com/load-balancing/"
useWhen: "Applications with more than one origin server, blue-green deployments, regional origins, and migrations where old and new backends must share traffic for a while."
pricing: "A paid add-on priced by the number of origins, health checks and DNS queries."
pillars: ["performance-and-delivery", "cloudflare-migration"]
insights: []
related: ["dns", "argo-smart-routing", "cloudflare-tunnel"]
updatedAt: 2026-10-06
---

## Where it fits

During a migration a load balancer can send a small percentage of traffic to the new platform, watch errors and latency, and increase the share day by day. That is a safer cut-over than a single DNS switch for a large or revenue-critical site.
