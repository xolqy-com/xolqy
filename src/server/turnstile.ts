/**
 * Server-side Turnstile verification (Siteverify). Mandatory for every form
 * submission: the browser token alone proves nothing. Checks success, the
 * expected action, and that the challenge was solved on one of our hostnames.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  ok: boolean;
  code: 'ok' | 'not-configured' | 'missing-token' | 'rejected' | 'hostname-mismatch' | 'action-mismatch' | 'network';
  hostname?: string;
  challengeTs?: string;
  errorCodes?: string[];
  /** true when the documented Cloudflare TEST secret + dummy token were used (local fixture). */
  fixture?: boolean;
}

/** Cloudflare's documented dummy secrets: 1x = always passes, 2x = always fails, 3x = token already spent. */
const DUMMY_SECRET = /^([123])x0{31}AA$/;
const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export async function verifyTurnstile(opts: {
  secret: string | undefined;
  token: string | undefined;
  remoteIp?: string;
  expectedAction: string;
  expectedHostnames: string[];
  /** When false (local development with test keys) the hostname check is skipped. */
  strictHostname: boolean;
}): Promise<TurnstileResult> {
  if (!opts.secret) return { ok: false, code: 'not-configured' };
  if (!opts.token || opts.token.length > 2048) return { ok: false, code: 'missing-token' };

  // Local development fixture: with Cloudflare's documented TEST secret and the
  // dummy token the widget issues for TEST sitekeys, reproduce Siteverify's
  // documented behaviour without a network call. Never configure a TEST secret
  // in production; /api/status reports it as "fallback" if you do.
  const dummy = DUMMY_SECRET.exec(opts.secret);
  if (dummy && opts.token === DUMMY_TOKEN) {
    if (dummy[1] === '1') return { ok: true, code: 'ok', hostname: 'localhost', challengeTs: new Date().toISOString(), fixture: true };
    if (dummy[1] === '2') return { ok: false, code: 'rejected', errorCodes: ['invalid-input-response'], fixture: true };
    return { ok: false, code: 'rejected', errorCodes: ['timeout-or-duplicate'], fixture: true };
  }

  const body = new URLSearchParams({
    secret: opts.secret,
    response: opts.token,
    idempotency_key: crypto.randomUUID(),
  });
  if (opts.remoteIp) body.set('remoteip', opts.remoteIp);

  let data: SiteverifyResponse;
  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    data = (await res.json()) as SiteverifyResponse;
  } catch {
    return { ok: false, code: 'network' };
  }

  if (!data.success) return { ok: false, code: 'rejected', errorCodes: data['error-codes'] ?? [] };

  const hostname = (data.hostname ?? '').toLowerCase();
  if (opts.strictHostname) {
    const allowed = new Set(opts.expectedHostnames.map((h) => h.trim().toLowerCase()).filter(Boolean));
    if (!hostname || !allowed.has(hostname)) return { ok: false, code: 'hostname-mismatch', hostname };
  }

  if (data.action && data.action !== opts.expectedAction) return { ok: false, code: 'action-mismatch' };

  return { ok: true, code: 'ok', hostname, challengeTs: data.challenge_ts };
}
