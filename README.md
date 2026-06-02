<div align="center">

# Xolqy

**Cookieless, privacy-first web analytics — on the edge.**

A simple, fast, GDPR-friendly alternative to Google Analytics. The tracker is **< 2 KB**, it sets **no cookies** and stores **no personal data**, so most sites need **no consent banner**. The whole stack — tracker, collector, dashboard, and API — runs serverless on **Cloudflare Workers + D1**, so you can self-host it for free.

[Website](https://xolqy.com) · [Docs](https://xolqy.com/docs) · [Pricing](https://xolqy.com/pricing) · [Blog](https://xolqy.com/blog)

![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-ea580c) ![Cloudflare Workers](https://img.shields.io/badge/runtime-Cloudflare%20Workers-orange) ![Tracker < 2KB](https://img.shields.io/badge/tracker-%3C2KB-brightgreen)

</div>

---

## Features

- **Cookieless.** Counts daily unique visitors with a salted hash of IP + User‑Agent that rotates at midnight UTC. No cookies, no IP stored, no fingerprinting — usually no consent banner needed.
- **Tiny & fast.** The tracker is under 2 KB, async, with zero dependencies. No Core Web Vitals hit.
- **The metrics that matter.** Pageviews, unique visitors, sessions, top pages, referrers, countries, devices, **time‑on‑page** (counted only while the tab is visible) and **scroll depth**, plus outbound‑link clicks.
- **Multi‑tenant.** Register with email/password or Google, claim the domains you own, and see only your data.
- **Per‑site sharing.** Invite teammates by email (with optional automatic emails via Resend) to view a specific site, read‑only.
- **Super‑admin view.** A designated account sees *every* tracked domain plus an "All sites (combined)" aggregate — built for running 100s of sites.
- **Fast at scale.** Headline numbers read from nightly per‑day rollups; *today* stays real‑time.
- **Self‑hostable & open source.** Deploy to your own Cloudflare account; your data never leaves it.

## Tech stack

- **Cloudflare Workers** — single Worker serves the tracker, collector, stats API, marketing site, and dashboard.
- **Cloudflare D1** — SQLite at the edge for storage.
- **TypeScript**, no framework. Dashboard is vanilla JS + [Chart.js](https://www.chartjs.org/).
- **Cron Triggers** for the nightly rollup. **Web Crypto** for password hashing (PBKDF2‑SHA256). **Resend** (optional) for invite emails.

## Quick start (self‑host)

You'll need a [Cloudflare account](https://dash.cloudflare.com/sign-up) and Node 18+.

```bash
git clone https://github.com/xolqy-com/xolqy.git
cd xolqy
npm install

# Create the D1 database and paste the returned database_id into wrangler.toml
npx wrangler d1 create xolqy

# Create the tables
npx wrangler d1 execute xolqy --remote --file=schema.sql

# Set the required secrets
npx wrangler secret put SALT_SEED         # any long random string

# Deploy
npx wrangler deploy
```

Then point your domain at the Worker (Custom Domain in the dashboard) and add the snippet to any site you want to track:

```html
<script defer src="https://your-domain.com/t.js"></script>
```

Register an account at `/login`, add your domain, and traffic shows up live.

## Configuration (secrets / vars)

Set with `npx wrangler secret put <NAME>` (and mirror them in a gitignored `.dev.vars` for `wrangler dev`):

| Name | Required | Purpose |
|------|----------|---------|
| `SALT_SEED` | ✅ | Seed for the daily visitor‑hash salt. |
| `SUPERADMIN_EMAIL` | – | Comma‑separated emails granted the all‑sites super‑admin view. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | – | Enable "Sign in with Google" (OAuth 2.0). |
| `GOOGLE_REDIRECT_URI` | – | Override the callback (defaults to `<origin>/auth/google/callback`). |
| `RESEND_API_KEY` | – | Auto‑send invite emails via [Resend](https://resend.com). If unset, invite *links* are still generated to share manually. |
| `INVITE_FROM` | – | From address for invites, e.g. `Xolqy <invites@your-domain.com>` (domain must be verified in Resend). |

### Sign in with Google

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID → Web application**.
2. Authorized redirect URI: `https://your-domain.com/auth/google/callback` (and `http://localhost:8787/auth/google/callback` for dev).
3. `npx wrangler secret put GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Until set, the button shows a friendly "not configured" notice and email/password still works.

## How it works

**Cookieless identity.** Instead of a cookie, the collector computes `sha256(IP + User-Agent + SALT_SEED + YYYYMMDD)` and keeps only the first 12 hex chars. The day component rotates the value every midnight UTC, so it can't track anyone over time. The raw IP is never stored.

**Rollups for scale.** A Cron Trigger (00:15 UTC) aggregates each completed day into `daily_rollups` (one row per site per day) via [`src/rollup.ts`](src/rollup.ts). The dashboard's KPIs and chart read pre‑aggregated totals for past days and query raw `events` only for *today* — so history is cheap and today is live. Averages are stored as sum + count so they recombine across any range; because the visitor hash rotates daily, summing per‑day uniques equals the range‑wide distinct count.

**Generating OG images.** `npm run og` renders a per‑page Open Graph PNG into `public/og/` (uses `sharp`). Re‑run after adding pages or posts.

## Project layout

```
xolqy/
├── wrangler.toml            Cloudflare config (Worker, D1 binding, cron trigger)
├── schema.sql               D1 tables: events, clicks, users, sessions, sites, daily_rollups, shares
├── scripts/build-og.mjs     Per-page Open Graph image generator
├── src/
│   ├── worker.ts            Entry: routing, collector, stats/auth/sharing API, cron, canonical host
│   ├── auth.ts              Accounts, sessions, password hashing, Google OAuth, sharing/invites
│   ├── stats.ts             Aggregation queries (rollup + live-today hybrid)
│   ├── rollup.ts            Nightly events → daily_rollups job
│   ├── site.ts              Marketing site shell, pages, blog, sitemap/robots/llms.txt/RSS, invite page
│   └── tracker.ts           Source of the < 2 KB tracker served at /t.js
└── public/
    ├── login.html           Login / register (email/password + Google)
    ├── dashboard.html       Stats dashboard (vanilla JS + Chart.js)
    ├── dashboard.css
    └── og/                  Generated Open Graph images
```

## Privacy model

- IP addresses are **never stored**. Only a short, daily‑rotating salted hash is kept — enough to count daily uniques, not enough to identify or track a person.
- **No cookies**, no `localStorage` persistence beyond a per‑tab session id.
- **No third‑party data sharing** and no fingerprinting beyond the daily hash.

## Contributing

Issues and PRs welcome. Run `npm run dev` for a local Worker, and `npx tsc --noEmit` to type‑check.

## License

[AGPL-3.0](LICENSE) © Xolqy — if you run a modified version as a network service, you must publish your changes.
