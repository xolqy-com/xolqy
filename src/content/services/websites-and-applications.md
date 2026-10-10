---
title: Websites & Applications
shortTitle: Websites & Apps
order: 1
eyebrow: Service 01
headline: Websites and applications that start at the edge.
summary: Astro websites, ecommerce frontends, APIs and SaaS products built on Workers with Static Assets, D1, R2 and the rest of the platform, delivered in your own Cloudflare account.
outcome: A site or application that loads fast everywhere, scales without capacity planning, and costs what it uses.
problems:
  - Your current site is slow outside its home region and every optimisation plugin makes it slower.
  - A rebuild has been quoted as a six-month project because the hosting, the CMS and the frontend are tangled together.
  - Your SaaS backend runs on a handful of servers that need babysitting, and traffic spikes mean 3am pages.
  - Product wants features (search, personalisation, an API for partners) that the current stack cannot deliver safely.
deliverables:
  - Astro website or application frontend on Workers with Static Assets, prerendered where possible
  - Backend endpoints and APIs on Workers with typed bindings, validation and rate limiting
  - "Data layer designed per need: D1 for relational records, KV for configuration, R2 for files, Durable Objects for coordination"
  - Headless integration with your CMS or ecommerce platform (WordPress, Shopify, commercetools, custom) where that is the right call
  - Design system and components, accessible by default (WCAG 2.2 AA)
  - Repository with CI, preview deployments per branch, Wrangler configuration and D1 migrations
  - "SEO foundations: metadata, structured data, sitemap, redirects, Core Web Vitals budgets"
  - Documentation and handover, including rollback steps
stack:
  - name: Workers + Static Assets
    role: Serves prerendered pages from the edge and runs API routes in the same deployment.
  - name: D1
    role: Relational data with migrations, parameterised SQL and point-in-time recovery.
  - name: R2
    role: Media, uploads and exports without egress fees.
  - name: KV
    role: Configuration and read-heavy cached data.
  - name: Durable Objects
    role: Sessions, carts, counters, live features and anything that needs a single source of truth.
  - name: Queues + Workflows
    role: Background jobs and multi-step processes with retries.
  - name: Images
    role: On-demand resizing and format conversion when the site carries real media.
process:
  - stage: Audit
    output: Content inventory, performance baseline, integration map (CMS, payments, analytics), and a list of what moves, what gets rebuilt and what gets retired.
  - stage: Architect
    output: Information architecture, design direction, data model, the Cloudflare services chosen for each need and why, and a delivery plan with milestones.
  - stage: Build & Migrate
    output: Working software on staging from week one, design reviews on real pages, content migration scripts, and a launch checklist rehearsed on a preview deployment.
  - stage: Optimize & Support
    output: Post-launch Core Web Vitals review from field data, cache and image tuning, analytics confirmation, and a handover session with your team.
faqs:
  - q: Why Astro?
    a: Astro renders to plain HTML by default and ships JavaScript only for the components that need it, which is what good Core Web Vitals require. It has first-class Cloudflare support, typed content collections, and it integrates with React, Vue or Svelte components where interactivity is needed. For application-heavy products we still use the framework your team knows best; the edge runtime is the constant, not the framework.
  - q: Can you work with our existing CMS?
    a: Usually yes. WordPress, Sanity, Contentful, Storyblok, Shopify and most headless CMSs expose APIs that a Workers frontend can read, with caching so your CMS is never in the request path for visitors. If your CMS is the bottleneck we will say so and propose options, including keeping it for editors only.
  - q: How do you handle ecommerce?
    a: Two patterns. A fast storefront on Workers that talks to your commerce platform (Shopify Storefront API, commercetools, Medusa, WooCommerce REST) for catalogue, cart and checkout, or a custom shop with D1, Durable Objects for carts and Stripe or your PSP for payments. The choice depends on catalogue size, integrations and who runs operations.
  - q: What about the backend of a SaaS product?
    a: Workers handle APIs and auth, D1 or Hyperdrive (for an existing Postgres) hold the data, Durable Objects coordinate per-tenant or per-document state, Queues and Workflows run background jobs, and R2 stores files. We design multi-tenancy, limits and observability from the start because they are painful to add later.
  - q: Do we get the source code?
    a: Everything is built in a repository you own, deployed to your Cloudflare account, with documentation. There is no proprietary layer between you and your product.
nextStep:
  label: Start your project
  href: /contact/?interest=websites-and-applications
interest: websites-and-applications
keywords:
  - website
  - web app
  - application
  - astro
  - ecommerce
  - shop
  - storefront
  - saas
  - api
  - backend
  - headless
  - cms
  - frontend
  - landing page
  - redesign
  - rebuild
  - react
  - next.js
  - static site
relatedLabs:
  - edge-inspector
  - r2-delivery
---

## How we build

We start from the content and the data, not from a template. Every page is classified as prerendered (most marketing and content pages), rendered on demand (personalised or data-driven pages) or an API endpoint. Prerendered pages become static assets served from Cloudflare's edge without touching a Worker; the rest runs in the Worker with typed bindings to D1, KV, R2 and the other services the application needs.

The data layer gets the same scrutiny. D1 is the authoritative store for anything relational; KV holds configuration and read-heavy data that can tolerate eventual consistency; R2 holds files; Durable Objects coordinate state that must be consistent, such as a cart or a live document. Choosing wrongly here is the most common mistake we fix in audits, so we document the choice for every piece of data.

Interactive features are loaded on demand. A storefront's product grid is HTML; the cart drawer is a small island that hydrates when touched. The result is a site whose JavaScript budget is measured in tens of kilobytes rather than megabytes, which is what Core Web Vitals targets require on real phones.

## What a typical engagement looks like

A marketing site with a headless CMS is usually four to eight weeks from kick-off to launch. An ecommerce frontend on an existing commerce platform is eight to twelve. A SaaS backend depends on scope and we estimate it after the architecture stage, when the data model and integrations are known. Each estimate names what is included and what is not.

## This site is the first example

xolqy.com is built exactly this way: Astro, prerendered pages, a Worker for the enquiry pipeline and the AI finder, D1 for records, R2 for downloads, Queues and Workflows for processing. The [stack page](/stack/) explains each piece and shows which integrations are live. The wider system this service sits inside is [Cloudflare OS Implementation by Xolqy](/cloudflare-os/).

A website for an agreed set of pages, from $1,200, is [Web design & development by Xolqy](/web-design/). Application, ecommerce and SaaS work stays on this page.
