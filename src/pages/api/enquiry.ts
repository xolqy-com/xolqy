/**
 * POST /api/enquiry
 * Accepts a project enquiry: validate -> Turnstile Siteverify -> rate limit ->
 * store in D1 -> queue for processing -> respond. Success is reported only
 * after the D1 write has committed; notification happens asynchronously and
 * its failures stay visible to staff in /admin/.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { EnquirySchema, fieldErrors, looksLikeSecret } from '@/server/enquiry-schema';
import { verifyTurnstile } from '@/server/turnstile';
import { insertEnquiry, setStatus } from '@/server/db';
import { json, error, clientIp, clientKey, allowed, wantsHtml, htmlPage, sameOrigin, escapeHtml } from '@/server/http';
import type { EnquiryMessage } from '@/server/queue-consumer';

export const prerender = false;

type RuntimeEnv = Env & { TURNSTILE_SECRET_KEY?: string };

const MAX_BODY_BYTES = 16 * 1024;

export const POST: APIRoute = async ({ request }) => {
  const runtime = env as RuntimeEnv;
  const html = wantsHtml(request);
  const fail = (status: number, code: string, message: string, errors?: Record<string, string>) =>
    html
      ? htmlPage('The enquiry could not be sent', `<p>${escapeHtml(message)}</p>${errors ? `<ul>${Object.values(errors).map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>` : ''}`, status)
      : error(status, code, message, errors ? { errors } : {});

  if (!sameOrigin(request, runtime.SITE_URL)) return fail(403, 'bad-origin', 'Cross-site submissions are not accepted.');

  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) return fail(413, 'too-large', 'The submission is too large.');

  // Parse JSON or form-encoded bodies.
  let raw: Record<string, unknown> = {};
  try {
    const type = request.headers.get('content-type') ?? '';
    if (type.includes('application/json')) {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return fail(413, 'too-large', 'The submission is too large.');
      raw = JSON.parse(text) as Record<string, unknown>;
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => {
        if (typeof v === 'string') raw[k] = v;
      });
    }
  } catch {
    return fail(400, 'bad-request', 'The submission could not be read.');
  }

  // 1. Validate
  const parsed = EnquirySchema.safeParse(raw);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.company) return fail(400, 'rejected', 'The submission was rejected.');
    return fail(400, 'validation', 'Please correct the highlighted fields.', errors);
  }
  const input = parsed.data;
  if (looksLikeSecret(input.brief)) {
    return fail(400, 'validation', 'The brief appears to contain a password or key. Please remove it; we never need credentials at this stage.', {
      brief: 'Please remove passwords, API keys or secrets from the brief.',
    });
  }

  // 2. Rate limit (per client, per location)
  const key = await clientKey(request);
  if (!(await allowed(runtime.ENQUIRY_LIMITER, key))) {
    return fail(429, 'rate-limited', 'Too many submissions from this connection. Please wait a minute and try again.');
  }

  // 3. Turnstile, mandatory
  const turnstile = await verifyTurnstile({
    secret: runtime.TURNSTILE_SECRET_KEY,
    token: input['cf-turnstile-response'],
    remoteIp: clientIp(request),
    expectedAction: 'enquiry',
    expectedHostnames: (runtime.TURNSTILE_HOSTNAMES || '').split(','),
    strictHostname: !import.meta.env.DEV,
  });
  if (!turnstile.ok) {
    const messages: Record<string, [number, string]> = {
      'not-configured': [503, 'Form protection is not configured on the server yet (TURNSTILE_SECRET_KEY). Please try again later.'],
      'missing-token': [400, 'Verification is required. Please complete the check and send again (JavaScript is needed for this step).'],
      rejected: [400, 'Verification failed or expired. Please try again.'],
      'hostname-mismatch': [400, 'Verification was issued for a different site.'],
      'action-mismatch': [400, 'Verification was issued for a different action.'],
      network: [502, 'Verification service unreachable. Please try again shortly.'],
      ok: [200, ''],
    };
    const [status, message] = messages[turnstile.code] ?? [400, 'Verification failed.'];
    return fail(status, `turnstile-${turnstile.code}`, message);
  }

  // 4. Store (authoritative) in D1
  const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;
  let stored: { id: string; reference: string };
  try {
    stored = await insertEnquiry(runtime.DB, {
      name: input.name,
      email: input.email,
      website: input.website,
      service: input.service,
      budget: input.budget,
      brief: input.brief,
      country: typeof cf?.country === 'string' ? cf.country : null,
      colo: typeof cf?.colo === 'string' ? cf.colo : null,
      turnstileHostname: turnstile.hostname ?? null,
      turnstileChallengeTs: turnstile.challengeTs ?? null,
    });
  } catch (err) {
    console.error('enquiry: D1 insert failed', { error: String(err).slice(0, 200) });
    return fail(500, 'storage', 'The enquiry could not be stored. Nothing was sent; please try again.');
  }

  // 5. Queue for asynchronous processing. A queue failure is not fatal for the
  //    visitor: the record exists and staff can see it unprocessed.
  try {
    const message: EnquiryMessage = { type: 'enquiry.received', enquiryId: stored.id, reference: stored.reference, producedAt: Date.now() };
    await runtime.ENQUIRY_QUEUE.send(message, { contentType: 'json' });
    await setStatus(runtime.DB, stored.id, 'queued', {}, { stage: 'queued', detail: 'Message sent to xolqy-enquiries' });
  } catch (err) {
    console.error('enquiry: queue send failed', { reference: stored.reference, error: String(err).slice(0, 200) });
    await setStatus(runtime.DB, stored.id, 'received', { lastError: `QUEUE_SEND_FAILED: ${String(err).slice(0, 200)}` }, { stage: 'failed', detail: 'Queue send failed; awaiting manual processing' }).catch(() => {});
  }

  const trackUrl = `/labs/?ref=${encodeURIComponent(stored.reference)}#enquiry-pipeline`;
  if (html) {
    return htmlPage(
      'Received. Thank you.',
      `<p>Your reference is <strong>${escapeHtml(stored.reference)}</strong>. The enquiry is stored and queued for processing. We reply by email.</p><p><a href="${escapeHtml(trackUrl)}">Follow its progress on the Labs page</a>.</p>`,
      200,
    );
  }
  return json({ ok: true, reference: stored.reference, trackUrl }, { status: 201 });
};

export const GET: APIRoute = () => error(405, 'method-not-allowed', 'Use POST.');
