/** Small HTTP helpers shared by API routes. */

export const NO_STORE = 'private, no-store, no-cache, must-revalidate';

/** Security headers for dynamic responses (static assets get them from public/_headers). */
export const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
};

export function json(data: unknown, init: ResponseInit & { cache?: string } = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', init.cache ?? NO_STORE);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!headers.has(k)) headers.set(k, v);
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function error(status: number, code: string, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ ok: false, error: code, message, ...extra }, { status });
}

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
}

/** Hashed, truncated client key for rate limiting and logs: never the raw IP. */
export async function clientKey(request: Request): Promise<string> {
  const ip = clientIp(request);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`xolqy:${ip}`));
  return Array.from(new Uint8Array(buf).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Apply a rate-limit binding if present. Returns true when the request may proceed. */
export async function allowed(limiter: RateLimit | undefined, key: string): Promise<boolean> {
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit({ key });
    return success;
  } catch {
    // A failing limiter must not take the feature down.
    return true;
  }
}

export function wantsHtml(request: Request): boolean {
  const accept = request.headers.get('accept') ?? '';
  const type = request.headers.get('content-type') ?? '';
  return type.includes('application/x-www-form-urlencoded') || (accept.includes('text/html') && !accept.includes('application/json'));
}

/** Same-origin check for state-changing requests from browsers. */
export function sameOrigin(request: Request, siteUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser clients; the token/Turnstile checks still apply
  try {
    const o = new URL(origin);
    const site = new URL(siteUrl);
    const reqHost = new URL(request.url).host;
    return o.host === site.host || o.host === reqHost || o.hostname === 'localhost' || o.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/** Minimal HTML page for non-JavaScript form submissions. */
export function htmlPage(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} | Xolqy</title><style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f5f0;margin:0;padding:3rem 1rem;line-height:1.6}main{max-width:40rem;margin:auto}a{color:#ff5a1f}h1{font-size:1.75rem}</style></head><body><main><h1>${escapeHtml(title)}</h1>${body}<p><a href="/contact/">Back to the enquiry form</a></p></main></body></html>`;
  const headers = new Headers({ 'content-type': 'text/html; charset=utf-8', 'cache-control': NO_STORE, ...SECURITY_HEADERS });
  return new Response(html, { status, headers });
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
