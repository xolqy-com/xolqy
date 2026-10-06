---
term: "The edge, PoPs and Smart Placement"
category: Concepts
summary: "Cloudflare runs data centres (points of presence, or PoPs) in hundreds of cities. 'The edge' means code and cache running in whichever of those is closest to the visitor. Smart Placement is the option that instead runs a Worker near the data it talks to, when that is faster overall."
docs: "https://developers.cloudflare.com/workers/configuration/smart-placement/"
useWhen: "Understanding why a site on Workers is fast everywhere, and deciding whether a Worker that makes many calls to one database should be placed near that database instead of near the visitor."
pricing: "Part of the platform. Smart Placement is a free setting."
pillars: ["performance-and-delivery", "websites-and-applications"]
insights: ["websites-on-cloudflare-workers"]
related: ["workers", "cache", "argo-smart-routing"]
updatedAt: 2026-10-06
---

## Good to know

Every request carries a `cf` object with the colo code, country and network details. The edge demo on the Labs page shows the PoP that served you. One request from one place proves nothing about global performance, which is why we measure from several regions before claiming anything.
