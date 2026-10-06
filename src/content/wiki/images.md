---
term: "Cloudflare Images and image transformations"
category: Delivery
summary: "Cloudflare Images stores, optimises and delivers images, and image transformations resize, crop and convert images on the fly through a URL or from a Worker, serving modern formats such as AVIF and WebP automatically."
docs: "https://developers.cloudflare.com/images/"
useWhen: "Sites with many user-uploaded or catalogue images, and any site that wants responsive, correctly sized images without a build step or an image CDN from another vendor."
pricing: "Priced per images stored and per images delivered, and transformations per unique transformation beyond a free monthly allowance. Images already in R2 can be transformed without being stored twice."
pillars: ["performance-and-delivery", "websites-and-applications"]
insights: []
related: ["r2", "cache", "workers"]
updatedAt: 2026-10-06
---

## Where it fits

Originals in R2, transformations at request time, long cache lifetimes: that is the pattern for galleries, shops and photo products. The photoproof.io case study delivers photographers' images this way without a server in the middle.
