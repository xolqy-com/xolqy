---
term: "Workers Static Assets"
category: Compute
summary: "Static Assets lets a Worker ship files with it: HTML, CSS, JavaScript, fonts and images that are served straight from Cloudflare's edge without running your code. It is how a modern website runs on Workers: prerendered pages as assets, dynamic routes in the Worker."
docs: "https://developers.cloudflare.com/workers/static-assets/"
useWhen: "Any website or application frontend built with Astro, Next.js, SvelteKit, Remix, plain HTML or similar, deployed to Workers."
pricing: "Requests for static assets are free and not counted against Workers request limits. You pay only for requests that reach your Worker code."
limits: "A per-file size limit and a total file-count limit per deployment, both generous for websites. Routing options cover trailing slashes, 404 pages, single-page applications and which paths should run the Worker first."
pillars: ["websites-and-applications", "cloudflare-migration", "performance-and-delivery"]
insights: ["websites-on-cloudflare-workers", "cloudflare-in-front-or-rebuild-on-workers", "cloudflare-as-an-operating-system"]
related: ["workers", "pages", "cache", "workers-builds"]
updatedAt: 2026-10-06
---

## How it works

At deploy time the files in your build output are uploaded alongside the Worker. A request is matched against the assets first; if a file matches it is served from the edge, otherwise the Worker runs. `run_worker_first` reverses that order for chosen paths, which matters for API routes and admin areas that must always hit the Worker.

## Where it fits

This is the replacement for Cloudflare Pages in new projects and the default shape of every site we build: everything that can be a file is a file, and the Worker handles forms, APIs and personalised pages.
