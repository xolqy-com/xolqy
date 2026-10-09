---
title: "Cookieless analytics: measuring a website without a consent banner"
description: "What cookieless analytics is, why it removes the need for a cookie banner, how Cloudflare Web Analytics counts visits without cookies or fingerprinting, what you give up compared with Google Analytics, and how to set it up in ten minutes."
publishedAt: 2026-10-07
audience: both
topics: [Web Analytics, Privacy, Performance, Core Web Vitals]
readingMinutes: 9
relatedServices: [performance-and-delivery, managed-cloudflare]
---

Most cookie banners exist for one reason: the site runs an analytics or advertising script that stores an identifier in the visitor's browser. Remove that script, measure the site in a way that stores nothing on the device, and the banner has nothing left to ask about. That is what cookieless analytics means, and it is how this website is measured.

This guide explains the idea for the business owner and the mechanics for the engineer: why the banner exists in the first place, how Cloudflare Web Analytics counts visits without cookies, what you lose compared with Google Analytics, and when a banner is still required. It is not legal advice; it describes how the tools work, and the decision for a given business belongs with that business and, where needed, its lawyer.

## Why websites ask for consent at all

In the European Union the rule behind the banner is the ePrivacy Directive, Article 5(3). It requires consent before a site **stores information on, or reads information from, a visitor's device**, unless that storage is strictly necessary for a service the visitor asked for. The rule is about the device, not about cookies specifically: `localStorage`, `sessionStorage` and fingerprinting techniques that read device characteristics fall under it too. GDPR then applies on top whenever the data is personal, which an identifier tied to one browser usually is.

Analytics is not strictly necessary to show someone a page, so analytics that stores an identifier needs consent. Google Analytics 4 sets first-party cookies to recognise a returning browser, which is why a site that runs it in the EU shows a banner and, in Consent Mode, loses part of its measurement every time someone declines.

In the United States there is no general consent requirement for analytics cookies. State laws such as California's CCPA, as amended by the CPRA, focus instead on the right to opt out of the "sale" or "sharing" of personal information, and advertising pixels are what usually trigger that. A site serving visitors on both sides of the Atlantic tends to adopt the stricter European practice, banner included.

## What a banner costs

A banner is not free even when it is legally required. It is the first thing a new visitor sees, it covers part of the page on a phone, and every visitor who declines disappears from your figures, so the numbers you base decisions on describe only the people who clicked "Accept". It also needs maintaining: a consent platform, a cookie inventory that must match what the site actually loads, and a record of consent.

If the measurement you actually use is pages, sources, countries, devices and page speed, all of that can be collected without storing anything on the device.

## How Cloudflare Web Analytics works

Cloudflare Web Analytics is a free analytics service that runs a small JavaScript beacon on each page. The beacon reads the browser's Performance API, the same timing data the browser already keeps for every page load, and sends it to Cloudflare. According to Cloudflare, it does not use cookies or `localStorage`, and it does not fingerprint visitors through their IP address, user agent or any other characteristic. Cloudflare's stated position is that the service does not collect or use visitors' personal data.

Without an identifier, a "visit" has to be defined differently. Cloudflare counts a visit as a page view whose referrer is not the site itself: someone arriving from a search engine, a link or a bookmark starts a visit, and moving between pages of the same site adds page views to it. What this cannot tell you is whether the person who visited on Monday is the same person who came back on Thursday, and that is the point.

What you get:

- **Visits and page views** by page, over any range in the retention window.
- **Referrers**, so you see which sites and searches send people.
- **Countries, devices, browsers and operating systems.**
- **Core Web Vitals from real visitors**: Largest Contentful Paint, Interaction to Next Paint and Cumulative Layout Shift, broken down by page, which is the measurement that matters for search ranking and is often missing from marketing analytics.

Data is kept unsampled for seven days and then aggregated to about a tenth of its volume for longer-term storage, with up to six months viewable in the dashboard. There is a soft limit of ten sites per account, which Cloudflare support can raise. Single-page applications are supported: the beacon reports each route change as a page load.

### Two ways to install it

- **Automatic**: if the site's DNS is on Cloudflare and the record is proxied (the orange cloud), Cloudflare can inject the beacon at the edge. Nothing changes in the code.
- **Manual**: add the snippet with the site's token to every page. This works for any site, including ones not proxied through Cloudflare, and is the right choice when you want the script declared in your own code and covered by your own Content-Security-Policy. This site uses the manual snippet, set through a build variable.

Use one or the other, not both, or every page view is counted twice.

### The limitation that matters: ad blockers

The beacon is a third-party script, and common blockers (uBlock Origin, Brave's shields, the DuckDuckGo extension and others) block it. For an audience of developers, that can be a large share of visits. If your site is proxied through Cloudflare, the zone's own traffic analytics, built from the requests that reach Cloudflare's edge, cannot be blocked because no script is involved. It counts requests rather than visits and includes bots, so the two views complement each other: the beacon for behaviour and speed, the edge for the true volume.

## What you give up compared with Google Analytics

Cookieless measurement is a deliberate trade. You lose everything that depends on recognising the same browser over time:

- **Unique users and returning users** across days.
- **User-level funnels and cohorts**, such as "people who read the pricing page and came back within a week".
- **User-level attribution** of conversions to an advertising campaign, and audiences for retargeting.
- **Integration with Google Ads** bidding, which relies on the cookies.

For a business that buys advertising at scale and optimises bids on conversions, that loss is real, and the honest answer is Google Analytics or a similar tool with a properly run consent banner. For a business whose website is its brochure, its proof of work and its enquiry form, the trade usually favours cookieless: complete figures from every visitor, no banner, and nothing to maintain.

Conversions do not disappear either. An enquiry that reaches your database is a conversion you can count exactly, by date, service and source page, without any analytics script at all.

## How the options compare

| | Cloudflare Web Analytics | Plausible | Fathom | Google Analytics 4 |
|---|---|---|---|---|
| Cookies or device storage | None | None | None | First-party cookies |
| Consent banner needed in the EU | No, in the vendor's analysis | No, in the vendor's analysis | No, in the vendor's analysis | Yes |
| Price | Free | Paid, by traffic | Paid, by traffic | Free |
| Core Web Vitals | Yes, per page | No | No | Through a separate setup |
| Custom events and goals | Limited | Yes | Yes | Yes |
| Self-hosting | No | Yes (open source) | No | No |
| Blocked by common ad blockers | Yes | Often | Often | Yes |

Plausible and Fathom offer richer event and goal tracking than Cloudflare's tool and are worth paying for when you need campaign goals without cookies. Cloudflare Web Analytics wins on cost, on Core Web Vitals, and on living in the same account as the rest of the stack.

## When you still need a banner

Cookieless analytics removes the analytics reason for a banner, not every reason. A consent request is still needed for anything else that stores identifiers in the browser for purposes other than delivering what the visitor asked for:

- advertising pixels (Meta, LinkedIn, Google Ads, TikTok);
- session recording and heatmap tools;
- embedded YouTube videos (unless served from `youtube-nocookie.com`, which still deserves a check), maps and social widgets;
- third-party chat widgets that set their own cookies.

Security measures such as Cloudflare Turnstile, which protects forms against bots, are generally treated as strictly necessary. A preference the visitor sets themselves, such as dismissing a notice, is stored to honour their own request and falls under the same exemption.

## How this website does it

This site sets no cookies of its own. Visits and Core Web Vitals come from Cloudflare Web Analytics, loaded only when its token is configured at build time, and the [stack page](/stack/) reports whether it is active. The enquiry form is protected by Turnstile, which may set a cookie on Cloudflare's challenge domain while the form is open. The small note telling first-time visitors that there are no cookies remembers that it was dismissed with a single `localStorage` flag that never leaves the browser. The [privacy page](/privacy/) lists all of it.

## Setting it up on your site

1. In the Cloudflare dashboard, open **Analytics & Logs → Web Analytics** and add your site.
2. If the domain is proxied through Cloudflare, choose automatic setup. Otherwise copy the snippet with your token.
3. Add the snippet before the closing `</body>` tag on every page, or through your site's layout template.
4. If you send a Content-Security-Policy, allow `static.cloudflareinsights.com` in `script-src` and `cloudflareinsights.com` in `connect-src`.
5. Remove the old analytics script, update the privacy policy, and take the banner down only once nothing else on the site needs it.
6. Check the dashboard after a day: page views, referrers and Core Web Vitals should be populated.

## Frequently asked questions

### Does cookieless analytics make my site GDPR compliant?

It removes one of the most common reasons a site processes personal data and stores information on devices, but compliance depends on everything else the site does: forms, embedded content, email and the processors you use. Treat it as removing a problem, not as a certificate.

### Is Cloudflare Web Analytics really free?

Yes. It is free on every plan, including for sites that are not proxied through Cloudflare, with a soft limit of ten sites per account.

### Can I keep Google Analytics and add Cloudflare Web Analytics?

Yes, and it is a sensible way to compare the two for a month. The banner stays as long as Google Analytics does.

### Why do my Cloudflare figures differ from Google Analytics?

They count different things. Cloudflare counts every visitor whose browser runs the beacon, including those who would decline a banner, and defines a visit by referrer. Google Analytics counts consented browsers and defines sessions by cookie and inactivity. Neither is wrong; they answer different questions.

### Can I track form submissions as conversions?

Not as events inside Cloudflare Web Analytics in the way Google Analytics does. Count them where they land: on this site every enquiry is stored in D1 with its date, service and page, which is a more accurate conversion figure than any browser-side event.

## Sources

- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/about/) and [FAQ](https://developers.cloudflare.com/web-analytics/faq/), Cloudflare docs
- [Cloudflare Web Analytics announcement](https://blog.cloudflare.com/free-privacy-first-analytics-for-a-better-web/), Cloudflare blog
- [Directive 2002/58/EC (ePrivacy), Article 5(3)](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:32002L0058), EUR-Lex
- [Core Web Vitals](https://web.dev/articles/vitals), web.dev
