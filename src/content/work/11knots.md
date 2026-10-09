---
title: 11 Knots
client: 11 Knots
url: https://11knots.com
sector: Sailing tours and private yacht charters
location: Greece
order: 5
eyebrow: Case study 05
headline: A sailing-day booking site with a video hero that still loads like a static page.
summary: "11 Knots runs sunset sails, half-day sails and private charters on one yacht, with a captain who has sailed these waters since 1972. A rebuilt Astro site on Cloudflare Pages: three tours instead of a long menu, a looping video hero, and the old site's addresses redirected so nothing earned in search was lost."
image: ../../assets/work/11knots.jpg
imageAlt: "Homepage of 11knots.com: the headline over aerial video of the yacht under way, with the tour button."
video: /media/work/11knots.mp4
brief: Rebuild an established sailing business's website around three clear tours and direct booking, move it to a new name without losing search traffic, and keep it fast on a phone at the harbour.
stack:
  - name: Cloudflare Pages
    role: Serves the prerendered site from the edge; every release is one command that uploads only the files that changed.
  - name: Redirect map
    role: "The old site's tour, journal and yacht addresses map to their new pages in the Pages redirect file and in Astro's build, so links and rankings carry over."
  - name: Cache rules in _headers
    role: Images, video and fonts are cached for a year as immutable files; pages for five minutes, so a release is visible almost at once.
  - name: Email address obfuscation
    role: Cloudflare hides the contact address from scrapers at the edge, with nothing to add to the code.
  - name: Astro with MDX
    role: "Tours, crew, FAQs, reviews and the journal are typed content collections; CSS is inlined, images ship as AVIF, WebP and JPEG at several widths."
tags:
  - Websites & Applications
  - Performance & Delivery
  - Static site
  - Video
outcomes:
  - "Visitors choose between three tours with duration, group size and starting price side by side, instead of reading a list of trips."
  - The hero shows the yacht under way in a short, muted loop that weighs about as much as a single large photograph, behind a still image that appears first.
  - The move from the previous site and domain kept its addresses working through a redirect map, so bookmarks, links and search listings land on the right new page.
  - Structured data for the business, the captain and the FAQ describes the company to search engines and AI assistants in their own terms.
  - Releases are a single command from the owner's machine, and only changed files are uploaded.
relatedServices:
  - websites-and-applications
  - performance-and-delivery
---

## The client

11 Knots is a family sailing business in Greece. Captain Alexander has sailed these waters since 1972, and the yacht 11 Knots runs three kinds of day: a three-hour sunset sail, a four-hour half-day sail with a swim stop, and a private charter of up to ten hours. Small-group trips take up to eight guests. Most bookings come from travellers deciding on a phone, often the day before.

## What was built

A rebuild of the previous site as a static Astro site, organised around one decision: which of the three days to book. The homepage puts the tours side by side with duration, group size and starting price, then the reasons to book direct (free cancellation, weather refunds, no booking fees), then reviews, the yacht and the crew. Each tour has its own page, and there are pages for the yacht, the captain, a gallery, an FAQ and a journal.

Content lives in typed collections, so a new tour, review or journal post is a file rather than a page to design. Images are produced at several widths in AVIF, WebP and JPEG, and the stylesheet is inlined so the first paint needs one request.

## A video hero without a slow page

The hero is aerial footage of the yacht under way: the most persuasive thing the business has, and the easiest way to make a page slow. Here it is a short muted loop of about 1.5 MB, served with a still image as its poster. The still paints first; the video takes over once it can play. Like the photographs and fonts, it is cached at the edge for a year as an immutable file, so repeat visits and visitors near the same Cloudflare location do not download it again from the origin.

## Moving without losing search

The business previously traded online under a different name and structure. Every retired address (old tour pages, journal posts, the yacht page) is mapped to its new equivalent in the Pages redirect file and in the Astro build, so links in guides, old bookmarks and search listings land on a working page instead of an error.

## What this demonstrates

A site that sells an experience needs pictures that move and pages that load on a weak connection at the harbour. Static pages on Cloudflare Pages, a careful cache policy and media that is sized for the job give both, with nothing to patch and nothing to keep running. It is the [Websites & Applications](/services/websites-and-applications/) service at its simplest, with the delivery work from [Performance & Delivery](/services/performance-and-delivery/).
