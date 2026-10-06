#!/usr/bin/env bash
# One-time provisioning of the Cloudflare resources xolqy.com needs.
# Requires: `npx wrangler login` (or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID).
# Safe to re-run: every command tolerates "already exists".
set -euo pipefail
cd "$(dirname "$0")/.."

run() { echo; echo "▶ $*"; "$@" || true; }

echo "== D1 (authoritative enquiry store)"
run npx wrangler d1 create xolqy-site
echo "   -> paste the database_id into wrangler.jsonc > d1_databases[0].database_id"

echo "== KV (public configuration)"
run npx wrangler kv namespace create CONFIG
echo "   -> paste the id into wrangler.jsonc > kv_namespaces[0].id"

echo "== R2 (downloadable resources)"
run npx wrangler r2 bucket create xolqy-resources

echo "== Queues (enquiry processing + dead letter)"
run npx wrangler queues create xolqy-enquiries
run npx wrangler queues create xolqy-enquiries-dlq

echo "== Vectorize (finder knowledge, bge-base-en-v1.5 = 768 dims, cosine)"
run npx wrangler vectorize create xolqy-knowledge --dimensions=768 --metric=cosine

echo
echo "Next:"
echo "  1. Fill in the ids printed above in wrangler.jsonc (or leave them out to let wrangler auto-provision on deploy)."
echo "  2. npx wrangler secret put TURNSTILE_SECRET_KEY"
echo "  3. npm run deploy && npm run db:migrate:remote"
echo "  4. Upload resources: npm run resources && npx wrangler r2 object put xolqy-resources/cloudflare-migration-checklist.md --file resources/cloudflare-migration-checklist.md --content-type 'text/markdown; charset=utf-8' --remote"
echo "  5. Dashboard steps in README.md > Dashboard configuration (Turnstile, Access, AI Gateway, Email Service, Web Analytics, custom domain)."
