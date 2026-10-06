---
term: "Bot management and AI crawlers"
category: Security
summary: "Cloudflare classifies automated traffic and lets you decide what to do with it: Bot Fight Mode on the free plan, Super Bot Fight Mode on paid plans, full Bot Management with a per-request bot score on Enterprise, and AI Crawl Control on every plan to see and control AI crawlers specifically."
docs: "https://developers.cloudflare.com/bots/"
useWhen: "Sites that suffer from scraping, credential stuffing, fake signups or inventory hoarding, and any site that wants to decide deliberately which AI crawlers may read it."
avoidWhen: "Blocking bots blindly. Search engines, link previews, uptime monitors and payment webhooks are bots too; allow verified bots and test before enforcing."
pricing: "Bot Fight Mode and AI Crawl Control are free. Super Bot Fight Mode comes with Pro and Business. Bot Management is an Enterprise add-on."
pillars: ["security-and-zero-trust", "managed-cloudflare"]
insights: []
related: ["waf", "turnstile", "rate-limiting", "ddos-protection"]
updatedAt: 2026-10-06
---

## AI crawlers deserve a decision

Since September 2026 Cloudflare splits AI crawlers into Search, Agent and Training categories with separate policies, and blocks some categories by default on new zones. A business that wants to be found by AI assistants needs the Agent and Search categories allowed; one that wants to keep its content out of training data can block Training alone. Either way it should be a decision, not a default.
