---
term: "Turnstile"
category: Security
summary: "Turnstile is Cloudflare's replacement for CAPTCHAs: a widget that verifies a visitor is human, usually without showing a puzzle, and produces a token that your server must verify before accepting the form. Visitors see a small checkmark or nothing at all."
docs: "https://developers.cloudflare.com/turnstile/"
useWhen: "Any form or endpoint that bots abuse: contact and signup forms, login, comments, checkout, API calls from a browser."
avoidWhen: "Relying on the widget alone. A token that is not verified server-side, with the hostname and action checked, protects nothing."
pricing: "Free, with a cap on the number of widgets on the free tier and higher limits on Enterprise."
pillars: ["security-and-zero-trust", "websites-and-applications"]
insights: []
related: ["waf", "bot-management", "rate-limiting", "workers"]
updatedAt: 2026-10-06
---

## How we implement it

The widget renders in the form with an action name; the Worker sends the token to Siteverify together with the visitor's IP, then checks that the response succeeded, that the hostname is ours and that the action matches. Only then is the enquiry stored. The form on this site works exactly that way, and the Labs page shows the verification result in the pipeline trace.
