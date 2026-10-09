/**
 * POST /api/stripe-webhook
 * Receives Stripe events. Only checkout.session.completed is acted on: the
 * signature is verified, the order is written to D1 once per session, and
 * staff are emailed. Every other event is acknowledged and ignored.
 *
 * Stripe dashboard: Developers > Webhooks > Add endpoint
 *   URL     https://xolqy.com/api/stripe-webhook
 *   Events  checkout.session.completed
 * then `wrangler secret put STRIPE_WEBHOOK_SECRET` with the endpoint's whsec_ value.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json, error } from '@/server/http';
import { verifyWebhook, type CompletedSession, type StripeEnv } from '@/server/stripe';
import { recordOrder, markOrderNotified, formatAmount } from '@/server/orders';
import { sendOrderNotification } from '@/server/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const runtime = env as StripeEnv;
  const payload = await request.text();
  if (payload.length > 512 * 1024) return error(413, 'too-large', 'Payload too large.');
  if (!(await verifyWebhook(payload, request.headers.get('stripe-signature'), runtime.STRIPE_WEBHOOK_SECRET))) {
    console.warn(JSON.stringify({ event: 'stripe-webhook-rejected' }));
    return error(400, 'bad-signature', 'Signature verification failed.');
  }

  let event: { type?: string; data?: { object?: unknown } };
  try {
    event = JSON.parse(payload);
  } catch {
    return error(400, 'bad-json', 'Invalid JSON.');
  }
  if (event.type !== 'checkout.session.completed') return json({ received: true, ignored: event.type });

  const session = event.data?.object as CompletedSession;
  if (!session?.id) return error(400, 'bad-event', 'No session in the event.');

  // Stored once; a redelivered event finds the row already there and stops.
  const order = await recordOrder(runtime.DB, session);
  if (!order) return json({ received: true, duplicate: true });

  const site = runtime.SITE_URL || 'https://xolqy.com';
  try {
    await sendOrderNotification(runtime, { ...order, amount: formatAmount(order.amount_total, order.currency) }, site);
    await markOrderNotified(runtime.DB, order.id);
  } catch (err) {
    // The order is safe in D1 and visible in /admin/; a failed email must not
    // make Stripe retry (which would be ignored as a duplicate anyway).
    console.error(JSON.stringify({ event: 'order-notify-failed', order: order.id, error: String(err).slice(0, 200) }));
  }
  console.log(JSON.stringify({ event: 'order-recorded', order: order.id, item: order.item_id }));
  return json({ received: true });
};
