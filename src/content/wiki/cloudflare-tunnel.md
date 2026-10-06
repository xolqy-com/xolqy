---
term: "Cloudflare Tunnel"
category: Security
summary: "Cloudflare Tunnel connects a server, container or private network to Cloudflare through an outbound connection made by a small agent called cloudflared, so the origin needs no public IP address and no open inbound ports. Traffic reaches it only through Cloudflare."
docs: "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/"
useWhen: "Hiding origin servers behind Cloudflare, exposing an internal application through Access, reaching a private database from Workers through Hyperdrive, and giving remote staff access to private networks."
pricing: "Free. Related Zero Trust features are priced per user."
pillars: ["security-and-zero-trust", "cloudflare-migration"]
insights: []
related: ["zero-trust-access", "ddos-protection", "hyperdrive", "dns"]
updatedAt: 2026-10-06
---

## Where it fits

A tunnel is the clean answer to "how do we stop attackers bypassing Cloudflare and hitting the server directly". It is also how a migration can keep a legacy origin reachable but invisible while the new site is built in front of it.
