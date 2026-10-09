/**
 * Orders from Stripe Checkout, stored in D1 (migrations/0002_orders.sql).
 */
import type { CompletedSession } from './stripe';

export interface OrderRow {
  id: string;
  created_at: string;
  item_id: string;
  item_name: string;
  mode: 'payment' | 'subscription';
  amount_total: number | null;
  currency: string | null;
  payment_status: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_country: string | null;
  tax_id: string | null;
  website: string | null;
  stripe_customer: string | null;
  stripe_subscription: string | null;
  livemode: number;
  status: string;
  notified_at: string | null;
}

const clip = (v: string | null | undefined, n: number) => (v ? v.slice(0, n) : null);

/** Insert once per session. Returns the row when it is new, null when it was already stored. */
export async function recordOrder(db: D1Database, s: CompletedSession): Promise<OrderRow | null> {
  const website = s.custom_fields?.find((f) => f.key === 'website')?.text?.value ?? null;
  const tax = s.customer_details?.tax_ids?.[0];
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO orders (id, item_id, item_name, mode, amount_total, currency, payment_status, customer_email, customer_name, customer_country, tax_id, website, stripe_customer, stripe_subscription, livemode)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`,
    )
    .bind(
      s.id,
      clip(s.metadata?.item_id, 80) ?? 'unknown',
      clip(s.metadata?.item_name, 120) ?? 'Unknown item',
      s.mode,
      s.amount_total,
      s.currency,
      s.payment_status,
      clip(s.customer_details?.email, 254),
      clip(s.customer_details?.name, 160),
      clip(s.customer_details?.address?.country, 2),
      tax ? clip(`${tax.type}: ${tax.value}`, 80) : null,
      clip(website, 300),
      s.customer,
      s.subscription,
      s.livemode ? 1 : 0,
    )
    .run();
  if (!res.meta.changes) return null;
  return db.prepare('SELECT * FROM orders WHERE id = ?1').bind(s.id).first<OrderRow>();
}

export async function markOrderNotified(db: D1Database, id: string): Promise<void> {
  await db.prepare(`UPDATE orders SET notified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1`).bind(id).run();
}

export async function listOrders(db: D1Database, limit = 100): Promise<OrderRow[]> {
  const r = await db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?1').bind(limit).all<OrderRow>();
  return r.results ?? [];
}

export function formatAmount(amount: number | null, currency: string | null): string {
  if (amount === null || !currency) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}
