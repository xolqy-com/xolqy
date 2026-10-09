---
term: "DNS on Cloudflare"
category: Delivery
summary: "Cloudflare's authoritative DNS answers queries for your domain from its global network, fast and with DNSSEC available. Each record is either proxied (traffic flows through Cloudflare's security and cache) or DNS-only (Cloudflare just answers the lookup)."
docs: "https://developers.cloudflare.com/dns/"
useWhen: "Every domain on Cloudflare. Proxied records for websites and APIs, DNS-only for mail, verification records and services that must see the client IP directly."
pricing: "Free on every plan, including DNSSEC and unlimited records within reason."
pillars: ["cloudflare-migration", "managed-cloudflare"]
insights: ["cloudflare-migration-runbook", "dnssec-on-cloudflare"]
related: ["tls-ssl", "cache", "email", "cloudflare-tunnel"]
updatedAt: 2026-10-06
---

## Migration note

Moving a domain to Cloudflare starts with an exact copy of the existing records, including the ones nobody remembers, such as mail, verification and SaaS CNAMEs. Lower TTLs before the move, import, verify, then switch nameservers. This site's apex keeps its existing mail host untouched while a subdomain is used for sending.
