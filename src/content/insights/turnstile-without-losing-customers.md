---
title: Turnstile without losing customers (draft)
description: Notes toward a guide on replacing CAPTCHAs with Turnstile on forms and logins, including server-side verification, action and hostname checks, and the fallback when the widget cannot load.
publishedAt: 2026-10-20
audience: technical
topics: [Turnstile, Forms, Security]
readingMinutes: 6
relatedServices: [security-and-zero-trust]
draft: true
---

This article is a draft and is not published. It is kept in the repository to
demonstrate that drafts are excluded from the public index, the sitemap, the
routes and the AI finder's knowledge base.

## Outline

- Why CAPTCHAs cost conversions and what Turnstile does differently
- Widget modes: managed, non-interactive, invisible
- Server-side Siteverify with hostname and action checks (the step most integrations skip)
- Token lifetime and single use: what to do on retry
- Rate limiting as the second layer
- The honest fallback when the widget fails to load
