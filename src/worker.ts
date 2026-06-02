// Single Worker entrypoint. Routes:
//   GET  /t.js                   – the tracker script (cached at the edge)
//   POST /api/event              – pageview / ping (upserts the visit row)
//   POST /api/click              – outbound click record
//   GET  /api/stats/*            – dashboard data (session + site-ownership gated)
//   POST /api/auth/register      – create an email/password account
//   POST /api/auth/login         – email/password login
//   POST /api/auth/logout        – destroy the session
//   GET  /api/me                 – current account
//   GET/POST/DELETE /api/sites   – list / claim / remove the account's sites
//   GET  /auth/google            – begin Google OAuth
//   GET  /auth/google/callback   – Google OAuth callback
//   GET  /login                  – login + register UI (static)
//   GET  /dashboard              – dashboard UI (static, requires login)
//   GET  /                       – marketing landing (static)
//
// Auth model (multi-tenant): visitors register with email/password or Google,
// then claim site domains they own. Stats are filtered to the logged-in
// account's sites. Sessions are server-side rows referenced by an HttpOnly
// cookie. See src/auth.ts.

import { TRACKER_JS } from './tracker';
import * as Stats from './stats';
import * as Auth from './auth';
import * as Rollup from './rollup';
import * as Site from './site';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SALT_SEED: string;
  ADMIN_TOKEN: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  SUPERADMIN_EMAIL?: string;
  RESEND_API_KEY?: string;
  INVITE_FROM?: string;
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-max-age': '86400',
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS_HEADERS },
    ...init,
  });
}

function bad(msg: string, status = 400) {
  return json({ error: msg }, { status });
}

const CANONICAL_HOST = 'xolqy.com';

// Returns a 301 to the canonical host, or null if no redirect is needed.
function canonicalRedirect(url: URL, req: Request): Response | null {
  const host = url.hostname;
  if (host === CANONICAL_HOST || host === 'localhost' || host === '127.0.0.1') return null;
  // Only redirect browsable navigations — never the collector or the script,
  // which must answer on whatever host a tracked site calls.
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (url.pathname === '/t.js' || url.pathname === '/track.js' || url.pathname.startsWith('/api/')) return null;
  return Response.redirect(`https://${CANONICAL_HOST}${url.pathname}${url.search}`, 301);
}

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });
}

// ----------------------------------------------------------------------------
// Visitor hashing — cookieless daily-rotating identity.
// hash = sha256(ip + ua + salt(today))   →   first 12 hex chars.
// Salt is deterministic from SALT_SEED + YYYYMMDD, so it rotates at UTC midnight.
async function visitorHash(ip: string, ua: string, saltSeed: string): Promise<string> {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const buf = new TextEncoder().encode(`${ip}|${ua}|${saltSeed}|${day}`);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest, 0, 6))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseDevice(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(s)) return 'mobile';
  return 'desktop';
}

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  if (/OPR\//.test(ua)) return 'Opera';
  return 'Other';
}

function referrerHostname(ref: string): string {
  if (!ref) return '';
  try {
    return new URL(ref).hostname;
  } catch {
    return '';
  }
}

// ----------------------------------------------------------------------------
// Event collector
async function handleEvent(req: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad('invalid json');
  }
  if (!body || !body.id || !body.site || !body.path || !body.session) return bad('missing fields');

  const ip = req.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ua = String(body.ua || req.headers.get('user-agent') || '');
  const country = req.headers.get('cf-ipcountry') || '';
  const now = Math.floor(Date.now() / 1000);
  const visitor = await visitorHash(ip, ua, env.SALT_SEED);
  const device = parseDevice(ua);
  const browser = parseBrowser(ua);
  const ref = referrerHostname(body.ref || '');
  const duration = Math.min(60 * 60 * 6 * 1000, Math.max(0, Number(body.duration_ms || 0) | 0));
  const scroll = Math.min(100, Math.max(0, Number(body.scroll_pct || 0) | 0));

  if (body.t === 'pageview') {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO events
         (id, site, path, ts, ended_at, duration_ms, scroll_pct, referrer, country, device, browser, visitor, session)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(body.id, body.site, body.path, now, now, duration, scroll, ref, country, device, browser, visitor, body.session).run();
  } else {
    // ping — keep the highest scroll/duration values
    await env.DB.prepare(
      `UPDATE events
         SET duration_ms = MAX(duration_ms, ?2),
             scroll_pct = MAX(scroll_pct, ?3),
             ended_at = ?4
       WHERE id = ?1`,
    ).bind(body.id, duration, scroll, now).run();
  }

  return new Response('', { status: 204, headers: CORS_HEADERS });
}

async function handleClick(req: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad('invalid json');
  }
  if (!body || !body.site || !body.href) return bad('missing fields');

  const ip = req.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ua = req.headers.get('user-agent') || '';
  const visitor = await visitorHash(ip, ua, env.SALT_SEED);
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `INSERT INTO clicks (site, path, ts, href, visitor) VALUES (?, ?, ?, ?, ?)`,
  ).bind(body.site, body.path || '', now, body.href, visitor).run();

  return new Response('', { status: 204, headers: CORS_HEADERS });
}

// ----------------------------------------------------------------------------
// Account endpoints (email/password)
async function handleRegister(req: Request, env: Env): Promise<Response> {
  let body: any;
  try { body = await req.json(); } catch { return bad('invalid json'); }
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const name = body?.name ? String(body.name).slice(0, 120) : null;
  if (!Auth.isValidEmail(email)) return bad('invalid email');
  if (password.length < 8) return bad('password must be at least 8 characters');
  if (await Auth.findUserByEmail(env, email)) return bad('an account with that email already exists', 409);

  const user = await Auth.createUser(env, { email, passwordHash: await Auth.hashPassword(password), name });
  const sid = await Auth.createSession(env, user.id);
  return json({ user: publicUser(user) }, { headers: { 'set-cookie': Auth.sessionCookieHeader(sid) } });
}

async function handleLogin(req: Request, env: Env): Promise<Response> {
  let body: any;
  try { body = await req.json(); } catch { return bad('invalid json'); }
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const user = await Auth.findUserByEmail(env, email);
  // Run verify even when the user is missing to keep timing uniform.
  const ok = await Auth.verifyPassword(password, user?.password_hash ?? null);
  if (!user || !ok) return bad('invalid email or password', 401);
  const sid = await Auth.createSession(env, user.id);
  return json({ user: publicUser(user) }, { headers: { 'set-cookie': Auth.sessionCookieHeader(sid) } });
}

async function handleLogout(req: Request, env: Env): Promise<Response> {
  const sid = Auth.parseCookies(req)[ 'xq_sess' ];
  if (sid) await Auth.destroySession(env, sid);
  return json({ ok: true }, { headers: { 'set-cookie': Auth.clearSessionCookieHeader() } });
}

function publicUser(u: Auth.User) {
  return { id: u.id, email: u.email, name: u.name, has_google: !!u.google_sub };
}

// ----------------------------------------------------------------------------
// Google OAuth
function handleGoogleStart(req: Request, env: Env): Response {
  if (!Auth.googleConfigured(env)) {
    return Response.redirect(new URL('/login?error=google_not_configured', req.url).toString(), 302);
  }
  const { location, setCookie } = Auth.googleAuthRedirect(req, env);
  return new Response(null, { status: 302, headers: { location, 'set-cookie': setCookie } });
}

async function handleGoogleCallback(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const loginUrl = (err: string) => new URL(`/login?error=${err}`, req.url).toString();
  if (url.searchParams.get('error')) return Response.redirect(loginUrl('google_denied'), 302);

  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const expected = Auth.oauthStateCookie(req);
  if (!code || !state || !expected || state !== expected) return Response.redirect(loginUrl('bad_state'), 302);

  let profile: Auth.GoogleProfile;
  try {
    profile = await Auth.exchangeGoogleCode(req, env, code);
  } catch {
    return Response.redirect(loginUrl('google_failed'), 302);
  }
  if (!profile.emailVerified) return Response.redirect(loginUrl('email_unverified'), 302);

  // Find by Google sub, else by email (link accounts), else create.
  let user = await Auth.findUserByGoogleSub(env, profile.sub);
  if (!user) {
    const byEmail = await Auth.findUserByEmail(env, profile.email);
    if (byEmail) {
      await Auth.attachGoogleSub(env, byEmail.id, profile.sub);
      user = byEmail;
    } else {
      user = await Auth.createUser(env, { email: profile.email, googleSub: profile.sub, name: profile.name });
    }
  }
  const sid = await Auth.createSession(env, user.id);
  return new Response(null, {
    status: 302,
    headers: { location: new URL('/dashboard', req.url).toString(), 'set-cookie': Auth.sessionCookieHeader(sid) },
  });
}

// ----------------------------------------------------------------------------
// Sites (per-account)
async function handleSites(req: Request, env: Env, user: Auth.User): Promise<Response> {
  const url = new URL(req.url);
  const isAdmin = Auth.isSuperAdmin(user, env);

  // /api/sites/:id/shares  — list (GET) / invite (POST)
  const shareMatch = url.pathname.match(/^\/api\/sites\/([^/]+)\/shares$/);
  if (shareMatch) {
    const siteId = decodeURIComponent(shareMatch[1]);
    if (req.method === 'GET') {
      const site = await Auth.getSite(env, siteId);
      if (!site || (!isAdmin && site.user_id !== user.id)) return new Response('forbidden', { status: 403 });
      return json({ shares: await Auth.listShares(env, siteId) });
    }
    if (req.method === 'POST') {
      let body: any;
      try { body = await req.json(); } catch { return bad('invalid json'); }
      const res = await Auth.createShare(env, siteId, user.id, isAdmin, String(body?.email || ''));
      if (!res.ok) return bad(res.error, res.status);
      const link = `${url.origin}/invite/${res.share.token}`;
      const emailed = await Auth.sendInviteEmail(env, res.share.email, res.share.domain, link, user.email);
      return json({ share: { id: res.share.id, email: res.share.email, status: res.share.status }, link, emailed, existed: res.existed }, { status: res.existed ? 200 : 201 });
    }
    return bad('method not allowed', 405);
  }

  // /api/sites/:id  (DELETE)
  const idMatch = url.pathname.match(/^\/api\/sites\/([^/]+)$/);
  if (req.method === 'DELETE' && idMatch) {
    const ok = await Auth.deleteSite(env, user.id, decodeURIComponent(idMatch[1]));
    return ok ? json({ ok: true }) : bad('not found', 404);
  }
  if (req.method === 'GET') {
    // Super-admin sees every tracked domain; everyone else sees owned + shared.
    const sites = isAdmin ? await Auth.listAllDomains(env) : await Auth.listAccessibleSites(env, user.id);
    return json({ sites });
  }
  if (req.method === 'POST') {
    let body: any;
    try { body = await req.json(); } catch { return bad('invalid json'); }
    const res = await Auth.addSite(env, user.id, String(body?.domain || ''));
    if (!res.ok) return bad(res.error, res.status);
    return json({ site: res.site }, { status: 201 });
  }
  return bad('method not allowed', 405);
}

// Revoke a share, and accept an invite — separate top-level routes.
async function handleDeleteShare(req: Request, env: Env, user: Auth.User, shareId: string): Promise<Response> {
  const ok = await Auth.deleteShare(env, shareId, user.id, Auth.isSuperAdmin(user, env));
  return ok ? json({ ok: true }) : bad('not found', 404);
}

async function handleAcceptInvite(env: Env, user: Auth.User, token: string): Promise<Response> {
  const res = await Auth.acceptInvite(env, token, user);
  return res.ok ? json({ ok: true, domain: res.domain }) : bad(res.error, 403);
}

// ----------------------------------------------------------------------------
// Stats API — requires a logged-in account that owns the requested site
async function handleStats(req: Request, env: Env, user: Auth.User): Promise<Response> {
  const url = new URL(req.url);
  const site = url.searchParams.get('site') || '';
  if (!site) return bad('site required');
  const isAdmin = Auth.isSuperAdmin(user, env);
  // The "*" all-sites aggregate and any unclaimed domain are admin-only.
  if (site === Stats.ALL_SITES) {
    if (!isAdmin) return new Response('forbidden', { status: 403 });
  } else if (!isAdmin && !(await Auth.userCanAccessDomain(env, user.id, site))) {
    return new Response('forbidden', { status: 403 });
  }
  const now = Math.floor(Date.now() / 1000);
  const from = Number(url.searchParams.get('from')) || now - 30 * 86400;
  const to = Number(url.searchParams.get('to')) || now;
  const kind = url.pathname.replace(/^\/api\/stats\//, '');

  switch (kind) {
    case 'overview':     return json(await Stats.overview(env, site, from, to));
    case 'top-pages':    return json(await Stats.topPages(env, site, from, to));
    case 'engagement':   return json(await Stats.topByEngagement(env, site, from, to));
    case 'referrers':    return json(await Stats.topReferrers(env, site, from, to));
    case 'countries':    return json(await Stats.topCountries(env, site, from, to));
    case 'devices':      return json(await Stats.deviceBreakdown(env, site, from, to));
    case 'series':       return json(await Stats.dailySeries(env, site, from, to));
    default:             return bad('unknown stat', 404);
  }
}

// ----------------------------------------------------------------------------
// Static assets fallback
async function serveAsset(req: Request, env: Env): Promise<Response> {
  return env.ASSETS.fetch(req);
}

// ----------------------------------------------------------------------------
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // Canonical host. Consolidate www + workers.dev onto https://xolqy.com so
    // search engines / AI / OG tags see a single source. The collector (/api/*)
    // and the tracker script stay host-agnostic so embedded tracking works from
    // any origin and POST bodies are never lost to a redirect.
    const redir = canonicalRedirect(url, req);
    if (redir) return redir;

    // CORS preflight for the tracker endpoints
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    // Tracker script
    if (url.pathname === '/t.js' || url.pathname === '/track.js') {
      return new Response(TRACKER_JS, {
        headers: {
          'content-type': 'application/javascript; charset=utf-8',
          'cache-control': 'public, max-age=300, s-maxage=300',
          'access-control-allow-origin': '*',
        },
      });
    }

    // Event collector (public — this is how sites report traffic)
    if (url.pathname === '/api/event' && req.method === 'POST') return handleEvent(req, env);
    if (url.pathname === '/api/click' && req.method === 'POST') return handleClick(req, env);

    // Auth endpoints (public)
    if (url.pathname === '/api/auth/register' && req.method === 'POST') return handleRegister(req, env);
    if (url.pathname === '/api/auth/login' && req.method === 'POST') return handleLogin(req, env);
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') return handleLogout(req, env);
    if (url.pathname === '/auth/google') return handleGoogleStart(req, env);
    if (url.pathname === '/auth/google/callback') return handleGoogleCallback(req, env);

    // Invite info (public — token is the secret) so the accept page can render.
    const inviteInfo = url.pathname.match(/^\/api\/invite\/([^/]+)$/);
    if (inviteInfo && req.method === 'GET') {
      const info = await Auth.getInvite(env, decodeURIComponent(inviteInfo[1]));
      return info ? json(info) : json({ error: 'invite not found' }, { status: 404 });
    }

    // Everything below requires a logged-in account.
    if (url.pathname === '/api/me' || url.pathname === '/api/sites' ||
        url.pathname.startsWith('/api/sites/') || url.pathname.startsWith('/api/stats/') ||
        url.pathname.startsWith('/api/shares/') || url.pathname.startsWith('/api/invite/') ||
        url.pathname === '/api/admin/rollup') {
      const user = await Auth.currentUser(req, env);
      if (!user) return json({ error: 'unauthorized' }, { status: 401 });
      const shareDel = url.pathname.match(/^\/api\/shares\/([^/]+)$/);
      if (shareDel && req.method === 'DELETE') return handleDeleteShare(req, env, user, decodeURIComponent(shareDel[1]));
      const accept = url.pathname.match(/^\/api\/invite\/([^/]+)\/accept$/);
      if (accept && req.method === 'POST') return handleAcceptInvite(env, user, decodeURIComponent(accept[1]));
      if (url.pathname === '/api/me') {
        return json({
          user: { ...publicUser(user), is_admin: Auth.isSuperAdmin(user, env) },
          google_available: Auth.googleConfigured(env),
        });
      }
      if (url.pathname === '/api/admin/rollup') {
        if (req.method !== 'POST') return bad('method not allowed', 405);
        if (!Auth.isSuperAdmin(user, env)) return new Response('forbidden', { status: 403 });
        const res = await Rollup.tick(env);
        return json({ ok: true, ...res });
      }
      if (url.pathname === '/api/sites' || url.pathname.startsWith('/api/sites/')) return handleSites(req, env, user);
      return handleStats(req, env, user);
    }

    // Dashboard — redirect to /login when not authenticated
    if (url.pathname === '/dashboard' || url.pathname === '/dashboard/') {
      const user = await Auth.currentUser(req, env);
      if (!user) return Response.redirect(new URL('/login', url).toString(), 302);
      return serveAsset(new Request(new URL('/dashboard.html', url), req), env);
    }

    // Login / register page (redirect to dashboard if already signed in)
    if (url.pathname === '/login' || url.pathname === '/login/' || url.pathname === '/register') {
      const user = await Auth.currentUser(req, env);
      if (user) return Response.redirect(new URL('/dashboard', url).toString(), 302);
      return serveAsset(new Request(new URL('/login.html', url), req), env);
    }

    // Invite accept page (client renders from /api/invite/:token)
    if (url.pathname.startsWith('/invite/')) return html(Site.renderInvitePage(url.origin));

    // Health check
    if (url.pathname === '/health') return json({ ok: true });

    // SEO files
    if (url.pathname === '/sitemap.xml') {
      return new Response(Site.sitemapXml(url.origin), {
        headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
      });
    }
    if (url.pathname === '/robots.txt') {
      return new Response(Site.robotsTxt(url.origin), {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
      });
    }
    if (url.pathname === '/rss.xml') {
      return new Response(Site.rssXml(url.origin), {
        headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
      });
    }
    if (url.pathname === '/llms.txt') {
      return new Response(Site.llmsTxt(url.origin), {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
      });
    }

    // Marketing site — landing + every footer page + blog, rendered by the
    // Worker so the shared header/footer stay consistent and no link 404s.
    if (url.pathname === '/' || url.pathname === '') return html(Site.renderLanding(url.origin));
    if (req.method === 'GET') {
      const slug = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
      if (slug.startsWith('blog/')) {
        const post = Site.renderPost(slug.slice('blog/'.length), url.origin);
        if (post) return html(post);
      }
      const rendered = Site.renderPageHtml(slug, url.origin);
      if (rendered) return html(rendered);
    }

    // Everything else → static assets (css, dashboard.html, login.html, etc.)
    return serveAsset(req, env);
  },

  // Cron Trigger (see [triggers] in wrangler.toml). Rolls completed days into
  // daily_rollups so the dashboard's headline numbers stay fast at scale.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(Rollup.tick(env));
  },
};
