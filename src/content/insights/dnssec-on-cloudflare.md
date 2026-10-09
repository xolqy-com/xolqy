---
title: "DNSSEC on Cloudflare: what it protects, how to turn it on, and the step everyone forgets"
description: "DNSSEC signs your DNS answers so resolvers can reject forged ones. On Cloudflare it is one switch plus one record at your registrar. What it does and does not protect, how to enable it, how to check it worked, and how to avoid the outage when you change provider."
publishedAt: 2026-10-07
audience: both
topics: [DNSSEC, DNS, Security]
readingMinutes: 8
relatedServices: [security-and-zero-trust, cloudflare-migration]
---

Every visit to your website and every email sent to your domain starts with a DNS lookup: a resolver asks where `yourcompany.com` lives and trusts the answer it gets back. Plain DNS has no way to prove that answer is genuine. DNSSEC adds that proof. Your DNS provider signs each answer, the parent zone (`.com`, `.gr`, `.io`) vouches for your signing key, and a validating resolver throws away anything that does not check out.

On Cloudflare, turning it on takes two minutes and one record at your registrar. This guide explains what DNSSEC protects, how to enable it, how to confirm it is working, and the one mistake that takes domains offline.

## What DNSSEC protects against

DNSSEC protects the **integrity** of DNS answers. A resolver that validates DNSSEC (Cloudflare's 1.1.1.1, Google's 8.8.8.8 and most large ISPs do) will reject an answer that was forged or altered between your DNS provider and the visitor. That closes off a class of attacks:

- **Cache poisoning**, where an attacker plants a false answer in a resolver so that everyone using it is sent to the wrong server.
- **On-path tampering** of DNS responses on networks the visitor does not control, such as public Wi-Fi.
- **Redirected email**, where a forged MX answer sends mail for your domain to someone else's server.

It also underpins newer standards that publish security information in DNS, such as DANE for email, which only work on signed zones.

## What it does not do

DNSSEC is often described as "encrypted DNS", and it is not. It is worth being precise, because the gaps are where people get caught out:

- **It does not encrypt anything.** Answers are signed, not hidden. Privacy for lookups comes from DNS over HTTPS or DNS over TLS, which are separate.
- **It does not protect your registrar account.** If someone logs in to your registrar and changes your nameservers, DNSSEC will not save you. Use a strong password and two-factor authentication there, and a registry lock for important domains.
- **It does not replace HTTPS.** TLS certificates still authenticate the website itself. DNSSEC makes sure the visitor reaches the right address in the first place.
- **It does not help visitors whose resolver does not validate.** Coverage is broad and growing, but not universal.

## How it works, in one paragraph

Your DNS provider holds a signing key and signs every record set in your zone. A fingerprint of that key, the **DS record** (Delegation Signer), is published one level up, in the registry for your top-level domain, through your registrar. A resolver can then follow a chain of signatures from the root of DNS, through `.com`, to your zone. If any link is missing or does not match, a validating resolver treats the answer as bogus. That is why the DS record matters so much: without it nothing is validated, and with a wrong one your domain stops resolving for every validating resolver.

## Turning it on with Cloudflare

Cloudflare signs zones with ECDSA P-256 (algorithm 13), which keeps responses small and fast, and manages key rotation for you.

1. In the Cloudflare dashboard, open your domain, then **DNS → Settings**, and select **Enable DNSSEC**.
2. Cloudflare shows the DS record and its parts: key tag, algorithm (13), digest type (2, SHA-256) and the digest. Leave the window open or copy the values.
3. Log in to your **registrar**, the company you pay for the domain, which is often not Cloudflare. Find the DNSSEC or DS records section of the domain and add a record with the key tag, algorithm, digest type and digest. A few registrars ask for the DNSKEY instead (flags 257, protocol 3, algorithm 13 and the public key); Cloudflare shows those values too. If the registrar lists algorithms by name, 13 is "ECDSA Curve P-256 with SHA-256".
4. Return to Cloudflare. The status moves from **Pending** to **Active** once the registry has published the DS record, usually within an hour and occasionally up to a day.

If your domain is registered with **Cloudflare Registrar**, step 3 is done for you: the DS record is added automatically when you enable DNSSEC.

## Checking that it works

- **Cloudflare dashboard**: DNS → Settings shows DNSSEC as **Active**.
- **DNSViz** (dnsviz.net) draws the full chain of trust from the root to your zone and flags any break.
- **Command line**: `dig yourcompany.com +dnssec` should return `RRSIG` records, and a query through a validating resolver should show the `ad` (authenticated data) flag.
- **Our [free Health Check](/health-check/)** reports DNSSEC alongside HTTPS, security headers, SPF and DMARC.

## The step everyone forgets: changing DNS provider

DNSSEC goes wrong in one predictable situation: moving a domain between DNS providers while the old DS record is still published. The registry keeps vouching for the old provider's key, the new provider signs with a different one (or not at all), and every validating resolver rejects your answers. To visitors, the site and email simply disappear.

The safe order when moving **to** Cloudflare or **away** from it:

1. Remove the DS record at the registrar, or disable DNSSEC at the old provider.
2. Wait for the DS record's TTL to expire, typically one to two days, and confirm with DNSViz that the zone is unsigned.
3. Change the nameservers.
4. Enable DNSSEC at the new provider and add the new DS record.

Cloudflare also supports multi-signer DNSSEC for zero-downtime moves between providers that both support it, but for most businesses the four steps above are simpler and safe. This is part of every [Cloudflare migration](/services/cloudflare-migration/) we run, because it is the step that turns a routine nameserver change into an outage.

## Should every domain have it?

For a domain that carries a website people log in to, takes payments or sends email, yes. The cost is a few minutes once, Cloudflare handles key rotation, and the signatures add no noticeable latency with algorithm 13. The real risk is operational, and it is limited to provider changes, which the checklist above covers.

Domains that are parked or used only for redirects benefit less, but enabling DNSSEC on them is just as cheap.

## Where it fits in a security setup

DNSSEC is one layer. A sensible baseline for a business domain on Cloudflare is:

- DNSSEC, so DNS answers cannot be forged;
- CAA records, so only the certificate authorities you choose can issue for your domain;
- SPF, DKIM and DMARC at `p=reject`, so nobody can send email as you;
- HTTPS everywhere with HSTS, and security headers on the site;
- two-factor authentication and a lock at the registrar.

All of these are covered in our [Security & Zero Trust](/services/security-and-zero-trust/) work, and the Security Hardening Pack in the [shop](/shop/#security-hardening) sets them up as a fixed-scope job.

## Frequently asked questions

### Does DNSSEC slow down my website?

Not in any way a visitor would notice. Signatures make DNS responses larger, but Cloudflare's elliptic-curve signatures are small, and resolvers cache validated answers like any others.

### Is DNSSEC free on Cloudflare?

Yes, on every plan, including Free.

### My registrar does not support DNSSEC. What can I do?

Most registrars for common top-level domains do. If yours does not, transferring the domain to a registrar that does (Cloudflare Registrar among them) is the only route, since the DS record has to be published through the registrar.

### What happens if I add a wrong DS record?

Validating resolvers will treat your domain as broken and stop resolving it. Copy the values exactly from Cloudflare, check the status turns Active, and verify with DNSViz. If something is wrong, removing the DS record at the registrar restores resolution once its TTL expires.

### Does DNSSEC protect my email?

It protects the DNS lookups email depends on, such as MX, SPF and DMARC records, from being forged. It does not stop spoofed senders by itself; that is the job of SPF, DKIM and DMARC.

## Sources

- [DNSSEC](https://developers.cloudflare.com/dns/dnssec/), Cloudflare docs, including multi-signer DNSSEC and zero-downtime migration
- [How DNSSEC works](https://www.cloudflare.com/learning/dns/dnssec/how-dnssec-works/), Cloudflare Learning Center
- [RFC 4033: DNS Security Introduction and Requirements](https://www.rfc-editor.org/rfc/rfc4033)
- [DNSViz](https://dnsviz.net/)
