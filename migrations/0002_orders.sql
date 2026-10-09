-- Migration number: 0002 	 2026-10-07
-- Orders: one row per completed Stripe Checkout session, written by the
-- webhook (POST /api/stripe-webhook) after the signature is verified.
-- The session id is the primary key, so a webhook delivered twice is stored once.

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,                 -- Stripe Checkout session id (cs_...)
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  item_id          TEXT NOT NULL,                    -- src/data/shop.ts id
  item_name        TEXT NOT NULL,
  mode             TEXT NOT NULL CHECK (mode IN ('payment', 'subscription')),
  amount_total     INTEGER,                          -- minor units (cents)
  currency         TEXT,
  payment_status   TEXT,
  customer_email   TEXT,
  customer_name    TEXT,
  customer_country TEXT,
  tax_id           TEXT,
  website          TEXT,                             -- custom field collected at checkout
  stripe_customer  TEXT,
  stripe_subscription TEXT,
  livemode         INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'paid'
                   CHECK (status IN ('paid', 'onboarding', 'in_progress', 'delivered', 'refunded', 'archived')),
  notified_at      TEXT,
  notes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
