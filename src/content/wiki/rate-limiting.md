---
term: "Rate limiting"
category: Security
summary: "Rate limiting caps how many requests a client may make in a period. Cloudflare offers it twice: as WAF rate limiting rules applied at the edge before your code runs, and as a binding inside Workers for fine-grained limits keyed by anything your code knows, such as a user id or an API key."
docs: "https://developers.cloudflare.com/waf/rate-limiting-rules/"
useWhen: "Login and form endpoints, APIs, search, anything an abusive client could hammer. The edge rules stop volumetric abuse; the Workers binding enforces business rules per user."
pricing: "Rate limiting rules are part of the WAF, with more rules on higher plans. The Workers rate limiting binding is free to use."
limits: "The Workers binding counts per Cloudflare location, not globally, so it is an abuse brake rather than a precise quota. Precise global quotas belong in a Durable Object."
pillars: ["security-and-zero-trust", "websites-and-applications"]
insights: []
related: ["waf", "durable-objects", "turnstile", "bot-management"]
updatedAt: 2026-10-06
---

## Where it fits

The enquiry and finder endpoints on this site use the Workers binding keyed by a hash of the client address: a flood costs the attacker time and costs us nothing. A WAF rule above it would be the next step if the pattern ever changed.
