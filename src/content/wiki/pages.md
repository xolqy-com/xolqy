---
term: "Cloudflare Pages"
category: Compute
summary: "Pages is Cloudflare's earlier platform for static sites and Jamstack applications, with Git-based builds, preview deployments per branch and Pages Functions for server code. It still works and is widely used, but Cloudflare now recommends Workers with Static Assets for new projects."
docs: "https://developers.cloudflare.com/pages/"
useWhen: "Existing sites already on Pages that are stable. New projects should start on Workers with Static Assets, which has the same Git integration through Workers Builds and more platform features."
pricing: "Free unlimited bandwidth and requests for static content, with a monthly allowance of builds on the free plan. Pages Functions are billed as Workers."
pillars: ["cloudflare-migration", "websites-and-applications"]
insights: ["cloudflare-in-front-or-rebuild-on-workers", "which-cloudflare-products-a-business-needs"]
related: ["static-assets", "workers-builds", "workers"]
updatedAt: 2026-10-06
---

## Pages or Workers?

For a plain static site the two are nearly equivalent. The differences appear as soon as you need a binding Pages does not offer, observability, gradual rollouts, or Durable Objects, Workflows and Queues alongside the site. Moving a Pages project to Workers is usually a one-day job: the build output becomes static assets and Pages Functions become routes in the Worker.
