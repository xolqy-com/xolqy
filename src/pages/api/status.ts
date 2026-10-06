/**
 * GET /api/status
 * Live integration states for the stack page. No secrets, no identifiers.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { PUBLIC_CF_BEACON_TOKEN } from 'astro:env/client';
import { collectStatus } from '@/server/status';
import { json } from '@/server/http';

export const prerender = false;

export const GET: APIRoute = async () => {
  const status = await collectStatus(env as Env & { TURNSTILE_SECRET_KEY?: string }, { beaconConfigured: Boolean(PUBLIC_CF_BEACON_TOKEN) });
  return json({ ok: true, checkedAt: new Date().toISOString(), environment: import.meta.env.DEV ? 'local' : 'production', status }, { cache: 'public, max-age=60' });
};
