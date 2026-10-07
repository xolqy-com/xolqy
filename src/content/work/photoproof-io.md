---
title: photoproof.io
client: photoproof.io
url: https://photoproof.io
sector: SaaS for photographers
location: Online
order: 2
eyebrow: Case study 02
headline: A photo-proofing web app that runs entirely on Cloudflare.
summary: Photographers upload a shoot, share one link, and clients mark favourites, comment, approve and download without an account. The whole application, from upload to delivery, runs on Cloudflare.
image: ../../assets/work/photoproof-io.jpg
imageAlt: "Homepage of photoproof.io: a plain headline, one sentence of explanation and the sign-up button."
brief: Build a photo-proofing product that is simple for clients, fast for large uploads, and cheap enough to offer free, without a server to run.
stack:
  - name: Workers
    role: "The application and its API: galleries, share links, decisions, downloads."
  - name: R2
    role: Object storage for the photos. No egress fees, which is what makes free galleries viable.
  - name: D1
    role: Galleries, photos, client decisions and comments.
  - name: Static Assets
    role: The app shell and the client gallery, served from the edge.
  - name: Workers observability
    role: Logs and errors for the upload and delivery paths.
tags:
  - Websites & Applications
  - R2
  - SaaS
outcomes:
  - Clients review a gallery from a link, with no login, on any device.
  - Uploads and downloads go straight to and from object storage at the edge, so a large shoot does not pass through a server.
  - Galleries expire automatically after 30 days, which keeps storage and privacy exposure bounded by design.
  - Free up to 2 GB per photographer, possible because storage has no egress charges and there is no fleet of servers to pay for.
relatedServices:
  - websites-and-applications
  - performance-and-delivery
---

## The product

photoproof.io does one thing: a photographer uploads a shoot, sends one link, and the client picks favourites, leaves comments, approves and downloads the final selection. No client accounts, no app to install, nothing to explain over the phone.

## Why Cloudflare

A proofing tool is mostly files: hundreds of large images per shoot, uploaded once and viewed a handful of times. On a traditional stack that means a storage bill with egress charges on every view, plus a server sized for the upload spikes. On Cloudflare the photos live in R2 (no egress fees), the application logic runs in Workers next to the storage, and there is no server to size.

The gallery link is the whole client experience. The static shell comes from the edge and the Worker handles the dynamic parts (favourites, comments, approvals, downloads), so it loads fast on a phone over a mobile connection, which is where clients open it.

## Design decisions

Galleries expire after 30 days. That keeps storage bounded and means a client's photos are not sitting online indefinitely. The free tier (2 GB) is a pricing decision made possible by the cost structure of R2 and Workers, not a loss leader subsidised by servers.

## What this demonstrates

A complete SaaS product, not a marketing site: photographer accounts, file upload and delivery at scale, a public client flow with no accounts, and operating costs that scale with use. It is the pattern described in the [Websites & Applications](/services/websites-and-applications/) service, applied to a real product.
