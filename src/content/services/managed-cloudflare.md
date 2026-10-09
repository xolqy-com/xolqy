---
title: Managed Cloudflare
shortTitle: Managed
order: 6
eyebrow: Service 06
headline: A named engineer for everything you run on Cloudflare.
summary: Monitoring, configuration reviews, troubleshooting, maintenance and ongoing engineering on a monthly basis, for teams that want Cloudflare run well without hiring for it.
outcome: Someone accountable for your Cloudflare estate every month, with alerts that reach a person, reviews that catch drift, and engineering hours for the next improvement.
problems:
  - Cloudflare was set up by someone who left, and nobody is sure what the rules do.
  - Changes happen in the dashboard with no record, and something broke after one of them.
  - Platform features you pay for (WAF, Argo, Images) are enabled but never tuned.
  - You need an engineer a few days a month, not a full-time hire.
deliverables:
  - "Onboarding review of the whole account: zones, Workers, data services, security, billing"
  - "Monitoring and alerting: uptime, error rates, Workers exceptions, security events, certificate expiry, budget thresholds"
  - Monthly configuration review with a short written report and a change log
  - Configuration as code for Workers and, where supported, for rules and DNS (Wrangler, Terraform)
  - Troubleshooting and incident response within agreed response times
  - "Platform maintenance: compatibility dates, dependency updates, deprecations, new features worth adopting"
  - Engineering hours each month for improvements from a shared backlog
  - Quarterly architecture and cost review
stack:
  - name: Workers observability and Logpush
    role: Errors, traces and logs where your team already looks.
  - name: Notifications
    role: Alerts for security, availability, certificates and usage.
  - name: Health Checks
    role: Origin and endpoint monitoring from multiple regions.
  - name: Terraform and Wrangler
    role: Account and application configuration as code with review.
  - name: Account API tokens
    role: Scoped, auditable access instead of shared logins.
process:
  - stage: Audit
    output: Full account review and a findings list sorted by risk, plus the monitoring and alerting baseline we will operate from.
  - stage: Architect
    output: "Operating agreement: response times, what we change independently and what needs approval, the change process, and the monthly report format."
  - stage: Build & Migrate
    output: Monitoring and alerting in place, configuration exported to code, access tokens scoped, and the first month's backlog agreed.
  - stage: Optimize & Support
    output: "The monthly cycle: review, report, maintenance, improvements, and a quarterly review of architecture and spend."
faqs:
  - q: Do you replace our team or work with it?
    a: Either. Some clients have no infrastructure engineer and we are it; others have a team that wants Cloudflare expertise on call. The operating agreement sets who does what.
  - q: What are the response times?
    a: Agreed per engagement and written into the operating agreement. We do not publish a single number because a marketing site and a payments API need different commitments.
  - q: What counts as an incident?
    a: "Anything that affects your visitors or your team: an outage, a security event, a certificate problem, a Worker throwing errors. The monitoring is designed to tell us before you do; when it does not, you have a direct line."
  - q: Can we cancel?
    a: Monthly engagements run month to month with notice. Everything we configure is in your account and documented, so leaving is a handover, not a migration.
  - q: Do you need admin access to our account?
    a: We work with the least access that does the job, through scoped API tokens and member roles. Changes to billing or account ownership stay with you.
nextStep:
  label: Request a proposal
  href: /contact/?interest=managed-cloudflare
interest: managed-cloudflare
keywords:
  - managed
  - support
  - monitoring
  - maintenance
  - retainer
  - ongoing
  - troubleshooting
  - incident
  - alerts
  - configuration review
  - engineer
  - operations
  - devops
  - sre
relatedLabs:
  - enquiry-pipeline
---

## What "managed" means here

Not a ticket queue. A named engineer who knows your account, reviews it monthly, is paged by the alerts we set up, and has hours each month to make things better. The monthly report lists what changed, what we saw in the logs, what we recommend, and what the platform spend was.

## Configuration as code

Dashboard changes are quick and invisible. We export what can be exported to Wrangler and Terraform, review changes before they apply, and keep a change log for the rest. When something breaks after a change, the answer to "what changed?" takes a minute, not a day.

## Keeping up with the platform

Cloudflare ships constantly: new compatibility dates, deprecations, services that replace workarounds you built last year. Part of every month is spent deciding which of those matter for you, applying the ones that do, and ignoring the rest.

The thing being looked after is the whole estate, which is what [Cloudflare OS](/cloudflare-os/) means: one system, in your account, with a person who knows it.
