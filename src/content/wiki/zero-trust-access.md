---
term: "Cloudflare Access (Zero Trust)"
category: Security
summary: "Access puts an identity check in front of applications and internal tools without a VPN: a visitor signs in with your identity provider or a one-time code, a policy decides who gets through, and the application receives a signed token that proves who the user is."
docs: "https://developers.cloudflare.com/cloudflare-one/policies/access/"
useWhen: "Admin areas, staging sites, internal dashboards, SSH and RDP to servers, SaaS applications you want behind one login, and contractors who need access to one thing for a limited time."
avoidWhen: "Public pages, and as the only control on an application: the application should verify the Access token itself so that a misconfigured policy fails closed."
pricing: "Free for up to a set number of users, then per user per month on the Zero Trust plans. A Zero Trust plan must be selected in the dashboard before Access can be used."
pillars: ["security-and-zero-trust", "managed-cloudflare"]
insights: []
related: ["cloudflare-tunnel", "waf", "secrets", "bot-management"]
updatedAt: 2026-10-06
---

## Where it fits

The staff area of this site is an Access application: a policy allows named emails, and the Worker verifies the `Cf-Access-Jwt-Assertion` token against the team's public keys on every request. Access for a client's admin panel is usually a one-hour job that removes a whole category of risk.
