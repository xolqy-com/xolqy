---
title: Security & Zero Trust
shortTitle: Security
order: 4
eyebrow: Service 04
headline: Protection in front of everything, access only for the right people.
summary: WAF, DDoS protection, bot controls and rate limiting for your public services; Access, Gateway and Tunnel for the private ones. Configured for your application, reviewed against real traffic.
outcome: Attacks absorbed at the edge, abuse stopped before it costs you, and internal tools reachable without a VPN by exactly the people who should reach them.
problems:
  - Login and contact forms are flooded by bots and the CAPTCHA you added is losing real customers.
  - The admin panel is on the public internet behind a password and a prayer.
  - A credential-stuffing attack took the site down last quarter and nobody knew until customers called.
  - Compliance asks for an access log of who reached internal tools, and the VPN cannot produce one.
deliverables:
  - "WAF configuration: managed rulesets, custom rules for your application, OWASP sensitivity tuned to real traffic"
  - DDoS settings review and rate limiting rules for APIs, logins and forms
  - "Bot management: Bot Fight Mode or Bot Management scoring rules, verified bot allowances"
  - Turnstile on forms and logins with server-side validation implemented in your application
  - Cloudflare Access policies for admin panels, staging sites and internal tools, with identity provider integration
  - Cloudflare Tunnel for origins and services that should have no public IP at all
  - Gateway policies for team devices where that is in scope
  - "TLS hardening: minimum version, HSTS, origin certificates, Authenticated Origin Pulls"
  - "Logging and alerting: security events, Access logs, notification policies"
  - Written security configuration document and a quarterly review
stack:
  - name: WAF
    role: Managed and custom rules at the edge, tuned to the application.
  - name: DDoS protection and Rate limiting
    role: Volumetric protection and per-client limits on sensitive endpoints.
  - name: Bot Management / Turnstile
    role: Bot scoring and invisible challenges with mandatory server-side verification.
  - name: Access
    role: Identity-aware access to applications, verified again inside the application code.
  - name: Tunnel
    role: Private connectivity for origins without public exposure.
  - name: Gateway
    role: DNS and HTTP filtering for team devices.
  - name: Logpush and Notifications
    role: Security events to your SIEM or inbox.
process:
  - stage: Audit
    output: Exposure review (public origins, open ports, DNS leaks), WAF and bot event analysis, access inventory for internal tools, TLS configuration check, and a prioritised findings list.
  - stage: Architect
    output: Rule design per application, Access policy matrix (who, what, from where, with which identity), Tunnel topology, rate-limit thresholds derived from traffic, and the logging plan.
  - stage: Build & Migrate
    output: Rules deployed in log-only mode first, then enforced after review; Turnstile integrated server-side; Access and Tunnel rolled out tool by tool with the users informed.
  - stage: Optimize & Support
    output: Weekly false-positive review for the first month, then quarterly; rule updates as the application changes; incident support.
faqs:
  - q: Will the WAF block real customers?
    a: Managed rules are deployed in log mode first so we see what they would have blocked. We tune exceptions for your application's legitimate traffic (file uploads, rich text, webhooks) before switching to block. After that, a weekly review catches the rest.
  - q: What is Zero Trust in plain terms?
    a: "Instead of trusting anyone who is on the network or has a VPN, every request to an internal tool is checked against identity and policy: who you are, which device, from where. Cloudflare Access does that check at the edge; your application verifies the resulting token too, so the protection does not depend on a single layer."
  - q: Do we need Bot Management or is Turnstile enough?
    a: Turnstile protects specific actions, such as a login or a form, and is free. Bot Management scores every request and is for sites where scraping, inventory hoarding or credential stuffing are business problems. Many clients start with Turnstile plus rate limiting and add Bot Management when the traffic justifies it.
  - q: Can you protect servers that are not on Cloudflare?
    a: Yes. With Cloudflare Tunnel the origin makes an outbound connection and has no public IP; with Authenticated Origin Pulls the origin only accepts traffic from Cloudflare. Either way, the origin stops being reachable directly.
  - q: What about our team's devices and SaaS apps?
    a: Gateway and the WARP client extend policies to devices and SaaS logins. That is a separate scope from protecting a website and we quote it separately when it is relevant.
nextStep:
  label: Request a security review
  href: /contact/?interest=security-and-zero-trust
interest: security-and-zero-trust
keywords:
  - security
  - waf
  - firewall
  - ddos
  - bots
  - bot protection
  - captcha
  - turnstile
  - zero trust
  - access
  - vpn
  - admin
  - staging
  - tunnel
  - gateway
  - rate limiting
  - login
  - credential stuffing
  - attack
relatedLabs:
  - enquiry-pipeline
---

## Layers, in order

Volumetric attacks are absorbed by Cloudflare's network before they reach anything you pay for. The WAF filters requests that match known attack patterns and the custom rules we write for your application. Rate limiting and bot controls stop abuse that looks like legitimate traffic, one request at a time. Turnstile protects the specific actions that matter, with the token verified on the server so that the check cannot be skipped. Access decides who may reach internal tools at all, and Tunnel removes the origin from the public internet.

Each layer is configured, not just enabled. Defaults protect against generic attacks; your application has specific endpoints, specific legitimate traffic and specific things worth protecting.

## Verification happens inside the application too

A common mistake is to trust that the edge did its job. We implement Turnstile Siteverify in your backend with hostname and action checks, and we validate the Access JWT in the application code against the issuer and audience, so that a misconfiguration or a bypass does not silently open the door. This site does both: the enquiry form is verified server-side and the staff view checks the Access token on every request.

## Logs you will read

Security events, Access logs and rate-limit hits are routed to where your team already looks, with notification policies for the few things that need a human now. The quarterly review turns those logs into rule updates.

Security is a layer of [Cloudflare OS](/cloudflare-os/), in front of the compute and the data, not a product installed at the end.
