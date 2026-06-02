# Launch copy

Ready-to-post copy for launching Xolqy. Target the three winnable niches:
**cookieless analytics on Cloudflare Workers**, **self-hosted analytics with
scroll depth + engagement**, and **analytics with a super-admin view across
hundreds of sites**.

General etiquette: post as yourself, be transparent that it's your project,
reply to every comment in the first few hours, and never ask for upvotes.

---

## Hacker News — "Show HN"

**Title** (factual, no hype):

> Show HN: Xolqy – Cookieless web analytics on Cloudflare Workers (open source)

**First comment** (post immediately after submitting):

> I built Xolqy because I wanted simple traffic numbers without a 45KB script, a cookie banner, or handing my data to Google.
>
> It's cookieless: instead of a cookie it counts daily uniques with a salted hash of IP+UA that rotates at midnight UTC, so nothing personal is stored and there's no consent banner. The tracker is <2KB. The whole stack — collector, dashboard, API, DB — runs on Cloudflare Workers + D1, so the self-host free tier is generous (100k req/day, 5GB) and there's no server to babysit.
>
> A few things that differ from Plausible/Fathom: it also measures scroll depth and engaged time (counted only while the tab is visible), and it has a multi-tenant model with a super-admin "all sites combined" view, which matters if you run lots of domains. Headline numbers read from nightly rollups so dashboards stay fast across hundreds of sites, while "today" is live.
>
> Free up to 10k pageviews/mo; paid tiers above that; self-host is free (AGPL).
>
> Honest limits: it's young, deliberately simple (no funnels, no session replay), and "visitors" is per-site-per-day by design. Feedback very welcome.
>
> https://xolqy.com — code: https://github.com/xolqy-com/xolqy

Best time: Tue–Thu, ~8–10am US Eastern.

---

## Reddit

### r/selfhosted

**Title:** I built a cookieless, self-hostable web analytics tool that runs entirely on Cloudflare Workers + D1

**Body:**

> Got tired of choosing between Google Analytics (heavy, cookie banner, not my data) and self-hosting Matomo (PHP+MySQL server to maintain). So I built Xolqy: the whole thing — tracker, collector, dashboard, API, database — runs serverless on Cloudflare Workers + D1. No server, scales to zero, free tier covers most sites.
>
> - Cookieless (daily-rotating salted hash, no IP stored) → no consent banner
> - <2KB script, async, no Core Web Vitals hit
> - Scroll depth + engaged time, not just pageviews
> - Multi-tenant: per-account site isolation + a super-admin view across every domain
> - Open source (AGPL) — deploy to your own Cloudflare account with one command
>
> It's mine and it's early; would love feedback from people who self-host analytics.
>
> Site: https://xolqy.com · Code: https://github.com/xolqy-com/xolqy

(Check the subreddit's self-promotion rules and use the "I made this" flair if required.)

### r/analytics or r/webdev

Same facts, but open with the GA-alternative angle:

**Title:** A lightweight, cookieless alternative to GA4 — here's how it counts visitors without cookies

Lead with the no-banner + page-speed story, then the bullet list above.

---

## Product Hunt

- **Name:** Xolqy
- **Tagline (≤60 chars):** Cookieless web analytics on the edge — fast, private, yours
- **Description:**

> Privacy-first web analytics with a <2KB cookieless script. No consent banner, scroll-depth + engagement metrics, and a multi-site super-admin view. Runs on Cloudflare Workers + D1; open source and self-hostable. Free up to 10k pageviews/mo.

- **First comment (maker):**

> Hi PH! I built Xolqy to get the analytics numbers that actually matter — without cookies, a 45KB script, or giving my data away. It's cookieless (no banner needed), tiny, measures how far people actually read, and runs entirely on Cloudflare's edge so you can self-host it for free. Would love your feedback on what's missing. 🙏

Launch at 12:01am PT; line up a few people who'll genuinely try it; stay in the comments all day.

---

## Directories worth submitting to

- AlternativeTo (as a Google Analytics / Plausible alternative)
- SaaSHub, Openalternative.co, awesome-selfhosted (PR to the list)
- Indie Hackers "Show IH" post
