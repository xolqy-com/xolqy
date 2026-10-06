---
term: "Compatibility date and flags"
category: Concepts
summary: "The compatibility date in a Worker's configuration pins the runtime behaviour to a known point in time, so that Cloudflare can change defaults for new Workers without breaking old ones. Compatibility flags opt into or out of specific behaviours, such as Node.js API support."
docs: "https://developers.cloudflare.com/workers/configuration/compatibility-dates/"
useWhen: "Set it on every project and move it forward deliberately, reading the change notes, rather than leaving it where a template put it years ago."
pricing: "Not applicable."
pillars: ["managed-cloudflare", "websites-and-applications"]
insights: []
related: ["workers", "wrangler", "static-assets"]
updatedAt: 2026-10-06
---

## A real example

With a compatibility date on or after 1 April 2025, a browser navigation to a path that matches no static asset is answered by the 404 page without running the Worker. Dynamic routes must then be listed in `run_worker_first`. That one setting is the difference between an API that works and one that returns a 404 page, and it is the kind of thing a managed engagement tracks.
