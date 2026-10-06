---
term: "Cron Triggers"
category: Compute
summary: "Cron Triggers run a Worker on a schedule using standard cron expressions, in UTC, as often as once a minute. They replace the cron jobs you would otherwise keep on a server."
docs: "https://developers.cloudflare.com/workers/configuration/cron-triggers/"
useWhen: "Nightly reports, cleanups, cache warming, polling an external system, rotating data, and kicking off workflows on a timetable."
pricing: "Scheduled invocations are billed as ordinary Worker requests. There is no separate charge for the schedule itself."
limits: "A handful of schedules per Worker, minute granularity, and the same CPU limits as any invocation. For long jobs the trigger should start a Workflow rather than do the work itself."
pillars: ["managed-cloudflare", "ai-and-automation"]
insights: []
related: ["workflows", "workers", "wrangler"]
updatedAt: 2026-10-06
---

## Good to know

Schedules live in `wrangler.jsonc` under `triggers.crons` and are applied on deploy. An empty list removes any schedule left behind by a previous Worker with the same name, which is a common surprise when a project replaces an older one.
