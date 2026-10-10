---
title: Your Cloudflare account should be yours
description: The agency, the freelancer or the previous developer should not own the Cloudflare account the business runs on. Here is what “yours” means in practice, and what breaks when it is not.
publishedAt: 2026-10-08T16:00:00.000Z
audience: business
topics: ["Cloudflare OS", Accounts, Wrangler]
readingMinutes: 7
relatedServices: [managed-cloudflare, websites-and-applications]
---

There is a quiet way for a website to become someone else’s property. The domain is in the client’s registrar. The Cloudflare account is in the freelancer’s email. The DNS, the firewall rules, the Worker and the database all live in that account. The site works. The invoice is paid. Then the freelancer is busy, or gone, and the business cannot change a record, export a backup, or end the relationship without asking permission.

[Cloudflare OS Implementation by Xolqy](/cloudflare-os/) is built on the opposite arrangement. The account is yours before the first Worker is deployed.

## What “yours” means

You are the owner of the Cloudflare account. Billing is in your name. Zones, Workers, D1 databases, KV namespaces, R2 buckets and Zero Trust applications are resources in that account, not in ours.

We join the account as members, with the least role that does the job, or we use scoped API tokens. Changes to billing and to account ownership stay with you. That is the same rule on a one-off build and on a [managed](/services/managed-cloudflare/) month.

The code matches the account. The repository is yours: application, [Wrangler](/wiki/wrangler/) configuration, D1 migrations, and the [bindings](/wiki/bindings/) that connect the Worker to its data. [Secrets](/wiki/secrets/) are set on the Worker, not committed. A `.env` or `.dev.vars` file does not go in Git. When the engagement ends, the next person clones the repository and continues. They do not reconstruct a dashboard from memory.

If we part ways, nothing has to move. Leaving a monthly engagement is a handover, not a migration.

## What goes wrong when it is not

The failure is not dramatic. It is administrative, and it arrives on a bad day.

**You cannot see the bill.** Usage-based products (Workers, D1, R2, Workers AI) are billed to the account that owns them. If that account is not yours, you cannot see which product grew, and you cannot put a budget alert where your finance team will read it.

**You cannot rotate access.** Members, tokens and [Access](/wiki/zero-trust-access/) policies live in the account. If the only super administrator is a contractor, removing them is a negotiation. Scoped tokens exist so that removing a person is a click, not a project.

**You cannot leave cleanly.** Moving a zone to another account is possible and is still a migration: DNS, SSL, rules, Workers, data. The whole point of building in your account is that ending the contract does not include that move. A business that has to migrate in order to fire its agency does not own its system.

**Configuration drifts into one login.** Dashboard changes are fast and invisible. If the only login is shared, there is no record of who changed a firewall rule the afternoon the checkout broke. Configuration that can live in Wrangler lives in the repository, reviewed like any other change. The rest has a change log. That is part of [managed Cloudflare](/services/managed-cloudflare/), and it is also how a careful internal team should work.

None of this requires a horror story. It is the difference between a vendor who can be replaced and a vendor who has to be lived with.

## What we will not hold

We do not ask for the account owner’s password. We do not put client zones inside the agency account “to make support easier”. We do not keep a copy of production secrets in a personal password manager as the system of record.

Local development uses its own secrets. Production secrets are set with `wrangler secret put` or in the dashboard, on your account. The types for bindings are generated from the configuration, so a missing database is a compile error rather than a surprise after deploy.

## What to put in place before anyone else joins

These are the controls we already use, written up on the [security page](/security/). They apply whether the extra person is an agency or a new hire.

**More than one owner.** The super administrator should not be a single personal inbox. Billing and account ownership stay with the company, and a second member can recover the account.

**Membership with a narrow role, or a scoped token.** No shared logins. API tokens are limited to the zone or Worker they are for, and they expire. When the work ends, the membership is removed and the token is revoked. Audits can often run from exported configuration and read-only access, which is a reason to start there.

**Two-factor authentication on every member.** Cloudflare can require it for the account. Turn that on before the first contractor is invited.

**Secrets out of the repository.** Workers Secrets for production. An ignored `.dev.vars` for local development. Not a copy of production in either file, and not a token pasted into a ticket.

**A written split between code and dashboard.** Wrangler holds the Worker, the bindings and the migrations. DNS, TLS, WAF, Access, Turnstile and Email Service onboarding are dashboard settings, and they are the ones a person can change without a commit. The [stack page](/stack/) is that split for this website. Yours can be a page in the repository.

## If you are building it yourself

The same rule applies, including when there is no agency.

Create the Cloudflare account in the company’s name, with a shared billing owner and more than one super administrator. Put the repository in the company’s organisation. Prefer API tokens over a shared login. Write down which settings live in Wrangler and which live only in the dashboard, because the second list is the one that walks out the door with a person.

The [stack page](/stack/) on this site is that list for xolqy.com: code on one side, dashboard on the other. Your version will be shorter. Write it anyway.

[Cloudflare OS Implementation by Xolqy](/cloudflare-os/) assumes this from the audit onward. The architecture document names resources that will exist in your account. The build puts them there. Support, if you want it, is a named engineer inside that account, not a reason to move it.
