-- One row per pageview. Updates as the visit progresses (duration_ms, scroll_pct, ended_at).
CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,            -- client-generated UUID per pageview
  site         TEXT NOT NULL,               -- "medlar.gr"
  path         TEXT NOT NULL,               -- "/articles/intermittent-fasting/"
  ts           INTEGER NOT NULL,            -- pageview start (unix seconds)
  ended_at     INTEGER,                     -- last beacon received (unix seconds)
  duration_ms  INTEGER NOT NULL DEFAULT 0,  -- accumulated visible time
  scroll_pct   INTEGER NOT NULL DEFAULT 0,  -- max scroll depth reached, 0..100
  referrer     TEXT,                        -- referrer hostname only
  country      TEXT,                        -- CF-IPCountry header
  device       TEXT,                        -- "desktop" | "mobile" | "tablet"
  browser      TEXT,                        -- short label, e.g. "Chrome", "Safari"
  visitor      TEXT NOT NULL,               -- daily-rotating hash, 12 hex chars
  session      TEXT NOT NULL                -- client-generated session id
);

CREATE INDEX IF NOT EXISTS idx_events_site_ts ON events (site, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_site_path ON events (site, path);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events (visitor, ts);
CREATE INDEX IF NOT EXISTS idx_events_session ON events (session);
-- ts-only index so the rollup job and the "all sites" live-today query can scan
-- a date range across every domain without walking the whole table.
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);

-- Outbound link clicks and arbitrary custom events.
CREATE TABLE IF NOT EXISTS clicks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  site       TEXT NOT NULL,
  path       TEXT NOT NULL,
  ts         INTEGER NOT NULL,
  href       TEXT NOT NULL,
  visitor    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clicks_site_ts ON clicks (site, ts DESC);

-- ----------------------------------------------------------------------------
-- Multi-tenant accounts. A user registers (email/password or Google), then
-- claims one or more site domains; they only ever see stats for sites they own.

-- Registered accounts. password_hash is null for Google-only users;
-- google_sub is null for password-only users. At least one is always set.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,            -- uuid
  email         TEXT NOT NULL,               -- lowercased
  password_hash TEXT,                        -- pbkdf2$iters$salt$hash, or null (Google-only)
  google_sub    TEXT,                        -- Google "sub" claim, or null (password-only)
  name          TEXT,                        -- display name
  created_at    INTEGER NOT NULL             -- unix seconds
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users (google_sub) WHERE google_sub IS NOT NULL;

-- Server-side sessions. The cookie holds only the random id; everything else
-- lives here so logout / expiry is authoritative.
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,              -- random 32-byte hex token
  user_id     TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

-- A site (domain) is claimed by exactly one account. Stats are filtered by
-- joining events.site = sites.domain and checking ownership.
CREATE TABLE IF NOT EXISTS sites (
  id          TEXT PRIMARY KEY,              -- uuid
  user_id     TEXT NOT NULL,
  domain      TEXT NOT NULL,                 -- "medlar.gr"
  created_at  INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_domain ON sites (domain);
CREATE INDEX IF NOT EXISTS idx_sites_user ON sites (user_id);

-- A site owner (or super-admin) can share read-only access to a site with other
-- people by email. A share starts 'pending' with an invite token; it becomes
-- 'accepted' (bound to a user_id) when that person opens the invite link while
-- signed in with the invited email.
CREATE TABLE IF NOT EXISTS shares (
  id          TEXT PRIMARY KEY,            -- uuid
  site_id     TEXT NOT NULL,               -- references sites.id
  email       TEXT NOT NULL,               -- invited email, lowercased
  role        TEXT NOT NULL DEFAULT 'viewer',
  token       TEXT NOT NULL,               -- random invite token (in the link)
  status      TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted'
  user_id     TEXT,                        -- set when accepted
  invited_by  TEXT NOT NULL,               -- user_id of the sharer
  created_at  INTEGER NOT NULL,
  accepted_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shares_token ON shares (token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shares_site_email ON shares (site_id, email);
CREATE INDEX IF NOT EXISTS idx_shares_site ON shares (site_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON shares (user_id, status);

-- API keys for programmatic, read-only access to the stats API (e.g. the MCP
-- server so Claude can query analytics). Only the SHA-256 hash is stored.
CREATE TABLE IF NOT EXISTS api_keys (
  id           TEXT PRIMARY KEY,            -- uuid
  user_id      TEXT NOT NULL,
  name         TEXT,                        -- user label
  prefix       TEXT NOT NULL,               -- first chars, for display only
  key_hash     TEXT NOT NULL,               -- sha-256 hex of the full key
  created_at   INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys (user_id);

-- ----------------------------------------------------------------------------
-- Pre-aggregated daily totals per (site, day). Populated by the scheduled cron
-- (see src/rollup.ts). The dashboard's headline KPIs and traffic chart read
-- from here for completed days and query raw events only for "today", so the
-- "All sites (combined)" view stays fast across 100+ domains.
--
-- Averages are stored as sum+count so they recombine correctly across a range.
-- duration/scroll counts only include events where the value was > 0, matching
-- the live AVG(NULLIF(...)) behaviour.
CREATE TABLE IF NOT EXISTS daily_rollups (
  site            TEXT NOT NULL,
  day             INTEGER NOT NULL,          -- unix-seconds bucket = (ts/86400)*86400 (UTC midnight)
  pageviews       INTEGER NOT NULL DEFAULT 0,
  visitors        INTEGER NOT NULL DEFAULT 0,-- distinct daily-rotating hashes that day
  sessions        INTEGER NOT NULL DEFAULT 0,
  sum_duration_ms INTEGER NOT NULL DEFAULT 0,
  cnt_duration    INTEGER NOT NULL DEFAULT 0,
  sum_scroll      INTEGER NOT NULL DEFAULT 0,
  cnt_scroll      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, day)
);
CREATE INDEX IF NOT EXISTS idx_rollups_day ON daily_rollups (day);
