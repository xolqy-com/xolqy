---
term: "TLS, SSL modes and HSTS"
category: Security
summary: "Cloudflare issues and renews certificates for your domains automatically, and the SSL mode decides how traffic between Cloudflare and your origin is encrypted: Off, Flexible, Full or Full (strict). HSTS tells browsers to never use plain HTTP again."
docs: "https://developers.cloudflare.com/ssl/"
useWhen: "Every site: Full (strict) with a valid origin certificate, or no origin at all for sites on Workers; Always Use HTTPS and a minimum TLS version of 1.2; HSTS once you are sure every subdomain serves HTTPS."
avoidWhen: "Flexible mode in production. It encrypts the browser-to-Cloudflare leg only and is the most common cause of redirect loops and false security."
pricing: "Universal SSL certificates are free on every plan. Advanced certificates with custom options are a paid add-on."
pillars: ["security-and-zero-trust", "cloudflare-migration"]
insights: ["cloudflare-migration-runbook"]
related: ["dns", "ddos-protection", "cloudflare-tunnel", "waf"]
updatedAt: 2026-10-06
---

## Migration note

Switching nameservers to Cloudflare with the wrong SSL mode is how sites go down on migration day. The runbook sets the mode, confirms the origin certificate and tests with the host overridden before the DNS change, so the cut-over itself changes nothing visible.
