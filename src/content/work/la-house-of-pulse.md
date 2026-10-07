---
title: La House of Pulse
client: La House of Pulse
url: https://lahouseofpulse.com
sector: Hot yoga, Pilates and barre studio
location: Nice, Côte d'Azur
order: 1
eyebrow: Case study 01
headline: A bilingual studio site that runs on Cloudflare Pages and reports its own traffic.
summary: Multilingual marketing site for a hot yoga, Pilates and barre studio on the Côte d'Azur, prerendered and served from Cloudflare Pages, with a password-protected staff dashboard that reads Cloudflare Web Analytics directly.
image: ../../assets/work/la-house-of-pulse.jpg
imageAlt: "Homepage of lahouseofpulse.com: the studio's hero image with the class menu and booking buttons."
brief: Build a fast bilingual studio site that the owners can keep up to date without a CMS, and give them a simple view of their traffic without a Google Analytics account.
stack:
  - name: Cloudflare Pages
    role: Hosts the prerendered site and serves every page from the edge.
  - name: Pages Functions
    role: A small server layer for the staff login and the statistics endpoint; nothing else runs code.
  - name: Web Analytics
    role: Cookieless traffic and Core Web Vitals, queried through the GraphQL API for the staff dashboard.
  - name: Eleventy
    role: Static site generator with English and French content trees, schedule and rates as data files.
  - name: Booking app hand-off
    role: Classes are booked in the studio's existing iOS/Android booking app; the site links straight into it.
tags:
  - Websites & Applications
  - Performance & Delivery
  - Static site
  - Bilingual
outcomes:
  - Every page is a static file at the edge, so there is no server, no plugin stack and nothing to patch.
  - Classes, schedule, rates and team are data files the studio edits as text, with the English and French sites generated from the same source.
  - Staff see visits, pages and sources for the last day, week or month on a protected page, without a third-party analytics account or cookies on visitors.
  - Each class has its own landing page, so search traffic lands on the class people searched for rather than a generic homepage.
relatedServices:
  - websites-and-applications
  - performance-and-delivery
---

## The starting point

A studio site has a short list of jobs: show the schedule, explain the classes, get people into the booking app, and rank for the classes locally. Those jobs do not need a database, a CMS or a plugin for every feature; they need pages that load instantly on a phone and content the owners can change themselves.

## What we built

A static site generated with Eleventy from a small set of data files: the weekly schedule, the rate card, the team, the navigation. English and French are separate content trees built from the same data, so a schedule change is made once. Each class (hot yoga, Bikram, Pilates, barre, infrared recovery and the rest) gets its own page with its own metadata, which is what local search needs.

The site is served by Cloudflare Pages. The only code that runs on request is a pair of Pages Functions: a login that protects `/admin/`, and an endpoint that queries Cloudflare Web Analytics over the GraphQL API and returns visits, page views, top pages and sources for the chosen period. The dashboard is a plain page that calls that endpoint, so the studio reads its traffic without a Google Analytics account and visitors get no analytics cookies.

Booking stays in the studio's existing app; the site hands off to it from every class page and from the schedule.

## Why it matters

The site runs on Cloudflare's free tier, has no plugin that can break it, and the people who run the studio can change a class time by editing a line. That is what "faster and leaner" looks like for a small business: fewer moving parts, not more features.
