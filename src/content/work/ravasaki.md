---
title: Ravasaki
client: Ravasaki
url: https://ravasaki.com
sector: Consumer web app
location: Online
order: 3
eyebrow: Case study 03
headline: Anonymous letters with no accounts, running on Workers and D1.
summary: "Ravasaki lets anyone write the letter they never sent, share it through an unguessable link and receive an anonymous reply. No accounts, no AI drafting, no cookies. A server-rendered Astro application on Cloudflare Workers with D1 as its only database."
image: ../../assets/work/ravasaki.jpg
imageAlt: "Homepage of ravasaki.com: a serif headline over a background of handwritten letters and stamps."
brief: Build a consumer product where strangers exchange sensitive, human-written letters safely, with nothing to sign up for and nothing to run.
stack:
  - name: Workers
    role: "Server-rendered pages and the two API endpoints: create a letter, post a reply."
  - name: Static Assets
    role: Fonts, styles and images served from the edge next to the rendered pages.
  - name: D1
    role: "Two tables, notes and replies, with indexes for the sender view and the public feed."
  - name: Workers observability
    role: Logs for the write and reply paths without any third-party monitoring.
  - name: Wrangler
    role: "One command deploys the build from the private GitHub repository: astro build, then wrangler deploy."
tags:
  - Websites & Applications
  - D1
  - Consumer
outcomes:
  - A letter is written, sent and answered without anyone creating an account or installing anything.
  - Two unguessable identifiers per letter keep the recipient link and the sender's return link separate, so a shared link never exposes the writer.
  - No cookies and no advertising or tracking scripts, which means no consent banner and nothing to disclose beyond the letter itself.
  - The whole product runs on a single Worker and one D1 database, with no server to patch or scale between launches.
relatedServices:
  - websites-and-applications
  - security-and-zero-trust
---

## The product

Ravasaki is for the words people keep inside. Someone picks a category (love, a breakup, an apology, family, friendship, work, or a letter to themselves), writes in their own words, and gets a link to send. The recipient opens it and can reply anonymously. The writer comes back later through a separate private link to read the reply. Letters can also be published to a public feed, anonymously.

Two rules shape everything: the letters are written by humans, with no AI drafting anywhere in the product, and nobody has to create an account.

## Why Cloudflare

A product like this is almost all reads and small writes: a page render, a short insert, a link. There is no reason to keep a server running for it. The application is an Astro project rendered on demand by a Cloudflare Worker, with fonts and styles served as static assets from the same deployment. D1 holds the two tables that matter, notes and replies, and the indexes that make the sender view and the public feed cheap.

Identity is handled by the links. Each letter has a short recipient id and a longer sender token, both generated with nanoid and both unguessable. The recipient link never reveals the sender's return link, which is what makes anonymous two-way replies possible without any login.

## Design decisions

The core loop ships with nothing paid and nothing that needs consent: no cookies, no advertising scripts, no analytics that follow people. Observability stays inside Cloudflare's own Workers logs. Features that would add moving parts (email notifications for replies, rate limiting, expiry of old letters, paid sends) are deliberately parked until the product shows it is being shared.

Deployment is one command. The code lives in a private GitHub repository, `astro build` produces the Worker and its assets, and `wrangler deploy` ships them. There is no build server, no container image and no environment to keep in sync.

## What this demonstrates

A consumer web application with user-generated content on Cloudflare, with the privacy model enforced by the architecture rather than by policy text. It is the [Websites & Applications](/services/websites-and-applications/) pattern again, this time with server rendering and a relational database as the centre of the product.
