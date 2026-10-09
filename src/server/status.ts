/**
 * Live integration status for /stack/ and /api/status. Each check is cheap,
 * reveals no secrets, and distinguishes "wired" (binding present) from
 * "configured" (dashboard/account step completed) where that can be observed.
 */
import { emailConfig } from './email';
import { RESOURCES } from '@/data/resources';

export type LiveState = 'active' | 'awaiting' | 'planned' | 'fallback';

export interface StatusEntry {
  state: LiveState;
  detail: string;
}

export type StatusReport = Record<string, StatusEntry> & { checkedAt: StatusEntry };

type EnvWithSecrets = Env & { TURNSTILE_SECRET_KEY?: string; PUBLIC_CF_BEACON_TOKEN?: string };

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

export async function collectStatus(env: EnvWithSecrets, opts: { beaconConfigured: boolean }): Promise<Record<string, StatusEntry>> {
  const out: Record<string, StatusEntry> = {};
  const has = (k: keyof Env) => k in env && Boolean(env[k]);

  out.workers = { state: 'active', detail: 'This response was produced by the Worker.' };
  out.observability = { state: 'active', detail: 'Workers Logs and invocation logs enabled in wrangler.jsonc.' };

  // D1
  if (has('DB')) {
    try {
      const row = await withTimeout(env.DB.prepare(`SELECT COUNT(*) AS n FROM enquiries`).first<{ n: number }>(), 3000);
      out.d1 = { state: 'active', detail: `Database reachable, schema applied (${row?.n ?? 0} enquiries).` };
    } catch (err) {
      out.d1 = { state: 'awaiting', detail: /no such table/i.test(String(err)) ? 'Database bound but migrations not applied.' : 'Database bound but not reachable.' };
    }
  } else out.d1 = { state: 'awaiting', detail: 'DB binding absent.' };

  // KV
  if (has('CONFIG')) {
    try {
      await withTimeout(env.CONFIG.get('status:probe'), 3000);
      out.kv = { state: 'active', detail: 'CONFIG namespace reachable.' };
    } catch {
      out.kv = { state: 'awaiting', detail: 'CONFIG namespace bound but not reachable.' };
    }
  } else out.kv = { state: 'awaiting', detail: 'CONFIG binding absent.' };

  // R2
  if (has('RESOURCES')) {
    try {
      const key = RESOURCES[0]?.key ?? '';
      const head = key ? await withTimeout(env.RESOURCES.head(key), 3000) : null;
      out.r2 = head
        ? { state: 'active', detail: `Bucket reachable; "${key}" present (${head.size} bytes).` }
        : { state: 'awaiting', detail: 'Bucket reachable but resources not uploaded yet (npm run resources, then wrangler r2 object put).' };
    } catch {
      out.r2 = { state: 'awaiting', detail: 'Bucket bound but not reachable.' };
    }
  } else out.r2 = { state: 'awaiting', detail: 'RESOURCES binding absent.' };

  out.queue = has('ENQUIRY_QUEUE') ? { state: 'active', detail: 'Producer binding present; consumer configured in wrangler.jsonc.' } : { state: 'awaiting', detail: 'Queue binding absent.' };
  out.workflow = has('ENQUIRY_WORKFLOW') ? { state: 'active', detail: 'EnquiryWorkflow bound.' } : { state: 'awaiting', detail: 'Workflow binding absent.' };
  out.durableObjects = has('FINDER_SESSION') ? { state: 'active', detail: 'FinderSession namespace bound (SQLite-backed).' } : { state: 'awaiting', detail: 'Durable Object binding absent.' };
  out.rateLimit = has('ENQUIRY_LIMITER') && has('FINDER_LIMITER') ? { state: 'active', detail: 'Rate limiting bindings present.' } : { state: 'awaiting', detail: 'Rate limiting bindings absent.' };

  // Turnstile: secret present on the server. The sitekey is a build-time value.
  out.turnstile = env.TURNSTILE_SECRET_KEY
    ? env.TURNSTILE_SECRET_KEY.startsWith('1x0000') || env.TURNSTILE_SECRET_KEY.startsWith('2x0000') || env.TURNSTILE_SECRET_KEY.startsWith('3x0000')
      ? { state: 'fallback', detail: 'Using a Cloudflare TEST secret: every token passes. Replace with the real widget secret.' }
      : { state: 'active', detail: 'Secret configured; server-side Siteverify enforced.' }
    : { state: 'awaiting', detail: 'TURNSTILE_SECRET_KEY not set; form submissions are rejected.' };

  // Access
  out.access = env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD
    ? { state: 'active', detail: `Tokens verified against ${env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, '')}.` }
    : { state: 'awaiting', detail: 'ACCESS_TEAM_DOMAIN / ACCESS_AUD not set; /admin/ fails closed.' };

  // Workers AI
  if (has('AI')) {
    out.ai = { state: 'active', detail: `Binding present; chat model ${env.AI_CHAT_MODEL}, embeddings ${env.AI_EMBED_MODEL}.` };
  } else out.ai = { state: 'fallback', detail: 'AI binding absent; the finder uses the rule-based matcher.' };

  // Vectorize: populated?
  if (has('VECTORIZE')) {
    try {
      const info = (await withTimeout(env.VECTORIZE.describe(), 4000)) as unknown as { vectorCount?: number; vectorsCount?: number; dimensions?: number; config?: { dimensions?: number } };
      const count = info.vectorCount ?? info.vectorsCount ?? 0;
      const dims = info.dimensions ?? info.config?.dimensions ?? '?';
      out.vectorize = count > 0
        ? { state: 'active', detail: `Index populated (${count} vectors, ${dims} dimensions).` }
        : { state: 'awaiting', detail: 'Index exists but is empty. Run the reindex action in /admin/.' };
    } catch (err) {
      out.vectorize = { state: 'awaiting', detail: /not found|does not exist|404/i.test(String(err)) ? 'Index not created yet (wrangler vectorize create).' : 'Index not reachable from this environment (remote binding needed locally).' };
    }
  } else out.vectorize = { state: 'awaiting', detail: 'VECTORIZE binding absent.' };

  out.aiGateway = env.AI_GATEWAY_ID
    ? { state: 'active', detail: `Requests routed through gateway "${env.AI_GATEWAY_ID}".` }
    : { state: 'awaiting', detail: 'AI_GATEWAY_ID empty; Workers AI calls go direct.' };

  const email = emailConfig(env);
  out.email = email.ok
    ? { state: 'active', detail: `Binding present; sending from ${email.from} to a configured inbox.` }
    : { state: 'awaiting', detail: `Email Service not ready: ${email.reason}.` };

  out.webAnalytics = opts.beaconConfigured
    ? { state: 'active', detail: 'Beacon token set at build time.' }
    : { state: 'awaiting', detail: 'PUBLIC_CF_BEACON_TOKEN not set at build time.' };

  out.images = await checkImages(env);

  const stripe = env as EnvWithSecrets & { STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string };
  out.stripe = stripe.STRIPE_SECRET_KEY && stripe.STRIPE_WEBHOOK_SECRET
    ? { state: 'active', detail: `Checkout and webhook secrets set (${/_live_/.test(stripe.STRIPE_SECRET_KEY) ? 'live' : 'test'} mode).` }
    : { state: 'awaiting', detail: 'STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not set; shop items show "Request this package".' };

  return out;
}

/**
 * Images: ask the edge to transform one small public asset and read the
 * `cf-resized` header it adds. "internal=ok" means Transformations are enabled
 * for the zone and the /cdn-cgi/image/ URLs the pages emit will be served;
 * "err=<code>" means the zone setting is off or the fetch was refused.
 */
async function checkImages(env: EnvWithSecrets): Promise<StatusEntry> {
  const site = env.SITE_URL || 'https://xolqy.com';
  if (!/^https:\/\//.test(site) || /localhost|127\.0\.0\.1/.test(site)) {
    return { state: 'awaiting', detail: 'Transformations only run at the edge; nothing to verify locally.' };
  }
  try {
    const res = await withTimeout(
      fetch(new URL('/icon-192.png', site).toString(), {
        cf: { image: { width: 16, format: 'webp' }, cacheTtl: 300 },
      }),
      4000,
    );
    const resized = res.headers.get('cf-resized') ?? '';
    const type = res.headers.get('content-type') ?? '';
    if (res.ok && /internal=ok/.test(resized)) {
      return { state: 'active', detail: `Transformations enabled for the zone; the edge returned ${type || 'an image'} (${resized}).` };
    }
    if (/err=/.test(resized)) {
      return { state: 'awaiting', detail: `The edge refused the transformation (cf-resized: ${resized}). Enable Images > Transformations for the zone.` };
    }
    return { state: 'awaiting', detail: `The probe came back untransformed (HTTP ${res.status}, no cf-resized header). Check Images > Transformations for the zone.` };
  } catch (err) {
    return { state: 'awaiting', detail: `Probe failed: ${String(err).slice(0, 120)}.` };
  }
}
