---
title: "Queues or Workflows: where background work belongs on Cloudflare"
description: A queue accepts work and a workflow finishes a process. They solve different failures. This is how to choose, using the enquiry pipeline on this site as the concrete case.
publishedAt: 2026-10-07T12:00:00.000Z
audience: technical
topics: ["Cloudflare OS", Queues, Workflows]
readingMinutes: 6
relatedServices: [websites-and-applications, ai-and-automation]
---

The request that sends the email, calls the model, and writes three systems before it responds is the request that times out on the afternoon you can least afford it. Workers have a CPU-time limit per request. That limit is generous for rendering a page and hostile to anything that must eventually finish even if a dependency is down.

Two products exist for the work that should outlive the click. [Queues](/wiki/queues/) accept it. [Workflows](/wiki/workflows/) complete it. [Cloudflare OS Implementation by Xolqy](/cloudflare-os/) uses both, for different reasons, and so does the enquiry form on this website.

## What a queue is for

A producer Worker calls `send` or `sendBatch`. A consumer Worker receives a batch, handles each message, and acknowledges or retries it. Failures back off. Messages that keep failing land in a dead-letter queue you can inspect. Consumers can also pull over HTTP from outside Cloudflare.

Use a queue to smooth a burst, to answer the user before a slow system has finished, and to fan work out. Do not use it when you need strict ordering of every message, when the payload is large (store the bytes in [R2](/wiki/r2/) and send the key), or when the job is a chain of dependent steps. Message size is capped, batches are capped, retention is a few days by default. Count operations honestly: a message is written, read and acknowledged, roughly three operations each.

A queue consumer is a good place for one step. “Take this message and start the real process” is one step. “Classify, extract, wait for a human, then notify, and do not lose your place if the notify fails” is not.

## What a workflow is for

A workflow is a class with a `run` method made of named steps. Each step’s result is persisted. If the Worker is evicted or a step throws, execution resumes from the last completed step, with retries and backoff. A workflow can sleep for minutes or months between steps. Instances have ids.

Use it for anything that must eventually complete: an order, an onboarding, a sequence of emails, a slow third-party API, a document pipeline. Do not use it for a single fire-and-forget task a consumer can finish in one step, and do not use it for work the user is waiting on inside the request.

Steps have to be idempotent, because a step can run more than once. Caps on steps, payload size and concurrent instances exist and are generous for business processes; the design constraint that matters more is the idempotency.

A [Cron Trigger](/wiki/cron-triggers/) is the third piece, and it is easy to misuse. A schedule is a fine way to start work. It is a poor place to do the long job itself. The trigger should start a workflow. Scheduled invocations are billed as ordinary Worker requests. The schedule is not a separate product charge.

## How this site splits them

The enquiry form is the small version of the pattern.

The request validates the body, checks the Turnstile token, writes the record to [D1](/wiki/d1/), and publishes one message. The visitor gets a success only after D1 has the row. Email has not happened yet, on purpose.

The queue consumer starts one workflow per enquiry. The instance id is deterministic, so a duplicate message does not process the enquiry twice. Messages that fail five times go to the dead-letter queue.

The workflow loads the record, marks it processing, emails staff through Email Service with exponential retries, optionally acknowledges the sender, and records the outcome. If email is down, the failure stays visible. It does not sit inside the HTTP request, and it does not vanish.

You can watch that sequence on the [pipeline tracer](/labs/#enquiry-pipeline) with a reference. No personal data is shown. The staff view of the same rows is behind [Access](/wiki/zero-trust-access/).

[Durable Objects](/wiki/durable-objects/) are the other coordination tool, and they are not a queue. The solution finder’s session is a Durable Object: one conversation, strongly consistent, with an alarm that expires it. That is state many requests must agree on. A queue would be the wrong shape, because there is nothing to deliver later. There is a conversation to keep.

## A decision you can apply

1. If the user is waiting and the work is a page or a small API call, do it in the request.
2. If the user is waiting only for acceptance, and the rest is one unit of work, write the record, enqueue, and consume.
3. If the rest is several steps, any of which can fail or wait, the consumer’s only job is to start a workflow with a stable id.
4. If something must run at a time rather than in response to an event, a cron trigger starts that workflow.
5. If the thing you are protecting is consistent state for one key, that is a Durable Object, not a message.

The [AI and automation](/services/ai-and-automation/) service uses the same split. A document that must be classified, extracted, routed and sometimes approved is a workflow. The event that says “a document arrived” is a message. A chat turn the user is staring at is a request, bounded by a Durable Object, with retrieval from Vectorize. Putting the model call, the inbox write and the human approval in one request is how demos ship and how production pages time out.

[Websites and applications](/services/websites-and-applications/) get the same question in the architecture stage, per endpoint. The output is a sentence in the document: this route responds, this queue accepts, this workflow finishes. [Cloudflare OS Implementation by Xolqy](/cloudflare-os/) is that sentence applied to the whole business, not only to the contact form.
