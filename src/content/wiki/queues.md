---
term: "Queues"
category: Compute
summary: "Queues is Cloudflare's message queue: a Worker publishes messages, another Worker consumes them in batches, with retries, delays and a dead-letter queue for messages that keep failing. It decouples accepting work from doing it."
docs: "https://developers.cloudflare.com/queues/"
useWhen: "Smoothing bursts, sending work to a slower system, fan-out to several consumers, and anything where the user should get a fast response while processing happens afterwards."
avoidWhen: "Strict ordering across all messages, very large payloads (store them in R2 and send a key), and workflows with many dependent steps, which belong in Workflows."
pricing: "A daily free allowance of operations on the free plan and a per-million-operations price on the paid plan. Each message is written, read and acknowledged, so count roughly three operations per message."
limits: "Message size is capped at a modest number of kilobytes, batches at a hundred messages, and retention at a few days by default. Throughput per queue is high but finite; shard across queues for extreme volumes."
pillars: ["ai-and-automation", "websites-and-applications"]
insights: ["queues-versus-workflows"]
related: ["workflows", "workers", "durable-objects"]
updatedAt: 2026-10-06
---

## How it works

A producer binding exposes `send` and `sendBatch`. A consumer Worker receives batches, processes them, and acknowledges or retries individual messages. Consumers can also pull over HTTP from outside Cloudflare. Failed messages are retried with backoff and finally parked in a dead-letter queue you can inspect.

## Where it fits

On this site the enquiry form writes to D1 and publishes one message; the consumer starts a workflow per message. The form stays fast and nothing is lost if email delivery is slow.
