---
term: "Workers Builds"
category: Compute
summary: "Workers Builds is Cloudflare's Git-connected CI/CD for Workers: connect a GitHub or GitLab repository, set a build command, and every push builds and deploys, with preview URLs for branches and pull requests."
docs: "https://developers.cloudflare.com/workers/ci-cd/builds/"
useWhen: "Any project where more than one person deploys, or where you want a deploy history tied to commits and previews for review before production."
pricing: "A monthly allowance of build minutes on both plans, with additional minutes priced per minute on the paid plan."
pillars: ["websites-and-applications", "managed-cloudflare"]
insights: []
related: ["wrangler", "pages", "static-assets"]
updatedAt: 2026-10-06
---

## Where it fits

For a solo developer `wrangler deploy` from a laptop is fine. As soon as a client or a partner also commits, Builds is worth connecting: production deploys only from the main branch, previews for everything else, and the deploy log in the dashboard. It is one of the first things we set up on a managed engagement.
