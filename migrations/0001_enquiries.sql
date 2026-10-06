-- Migration number: 0001 	 2026-10-06
-- Enquiries: the authoritative record of every accepted project enquiry and
-- its processing status. Applied with `wrangler d1 migrations apply xolqy-site`.

CREATE TABLE IF NOT EXISTS enquiries (
  id              TEXT PRIMARY KEY,                 -- UUID
  reference       TEXT NOT NULL UNIQUE,             -- public reference, e.g. XQ-7F3K2A
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  -- Submitted data (validated server-side, size-limited)
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  website         TEXT,
  service         TEXT NOT NULL,
  budget          TEXT,
  brief           TEXT NOT NULL,

  -- Processing state
  status          TEXT NOT NULL DEFAULT 'received'
                  CHECK (status IN ('received', 'queued', 'processing', 'notified', 'notification_failed', 'archived')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  workflow_id     TEXT,
  notified_at     TEXT,
  acknowledged_at TEXT,

  -- Request context (never the IP address)
  country         TEXT,
  colo            TEXT,
  turnstile_hostname TEXT,
  turnstile_challenge_ts TEXT
);

CREATE INDEX IF NOT EXISTS enquiries_status_created_idx ON enquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_created_idx ON enquiries (created_at DESC);

-- Timeline of what happened to each enquiry. Detail never contains personal data.
CREATE TABLE IF NOT EXISTS enquiry_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_id  TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  stage       TEXT NOT NULL,     -- received | queued | workflow_started | notify_attempt | notified | acknowledged | failed | archived
  detail      TEXT
);

CREATE INDEX IF NOT EXISTS enquiry_events_enquiry_idx ON enquiry_events (enquiry_id, id);
