/**
 * POST /api/finder  { sessionId?: string, message: string }
 * Routes the message to the visitor's FinderSession Durable Object, which
 * enforces turn/pacing limits and runs retrieval + generation (or the rule
 * based fallback). Responses are never cached.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json, error, clientKey, allowed, sameOrigin } from '@/server/http';
import { FINDER_LIMITS } from '@/server/finder';
import type { FinderSession } from '@/server/finder-session';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request, env.SITE_URL)) return error(403, 'bad-origin', 'Cross-site requests are not accepted.');

  let body: { sessionId?: unknown; message?: unknown };
  try {
    const text = await request.text();
    if (text.length > 4096) return error(413, 'too-large', 'Request too large.');
    body = JSON.parse(text) as typeof body;
  } catch {
    return error(400, 'bad-request', 'Send JSON with a "message" field.');
  }
  const message = typeof body.message === 'string' ? body.message : '';
  if (!message.trim()) return error(400, 'empty', 'Describe the project in a sentence or two.');
  if (message.length > FINDER_LIMITS.maxInputChars) return error(400, 'input-too-long', `Please keep it under ${FINDER_LIMITS.maxInputChars} characters.`);

  if (!(await allowed(env.FINDER_LIMITER, `finder:${await clientKey(request)}`))) {
    return error(429, 'rate-limited', 'Too many requests. Please wait a minute.');
  }

  const sessionId = typeof body.sessionId === 'string' && /^[0-9a-f-]{36}$/.test(body.sessionId) ? body.sessionId : crypto.randomUUID();
  const stub = env.FINDER_SESSION.get(env.FINDER_SESSION.idFromName(sessionId)) as unknown as DurableObjectStub<FinderSession>;

  try {
    const result = await stub.ask({ message });
    if (!result.ok) return json({ ok: false, error: result.error, message: result.message, sessionId, turnsLeft: result.turnsLeft }, { status: result.error === 'too-fast' ? 429 : 400 });
    return json({ ok: true, sessionId, turnsLeft: result.turnsLeft, ...result.reply });
  } catch (err) {
    console.error('finder: session call failed', { error: String(err).slice(0, 200) });
    return error(503, 'unavailable', 'The finder is unavailable right now. Please use the enquiry form.');
  }
};

export const GET: APIRoute = () => error(405, 'method-not-allowed', 'Use POST.');
