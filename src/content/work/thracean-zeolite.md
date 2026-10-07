---
title: Thracean Zeolite
client: Thracean Zeolite
url: https://thraceanzeolite.com
sector: Mining and agriculture, B2B export
location: Komotini, Thrace, Greece
order: 4
eyebrow: Case study 04
headline: A bilingual export site for a mineral producer, with Cloudflare in front of a conventional host.
summary: "Thracean Zeolite mines and processes clinoptilolite zeolite in Thrace and sells it to growers from Greece to the Gulf. A fast, bilingual static site on the client's existing Apache hosting, with Cloudflare handling DNS, TLS, caching and analytics in front of it."
image: ../../assets/work/thracean-zeolite.jpg
imageAlt: "Homepage of thraceanzeolite.com: the English hero over an aerial photo of olive groves, with the product claims."
brief: Give an exporting mineral producer a credible, fast, bilingual presence for buyers abroad, without changing the hosting it already pays for.
stack:
  - name: DNS and proxy
    role: "Authoritative DNS with proxied records, so every request passes through Cloudflare and the origin sits behind it."
  - name: CDN cache
    role: Images and assets cached at the edge with a one-year lifetime; pages served fresh from the origin.
  - name: TLS and DDoS protection
    role: Automatic certificates and always-on mitigation at the edge, with nothing to configure on the origin.
  - name: Web Analytics
    role: Cookieless visits and Core Web Vitals, so the site needs no consent banner.
  - name: Static site on Apache
    role: "Hand-built pages with AVIF images and hreflang between English and Greek, on the client's existing shared hosting."
tags:
  - Cloudflare Migration
  - Performance & Delivery
  - Bilingual
  - Static site
outcomes:
  - Buyers in Greece and the Gulf load images and assets from Cloudflare's nearest location instead of from one server in Europe.
  - The producer kept its existing hosting and email. Cloudflare was added in front, so the change carried no migration risk and no downtime.
  - English and Greek versions with correct hreflang, so each market finds its own language in search.
  - A savings calculator, lab certificates and a field-trial case study give buyers the technical evidence a mineral purchase needs, without a CMS to patch.
  - Traffic and Core Web Vitals are measured without cookies, so there is no consent banner between a buyer and the product.
relatedServices:
  - cloudflare-migration
  - performance-and-delivery
---

## The client

Thracean Zeolite mines natural clinoptilolite zeolite near Komotini, in Thrace, and processes it into a soil amendment for vegetables, olive groves, lawns and date palms. Its buyers are growers and distributors, many of them outside Greece, who want technical evidence before they order: specifications, laboratory analyses, certificates and trial results.

## What was built

A bilingual static site in English and Greek with the sections a technical buyer looks for: what the mineral is, product specifications and formats, agronomic benefits, applications by crop, a savings calculator, a field-trial case study from a date-palm plantation in Saudi Arabia, a gallery, the certificates page and a blog. Pages are hand-built HTML with modern image formats, so there is no CMS to update and nothing to patch.

## Why Cloudflare in front

The site stays on the conventional Apache hosting the client already had. Cloudflare sits in front of it: authoritative DNS with proxied records, automatic TLS, always-on DDoS protection, and the cache. Images and assets are cached at the edge with a one-year lifetime, so a buyer in Riyadh loads them from a nearby data centre rather than from a server in Europe, while the HTML itself is served fresh from the origin. Web Analytics measures visits and Core Web Vitals without cookies.

This is the first of the three shapes described on the [migration service page](/services/cloudflare-migration/): Cloudflare in front of an existing origin. It is the fastest and lowest-risk step a business can take, and for a static export site it delivers most of the benefit.

## What this demonstrates

Not every project needs Workers. For a site like this, Cloudflare in front of existing hosting gives global delivery, security and measurement at a fraction of the change a rebuild would involve. When the client wants more, a Turnstile-protected enquiry form, a product enquiry pipeline, image transformations at the edge, the path to Workers is open without moving the domain again. That is the pattern in the [Performance & Delivery](/services/performance-and-delivery/) service, applied to a business that sells rock, not software.
