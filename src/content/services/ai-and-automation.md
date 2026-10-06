---
title: AI & Automation
shortTitle: AI & Automation
order: 5
eyebrow: Service 05
headline: AI that answers from your content and workflows that run while you sleep.
summary: Knowledge assistants, semantic search, agents and business workflows built on Workers AI, Vectorize, AI Gateway, Queues and Workflows, with limits, logging and fallbacks designed in.
outcome: An assistant or automation your customers and staff can rely on, grounded in your own approved content, observable, and bounded in what it can do and cost.
problems:
  - Support answers the same twenty questions a hundred times a week and the knowledge is in PDFs nobody searches.
  - Site search matches words, not meaning, so customers leave before they find the product.
  - Enquiries, orders or documents need classification and routing that currently happens by hand in an inbox.
  - An AI pilot produced confident wrong answers and the team lost trust in the idea.
deliverables:
  - Knowledge assistant grounded in approved content, with retrieval (Vectorize), citations and a non-AI fallback
  - Semantic search across products, articles or documents using embeddings
  - "Document and enquiry processing: classification, extraction and routing with Workflows and Queues"
  - Agents for bounded tasks (lookups, drafts, scheduling) with explicit tool permissions and human approval steps
  - "AI Gateway configuration: logging, caching, rate limits, provider fallback, cost tracking"
  - Evaluation set and regression tests for answer quality before and after changes
  - "Content pipeline: ingestion, chunking, re-indexing on publish"
  - "Privacy and safety controls: input limits, secret and personal-data filtering, retention policy, abuse protection"
  - Durable Objects session coordination for conversational interfaces
stack:
  - name: Workers AI
    role: Embeddings and text generation with open models billed per use.
  - name: Vectorize
    role: Vector index for retrieval over your content with metadata filters.
  - name: AI Gateway
    role: Observability, caching, limits and provider routing for every AI call, including third-party models.
  - name: Durable Objects
    role: Bounded conversation sessions and per-user coordination.
  - name: Workflows + Queues
    role: Long-running, retried processing pipelines for documents and events.
  - name: D1 and R2
    role: Structured results and source documents.
  - name: Agents SDK
    role: Stateful agents with tools, scheduling and WebSockets when a task calls for one.
process:
  - stage: Audit
    output: Use-case selection by value and risk, content inventory and quality assessment, data sensitivity review, and a feasibility check with a small retrieval prototype on your real content.
  - stage: Architect
    output: Retrieval and prompt design, model selection with cost per interaction, limits and fallbacks, evaluation criteria, and the integration plan with your site or tools.
  - stage: Build & Migrate
    output: The assistant or pipeline on staging with an evaluation set you helped write, iterated until it meets the criteria, then launched behind limits and AI Gateway observability.
  - stage: Optimize & Support
    output: Monthly review of logged conversations (anonymised), re-indexing as content changes, prompt and retrieval tuning, cost reporting.
faqs:
  - q: How do you stop it making things up?
    a: Retrieval first, generation second. The model only sees passages retrieved from your approved content, is instructed to answer from them, and the response links to the sources. Questions outside the content get an honest "I don't have that" rather than a guess. We test this with an evaluation set before launch. The finder on this site works exactly this way.
  - q: Which models do you use?
    a: Open models on Workers AI for most tasks (embeddings, classification, grounded answers), because they are close to the data and priced per use. Where a task needs a frontier model, AI Gateway routes to that provider with the same logging and limits. The choice is made per task, with cost per interaction in the proposal.
  - q: Where does our data go?
    a: Content you approve is embedded and stored in Vectorize in your Cloudflare account. Conversations are kept only as long as your retention policy says, in your account, and never used to train anything. We document the data flow and set limits on what users can submit.
  - q: What can an agent actually do safely?
    a: Whatever tools you give it, and nothing else. We design tools with the narrowest permissions that do the job, log every call, and put a human approval step in front of anything that changes money, data or customer communication.
  - q: What does it cost to run?
    a: Workers AI and Vectorize are billed per use by Cloudflare, so cost scales with conversations and documents. The architecture stage includes a cost per interaction and a monthly estimate at your expected volume, and AI Gateway reports the actual figures after launch.
nextStep:
  label: Discuss an AI project
  href: /contact/?interest=ai-and-automation
interest: ai-and-automation
keywords:
  - ai
  - assistant
  - chatbot
  - rag
  - search
  - semantic search
  - embeddings
  - agent
  - automation
  - workflow
  - classify
  - documents
  - llm
  - workers ai
  - vectorize
  - knowledge base
  - support
relatedLabs:
  - solution-finder
  - enquiry-pipeline
---

## Useful, bounded, observable

Three properties decide whether an AI feature survives contact with customers. Useful: it answers from content you stand behind, with sources. Bounded: it has limits on input size, turns, cost and what it can do, and a fallback when the model is unavailable. Observable: every call is logged through AI Gateway so you can see what was asked, what was answered and what it cost.

We design those three in from the first prototype. The solution finder on this site is a small example: Vectorize retrieval over our service pages, a Workers AI model that answers only from the retrieved passages, a Durable Object that bounds each session, and a rule-based fallback that tells you it is not AI when the bindings are absent.

## Automation is usually the better first project

A document pipeline (classify, extract, route, notify) built on Queues and Workflows often pays back faster than a chat interface, because it removes a known manual task. It is also lower risk: outputs can be reviewed before they act. We frequently start there and add the conversational layer once the retrieval and content are proven.

## Evaluation before launch

Every assistant ships with an evaluation set: real questions, expected answers, the passages that should be retrieved. Changes to prompts, models or content run against it. It is the difference between "it seemed fine in the demo" and knowing.
