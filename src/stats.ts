// Stats aggregation queries used by the dashboard.
// All accept (site, from_ts, to_ts) and return JSON-ready rows.
//
// `site` is a domain like "medlar.gr", OR the sentinel "*" meaning "all sites
// combined" (used by the super-admin view). The site filter is dropped in that
// case so totals span every tracked domain.
//
// Note: D1 = SQLite at the edge. We keep queries cheap by leaning on
// the (site, ts) and (site, path) indexes.

import { dayBucket, todayStart } from './rollup';

export interface Env {
  DB: D1Database;
}

const ONE_DAY = 86400;
export const ALL_SITES = '*';

function clampRange(from: number, to: number) {
  return { from: Math.max(0, from), to: Math.max(from + 1, to) };
}

// Build the time/site WHERE clause and its ordered bind args. When site is "*"
// we omit the site predicate entirely (all-sites aggregate).
function scope(site: string, from: number, to: number): { where: string; args: (string | number)[] } {
  const r = clampRange(from, to);
  if (site === ALL_SITES) return { where: 'ts BETWEEN ? AND ?', args: [r.from, r.to] };
  return { where: 'site = ? AND ts BETWEEN ? AND ?', args: [site, r.from, r.to] };
}

// Headline KPIs. Completed days come from daily_rollups; the current (UTC) day
// is read live from events so the numbers stay real-time. The two parts add up
// because the visitor hash rotates daily — a person is a distinct hash per day,
// so summing per-day uniques equals the live range-wide distinct count.
export async function overview(env: Env, site: string, from: number, to: number) {
  const r = clampRange(from, to);
  const today = todayStart();
  const all = site === ALL_SITES;

  // Rollup part: completed days within [from, to] and strictly before today.
  const rSiteClause = all ? '' : ' AND site = ?';
  const rArgs = all ? [dayBucket(r.from), today, dayBucket(r.to)] : [dayBucket(r.from), today, dayBucket(r.to), site];
  const { results: [rollup] = [] } = await env.DB.prepare(
    `SELECT
       COALESCE(SUM(pageviews), 0)       AS pv,
       COALESCE(SUM(visitors), 0)        AS uv,
       COALESCE(SUM(sessions), 0)        AS ss,
       COALESCE(SUM(sum_duration_ms), 0) AS sd,
       COALESCE(SUM(cnt_duration), 0)    AS cd,
       COALESCE(SUM(sum_scroll), 0)      AS sc,
       COALESCE(SUM(cnt_scroll), 0)      AS cs
     FROM daily_rollups
     WHERE day >= ? AND day < ? AND day <= ?${rSiteClause}`,
  ).bind(...rArgs).all();

  // Live part: today's events (grouped per site, then summed, to match the
  // per-(site, day) semantics of the rollup table).
  const live = await liveToday(env, site, Math.max(r.from, today), r.to);

  const R = (rollup as any) ?? {};
  const pageviews = Number(R.pv || 0) + live.pv;
  const visitors = Number(R.uv || 0) + live.uv;
  const sessions = Number(R.ss || 0) + live.ss;
  const cntDur = Number(R.cd || 0) + live.cd;
  const cntScr = Number(R.cs || 0) + live.cs;
  return {
    pageviews,
    visitors,
    sessions,
    avg_duration_ms: cntDur ? (Number(R.sd || 0) + live.sd) / cntDur : 0,
    avg_scroll_pct: cntScr ? (Number(R.sc || 0) + live.sc) / cntScr : 0,
  };
}

// Aggregate today's raw events into the same shape as a rollup row. Grouping by
// site first keeps "all sites" totals consistent with the summed rollups.
async function liveToday(env: Env, site: string, fromTs: number, toTs: number) {
  const zero = { pv: 0, uv: 0, ss: 0, sd: 0, cd: 0, sc: 0, cs: 0 };
  if (fromTs > toTs) return zero;
  const all = site === ALL_SITES;
  const where = all ? 'ts >= ? AND ts <= ?' : 'ts >= ? AND ts <= ? AND site = ?';
  const args = all ? [fromTs, toTs] : [fromTs, toTs, site];
  const { results: [row] = [] } = await env.DB.prepare(
    `SELECT
       COALESCE(SUM(pv), 0) AS pv, COALESCE(SUM(uv), 0) AS uv, COALESCE(SUM(ss), 0) AS ss,
       COALESCE(SUM(sd), 0) AS sd, COALESCE(SUM(cd), 0) AS cd,
       COALESCE(SUM(sc), 0) AS sc, COALESCE(SUM(cs), 0) AS cs
     FROM (
       SELECT
         COUNT(*) AS pv,
         COUNT(DISTINCT visitor) AS uv,
         COUNT(DISTINCT session) AS ss,
         SUM(CASE WHEN duration_ms > 0 THEN duration_ms ELSE 0 END) AS sd,
         SUM(CASE WHEN duration_ms > 0 THEN 1 ELSE 0 END) AS cd,
         SUM(CASE WHEN scroll_pct > 0 THEN scroll_pct ELSE 0 END) AS sc,
         SUM(CASE WHEN scroll_pct > 0 THEN 1 ELSE 0 END) AS cs
       FROM events
       WHERE ${where}
       GROUP BY site
     )`,
  ).bind(...args).all();
  const R = (row as any) ?? {};
  return {
    pv: Number(R.pv || 0), uv: Number(R.uv || 0), ss: Number(R.ss || 0),
    sd: Number(R.sd || 0), cd: Number(R.cd || 0), sc: Number(R.sc || 0), cs: Number(R.cs || 0),
  };
}

export async function topPages(env: Env, site: string, from: number, to: number, limit = 25) {
  const s = scope(site, from, to);
  const { results } = await env.DB.prepare(
    `SELECT
       path,
       COUNT(*) AS pageviews,
       COUNT(DISTINCT visitor) AS visitors,
       COALESCE(AVG(NULLIF(duration_ms, 0)), 0) AS avg_duration_ms,
       COALESCE(AVG(NULLIF(scroll_pct, 0)), 0) AS avg_scroll_pct
     FROM events
     WHERE ${s.where}
     GROUP BY path
     ORDER BY pageviews DESC
     LIMIT ?`,
  ).bind(...s.args, limit).all();
  return results ?? [];
}

export async function topByEngagement(env: Env, site: string, from: number, to: number, limit = 25) {
  const s = scope(site, from, to);
  const { results } = await env.DB.prepare(
    `SELECT
       path,
       COUNT(*) AS pageviews,
       COALESCE(AVG(NULLIF(duration_ms, 0)), 0) AS avg_duration_ms,
       COALESCE(AVG(NULLIF(scroll_pct, 0)), 0) AS avg_scroll_pct
     FROM events
     WHERE ${s.where}
     GROUP BY path
     HAVING pageviews >= 5
     ORDER BY avg_duration_ms DESC
     LIMIT ?`,
  ).bind(...s.args, limit).all();
  return results ?? [];
}

export async function topReferrers(env: Env, site: string, from: number, to: number, limit = 20) {
  const s = scope(site, from, to);
  const { results } = await env.DB.prepare(
    `SELECT
       COALESCE(NULLIF(referrer, ''), '(direct)') AS source,
       COUNT(*) AS pageviews,
       COUNT(DISTINCT visitor) AS visitors
     FROM events
     WHERE ${s.where}
     GROUP BY source
     ORDER BY pageviews DESC
     LIMIT ?`,
  ).bind(...s.args, limit).all();
  return results ?? [];
}

export async function topCountries(env: Env, site: string, from: number, to: number, limit = 20) {
  const s = scope(site, from, to);
  const { results } = await env.DB.prepare(
    `SELECT
       COALESCE(NULLIF(country, ''), '??') AS country,
       COUNT(*) AS pageviews,
       COUNT(DISTINCT visitor) AS visitors
     FROM events
     WHERE ${s.where}
     GROUP BY country
     ORDER BY pageviews DESC
     LIMIT ?`,
  ).bind(...s.args, limit).all();
  return results ?? [];
}

export async function deviceBreakdown(env: Env, site: string, from: number, to: number) {
  const s = scope(site, from, to);
  const { results } = await env.DB.prepare(
    `SELECT device, COUNT(*) AS pageviews
     FROM events
     WHERE ${s.where}
     GROUP BY device
     ORDER BY pageviews DESC`,
  ).bind(...s.args).all();
  return results ?? [];
}

// Per-day pageviews/visitors for the chart. Completed days from daily_rollups,
// today's point computed live, then concatenated.
export async function dailySeries(env: Env, site: string, from: number, to: number) {
  const r = clampRange(from, to);
  const today = todayStart();
  const all = site === ALL_SITES;

  const rSiteClause = all ? '' : ' AND site = ?';
  const rArgs = all ? [dayBucket(r.from), today, dayBucket(r.to)] : [dayBucket(r.from), today, dayBucket(r.to), site];
  const { results } = await env.DB.prepare(
    `SELECT day AS bucket, SUM(pageviews) AS pageviews, SUM(visitors) AS visitors
     FROM daily_rollups
     WHERE day >= ? AND day < ? AND day <= ?${rSiteClause}
     GROUP BY day
     ORDER BY day ASC`,
  ).bind(...rArgs).all();
  const series = (results as any[]) ?? [];

  // Today's live point (only if the requested range reaches today).
  if (r.to >= today) {
    const live = await liveToday(env, site, Math.max(r.from, today), r.to);
    if (live.pv > 0) series.push({ bucket: today, pageviews: live.pv, visitors: live.uv });
  }
  return series;
}
