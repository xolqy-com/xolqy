---
term: "Web Application Firewall (WAF)"
category: Security
summary: "The WAF inspects requests before they reach your site and blocks the malicious ones: injection attempts, known exploits, abusive patterns. It combines Cloudflare's managed rulesets, which update automatically, with custom rules you write in a simple expression language."
docs: "https://developers.cloudflare.com/waf/"
useWhen: "Every public site and API. Start with managed rules in log mode, review what they would have blocked, then enforce."
pricing: "A basic managed ruleset and a small number of custom rules on the free plan; the full managed rulesets, more custom rules and more rate limiting rules on Pro, Business and Enterprise."
pillars: ["security-and-zero-trust", "managed-cloudflare"]
insights: ["cloudflare-migration-runbook", "what-a-cloudflare-audit-covers", "cloudflare-as-an-operating-system"]
related: ["ddos-protection", "bot-management", "rate-limiting", "turnstile"]
updatedAt: 2026-10-06
---

## How we deploy it

Managed rules go live in log mode first, for a week, so that a legitimate form or API call is not blocked on day one. Custom rules cover the application's own patterns: admin paths restricted by country or by Access, upload endpoints with size limits, known-bad user agents. Every rule has a comment saying why it exists, because six months later nobody remembers.
