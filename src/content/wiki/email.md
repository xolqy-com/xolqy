---
term: "Email Routing and Email Service"
category: Delivery
summary: "Cloudflare handles email in two directions. Email Routing receives mail for your domain and forwards it to any inbox or to a Worker, for free. Email Service lets a Worker send mail from a verified domain through a binding, so transactional email needs no third-party API."
docs: "https://developers.cloudflare.com/email-routing/"
useWhen: "Receiving mail on a domain without running a mail server, routing inbound mail into an application, and sending notifications, receipts and acknowledgements from Workers."
avoidWhen: "Bulk marketing email, which belongs with a provider built for it, and sending from a domain you have not fully authenticated with SPF, DKIM and DMARC."
pricing: "Email Routing is free. Email Service sending is in beta; sending to verified destinations is free and sending to arbitrary recipients requires the Workers Paid plan."
pillars: ["websites-and-applications", "ai-and-automation"]
insights: []
related: ["dns", "workflows", "queues", "workers"]
updatedAt: 2026-10-06
---

## Where it fits

Enquiries on this site are delivered to staff through Email Service from a dedicated sending subdomain, so the main domain's existing mail provider is untouched. DMARC on the main domain keeps those notifications out of spam folders.
