/**
 * POST /api/checkout  (form field or JSON: itemId)
 * Creates a Stripe Checkout Session for a purchasable shop item and sends the
 * browser to it with a 303 redirect (plain HTML form, no JavaScript needed).
 * JSON requests get { url } instead.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json, error, clientKey, allowed, sameOrigin, wantsHtml, htmlPage, escapeHtml } from '@/server/http';
import { shopItem, isPurchasable } from '@/data/shop';
import { createCheckoutSession, checkoutEnabled, type StripeEnv } from '@/server/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const runtime = env as StripeEnv;
  const site = runtime.SITE_URL || 'https://xolqy.com';
  if (!sameOrigin(request, site)) return error(403, 'bad-origin', 'Cross-site requests are not accepted.');

  let itemId = '';
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) itemId = String(((await request.json()) as { itemId?: unknown }).itemId ?? '');
    else itemId = String((await request.formData()).get('itemId') ?? '');
  } catch {
    return error(400, 'bad-request', 'The request could not be read.');
  }

  const item = shopItem(itemId.slice(0, 80));
  const html = wantsHtml(request) || !type.includes('application/json');
  const back = (title: string, message: string, status: number) =>
    html
      ? htmlPage(title, `<p>${escapeHtml(message)}</p><p><a href="/shop/">Back to the shop</a></p>`, status)
      : error(status, title.toLowerCase().replace(/\s+/g, '-'), message);

  if (!item || !isPurchasable(item)) return back('Not available', 'This item cannot be bought online yet. Use "Request this package" instead.', 404);
  if (!checkoutEnabled(runtime)) return back('Checkout unavailable', 'Online checkout is not configured yet. Please request the package and we will send an invoice.', 503);

  if (!(await allowed(runtime.ENQUIRY_LIMITER, `checkout:${await clientKey(request)}`))) {
    return back('Too many requests', 'Please wait a minute and try again.', 429);
  }

  try {
    const session = await createCheckoutSession(runtime, item, site);
    console.log(JSON.stringify({ event: 'checkout-created', item: item.id, session: session.id }));
    if (!html) return json({ ok: true, url: session.url });
    return new Response(null, { status: 303, headers: { location: session.url, 'cache-control': 'no-store' } });
  } catch (err) {
    console.error(JSON.stringify({ event: 'checkout-failed', item: item.id, error: String(err).slice(0, 200) }));
    return back('Checkout failed', 'Stripe could not start the checkout. Please try again, or request the package instead.', 502);
  }
};
