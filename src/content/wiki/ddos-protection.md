---
term: "DDoS protection"
category: Security
summary: "Cloudflare's DDoS protection is always on for every site behind it, at the network, transport and HTTP layers, and is unmetered: an attack does not generate a bill. Mitigation happens automatically at the edge, before traffic reaches your origin or your Worker."
docs: "https://developers.cloudflare.com/ddos-protection/"
useWhen: "Nothing to do beyond putting the site behind Cloudflare. Managed HTTP DDoS rules can be tuned for sensitivity if a legitimate traffic pattern looks like an attack."
pricing: "Included on all plans, unmetered. Advanced features and dedicated support are part of Enterprise."
pillars: ["security-and-zero-trust", "cloudflare-migration"]
insights: []
related: ["waf", "bot-management", "rate-limiting", "tls-ssl"]
updatedAt: 2026-10-06
---

## The one condition

Protection only applies to traffic that goes through Cloudflare. If your origin server's IP address is public and known, attackers can bypass the edge. Lock the origin down to Cloudflare's IP ranges or, better, put it behind a Cloudflare Tunnel so it has no public address at all.
