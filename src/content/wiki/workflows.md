---
term: "Workflows"
category: Compute
summary: "Workflows run multi-step work durably: each step is retried on failure, state survives restarts, and a workflow can sleep for minutes or months between steps. It turns fragile background scripts into reliable processes."
docs: "https://developers.cloudflare.com/workflows/"
useWhen: "Anything with several steps that must all eventually complete: processing an order, onboarding a customer, sending a sequence of emails, syncing with a slow third-party API, long-running AI pipelines."
avoidWhen: "Simple fire-and-forget tasks that a queue consumer handles in one step, and latency-sensitive request handling."
pricing: "Billed like Workers, by requests and CPU time, plus a small charge for stored state. Included allowances on both plans."
limits: "Caps on steps per instance, payload sizes and concurrent instances, all documented and generous for business processes. Steps must be idempotent because they can run more than once."
pillars: ["ai-and-automation", "websites-and-applications"]
insights: ["queues-versus-workflows"]
related: ["queues", "durable-objects", "workers", "cron-triggers"]
updatedAt: 2026-10-06
---

## How it works

A workflow is a class with a `run` method made of named steps. Each step's result is persisted, so if the Worker is evicted or a step throws, execution resumes from the last completed step with automatic retries and backoff. Instances have ids, which is how we make processing idempotent: the same enquiry can never be processed twice.

## Where it fits

Every enquiry on this site becomes a workflow instance: load the record, mark it, notify staff with retries, optionally acknowledge, record the outcome. The timeline you can inspect on the Labs page is that workflow's history.
