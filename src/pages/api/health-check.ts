/**
 * GET /api/health-check?domain=example.com
 * Public, read-only outside view of a domain (see src/server/health-check.ts).
 * Rate limited per visitor; results are cached at the edge for ten minutes so
 * repeated checks of the same domain do not hit it again.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json, error, clientKey, allowed } from '@/server/http';
import { normaliseDomain, runHealthCheck } from '@/server/health-check';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const domain = normaliseDomain(url.searchParams.get('domain') ?? '');
  if (!domain) return error(400, 'bad-domain', 'Enter a domain such as example.com.');

  const cacheKey = new Request(`https://xolqy.com/api/health-check?domain=${encodeURIComponent(domain)}`);
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const hit = cache ? await cache.match(cacheKey) : undefined;
  if (hit) return hit;

  const limiter = (env as Env & { HEALTH_LIMITER?: RateLimit }).HEALTH_LIMITER;
  if (!(await allowed(limiter, `health:${await clientKey(request)}`))) {
    return error(429, 'rate-limited', 'Too many checks from this connection. Please wait a minute.');
  }

  const ownHost = new URL(env.SITE_URL || 'https://xolqy.com').hostname;
  const isSelf = domain === ownHost || domain === `www.${ownHost}`;
  const self = (env as Env & { SELF?: Fetcher }).SELF;
  const report = await runHealthCheck(domain, isSelf && self ? { self: (u, init) => self.fetch(u, init) } : {});
  console.log(JSON.stringify({ event: 'health-check', domain, score: report.score }));
  const res = json({ ok: true, ...report }, { cache: 'public, max-age=600' });
  if (cache) await cache.put(cacheKey, res.clone());
  return res;
};
