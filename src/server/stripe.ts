/**
 * Stripe Checkout over the REST API (no SDK, nothing to bundle).
 *
 * Secrets, set with `wrangler secret put`:
 *   STRIPE_SECRET_KEY      sk_live_... or sk_test_... (never in the repository)
 *   STRIPE_WEBHOOK_SECRET  whsec_... from the webhook endpoint in the Stripe dashboard
 *
 * Prices live in src/data/shop.ts and are sent as inline price_data, so there
 * is nothing to keep in sync in the Stripe dashboard. The website package is
 * the exception: its unit_amount comes from websiteChargeCents() at request time.
 */
import type { ShopItem } from '@/data/shop';
import { WEBSITE_ITEM_ID, WEBSITE_REGULAR_DISPLAY, WEBSITE_SALE_DISPLAY, websiteChargeCents, websiteSaleActive } from '@/data/website-sale';

export type StripeEnv = Env & { STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string };

export function checkoutEnabled(env: StripeEnv): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

/** Flatten nested params into Stripe's form encoding: a[b][0][c]=v. */
function encode(params: Record<string, unknown>, prefix = '', out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' ? encode(item as Record<string, unknown>, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))));
    else if (typeof v === 'object') encode(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function createCheckoutSession(env: StripeEnv, item: ShopItem, siteUrl: string): Promise<{ url: string; id: string }> {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_NOT_CONFIGURED');
  if (!item.amount || !item.currency) throw new Error('ITEM_NOT_PURCHASABLE');
  const subscription = item.billing === 'monthly';
  const metadata = { item_id: item.id, item_name: item.name };
  /* Request time, not the price baked into a prerendered page. */
  const unitAmount = item.id === WEBSITE_ITEM_ID ? websiteChargeCents() : item.amount;
  const description =
    item.id === WEBSITE_ITEM_ID && websiteSaleActive()
      ? `Pre-Black Friday: a website by Xolqy for ${WEBSITE_SALE_DISPLAY} instead of ${WEBSITE_REGULAR_DISPLAY}. Hosting included, 100 PageSpeed guarantee.`
      : item.tagline;

  const params: Record<string, unknown> = {
    mode: subscription ? 'subscription' : 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: item.currency,
          unit_amount: unitAmount,
          product_data: { name: item.name, description },
          ...(subscription ? { recurring: { interval: 'month' } } : {}),
        },
      },
    ],
    success_url: `${siteUrl}/shop/thanks/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/shop/#${item.id}`,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: 'true' },
    allow_promotion_codes: 'true',
    custom_fields: [
      { key: 'website', label: { type: 'custom', custom: 'Website or domain' }, type: 'text', optional: 'false' },
    ],
    metadata,
    ...(subscription ? { subscription_data: { metadata } } : { customer_creation: 'always', payment_intent_data: { metadata } }),
  };

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
      'idempotency-key': crypto.randomUUID(),
    },
    body: encode(params),
  });
  const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string; code?: string } };
  if (!res.ok || !data.url || !data.id) throw new Error(`STRIPE_${res.status}: ${data.error?.code ?? data.error?.message ?? 'unknown'}`);
  return { url: data.url, id: data.id };
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify the Stripe-Signature header (t=timestamp, v1=HMAC-SHA256 of
 * "timestamp.payload" with the endpoint secret), rejecting anything older
 * than five minutes to prevent replays.
 */
export async function verifyWebhook(payload: string, header: string | null, secret: string | undefined, toleranceSec = 300): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v ?? '');
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`)));
  return sigs.some((s) => safeEqual(s, expected));
}

/** The fields of a completed Checkout Session that the order record keeps. */
export interface CompletedSession {
  id: string;
  mode: 'payment' | 'subscription';
  amount_total: number | null;
  currency: string | null;
  payment_status: string | null;
  livemode: boolean;
  customer: string | null;
  subscription: string | null;
  metadata: { item_id?: string; item_name?: string } | null;
  customer_details: { email?: string | null; name?: string | null; address?: { country?: string | null } | null; tax_ids?: { type: string; value: string }[] | null } | null;
  custom_fields: { key: string; text?: { value?: string | null } | null }[] | null;
}
