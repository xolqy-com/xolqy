// Daily rollup job. Aggregates raw `events` into per-(site, day) totals in
// `daily_rollups`, which the dashboard reads for completed days (today is still
// served live from `events`). Keeps the "All sites (combined)" view cheap.
//
// Triggered by the Cron Trigger in wrangler.toml (see worker.ts `scheduled`),
// and manually via POST /api/admin/rollup (super-admin only).

export interface Env {
  DB: D1Database;
}

const DAY = 86400;

export function dayBucket(ts: number): number {
  return Math.floor(ts / DAY) * DAY;
}

export function todayStart(): number {
  return dayBucket(Math.floor(Date.now() / 1000));
}

// Recompute rollups for every (site, day) with events at ts >= sinceTs.
// sinceTs = null recomputes the entire history (first-run backfill).
// INSERT OR REPLACE makes it idempotent — safe to re-run any time.
export async function recompute(env: Env, sinceTs: number | null): Promise<void> {
  const where = sinceTs == null ? '' : 'WHERE ts >= ?';
  const sql =
    `INSERT OR REPLACE INTO daily_rollups
       (site, day, pageviews, visitors, sessions, sum_duration_ms, cnt_duration, sum_scroll, cnt_scroll)
     SELECT
       site,
       (ts / ${DAY}) * ${DAY} AS day,
       COUNT(*),
       COUNT(DISTINCT visitor),
       COUNT(DISTINCT session),
       COALESCE(SUM(CASE WHEN duration_ms > 0 THEN duration_ms ELSE 0 END), 0),
       SUM(CASE WHEN duration_ms > 0 THEN 1 ELSE 0 END),
       COALESCE(SUM(CASE WHEN scroll_pct > 0 THEN scroll_pct ELSE 0 END), 0),
       SUM(CASE WHEN scroll_pct > 0 THEN 1 ELSE 0 END)
     FROM events
     ${where}
     GROUP BY site, day`;
  const stmt = env.DB.prepare(sql);
  await (sinceTs == null ? stmt : stmt.bind(sinceTs)).run();
}

// One scheduled tick: full backfill if the table is empty, otherwise refresh
// the trailing two days (covers the midnight boundary and any late beacons).
export async function tick(env: Env): Promise<{ mode: 'backfill' | 'incremental'; since: number | null }> {
  const { results } = await env.DB.prepare('SELECT COUNT(*) AS n FROM daily_rollups').all();
  const n = Number((results?.[0] as any)?.n || 0);
  if (n === 0) {
    await recompute(env, null);
    return { mode: 'backfill', since: null };
  }
  const since = todayStart() - DAY; // start of yesterday
  await recompute(env, since);
  return { mode: 'incremental', since };
}
