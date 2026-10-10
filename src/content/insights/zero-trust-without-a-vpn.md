---
title: "Zero Trust without a VPN: Access and Tunnel for a business"
description: Admin panels, staging sites and internal tools do not need a VPN. Cloudflare Access checks identity at the edge, Tunnel removes the public address, and the application still verifies the token.
publishedAt: 2026-10-07T16:00:00.000Z
audience: both
topics: ["Cloudflare OS", Zero Trust, Access]
readingMinutes: 6
relatedServices: [security-and-zero-trust]
---

A VPN made sense when the office was a network and the applications lived inside it. The applications moved. The VPN stayed, and it still means the same thing: a device joins a private network, and from there it can often see more than the one tool the person opened a laptop to use. When the VPN is down, the tool is down. When a contractor needs a single dashboard for a week, someone builds them a full tunnel and hopes they remember to revoke it.

[Cloudflare OS Implementation by Xolqy](/cloudflare-os/) puts identity at the edge of each application instead. Two products do most of the work. [Access](/wiki/zero-trust-access/) decides who may open it. [Tunnel](/wiki/cloudflare-tunnel/) makes sure there is no public address to walk around the decision.

## What Access actually checks

A visitor hits the hostname. Access asks them to sign in with your identity provider, or with a one-time code, and a policy decides whether that identity may continue. The application receives a signed token that says who they are.

That is the whole idea, and the limit is in the last sentence. Access in front of an application is not enough if the application trusts the network and never looks at the token. A misconfigured policy, or a request that found another route in, should fail closed. The application verifies the `Cf-Access-Jwt-Assertion` token: issuer, audience, signature, expiry.

This site does that on `/admin/`. A policy allows named emails. The Worker checks the token on every request and fails closed if Access is not configured. Visitors to the marketing site never see it.

Use it for admin areas, staging, internal dashboards, SSH and RDP to servers you still have, and a contractor who needs one application until a date. Do not use it on public pages. Do not use it as the only control and then stop.

Access requires a Zero Trust plan to be selected in the dashboard before it can be used. There is a free allowance up to a set number of users, then a per-user price. The number and the price change; the wiki states the shape, and a proposal states the figure for your team rather than a number copied into an article.

## What Tunnel removes

[Cloudflare Tunnel](/wiki/cloudflare-tunnel/) is an outbound connection from a small agent, `cloudflared`, running next to the origin. The origin does not need a public IP and does not need an inbound port open. Traffic reaches it only through Cloudflare.

That is the answer to a specific bypass: an attacker who ignores the proxy and talks to the server’s old address directly. It is also how a migration can keep a legacy origin reachable to Cloudflare and invisible to everyone else, and how [Hyperdrive](/wiki/hyperdrive/) reaches a private database without publishing it.

The tunnel itself is free. Related Zero Trust features are priced per user. “Free” does not mean “no design”. The hostname, the Access policy and the token check are still the work.

## Where a VPN is the wrong shape

**Staging and admin on the public internet.** A password on `/wp-admin` or a SaaS admin is a password on the internet. Access sits in front of it. The password can stay as a second check. The path from the whole internet to the login form does not have to.

**A team that is not in one office.** A VPN assumes a network to join. Access assumes an identity and a policy per application. Someone in another country opens the dashboard, authenticates, and reaches that dashboard. They do not join a subnet.

**A record of who got in.** Compliance questions are often “who reached the internal tool”. Access logs that. A VPN log is often “who connected”, which is a weaker fact. Those logs need somewhere to land. On a [security engagement](/services/security-and-zero-trust/) they go to the place your team already looks, with an alert for the few events that need a person.

**A contractor with a deadline.** A policy can allow one email, one application, one window of time. Revocation is editing the policy, not rotating a shared credential that three other people also know.

## What this does not replace

It does not replace the [WAF](/wiki/waf/), [DDoS protection](/wiki/ddos-protection/) or [rate limiting](/wiki/rate-limiting/) on the public site. Those stop attacks that are not trying to log in as your staff. [Turnstile](/wiki/turnstile/) still belongs on public forms, with server-side verification, because those forms are supposed to be reachable by strangers.

Gateway, the DNS and HTTP filtering for team devices, is a further step. It is in scope when you want the laptops filtered, not only the applications gated. It is not required to take an admin panel off the open internet. The [security service](/services/security-and-zero-trust/) sequences the layers: network, WAF, bots and rate limits, Turnstile, Access, Tunnel, then Gateway if the devices are part of the brief.

## A practical order

1. List the hostnames that should not be public. Admin, staging, dashboards, SSH.
2. Put Access in front of them and confirm a stranger gets the login wall, not the application.
3. Verify the token inside the application, so a bypass fails closed.
4. If the origin still has a public IP, put a tunnel in front of it and remove the address from DNS except as a proxied name.
5. Write down who the policies allow. Review it when someone leaves.

That list is a few hours for a single admin panel and a real design for a company with a dozen internal tools. Either way it is part of the security layer of [Cloudflare OS Implementation by Xolqy](/cloudflare-os/), not a separate religion. The public site, the data stores and the account ownership stay where they were. You have removed the VPN as the thing the business depends on to open its own tools.
