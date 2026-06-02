// Authentication & multi-tenant account helpers.
//
// All crypto uses the Web Crypto API available in Workers (no native bcrypt):
//   - Passwords: PBKDF2-SHA256, 100k iterations, random 16-byte salt.
//   - Sessions:  server-side rows keyed by a random 32-byte hex token kept in
//                an HttpOnly cookie. Logout/expiry are authoritative in D1.
//   - Google:    OAuth 2.0 authorization-code flow. The id_token returned by
//                Google's token endpoint is decoded (not re-verified) — it came
//                straight from Google over TLS in the code exchange.

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SALT_SEED: string;
  ADMIN_TOKEN: string;
  // Google OAuth — set as Wrangler secrets (see README). Placeholders are fine
  // until you wire real credentials; the Google buttons just won't work yet.
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string; // optional override; otherwise derived per-request
  // Comma-separated list of emails granted super-admin (sees every domain).
  SUPERADMIN_EMAIL?: string;
  // Optional email delivery for invites (Resend). If unset, invite links are
  // still generated — they just have to be shared manually.
  RESEND_API_KEY?: string;
  INVITE_FROM?: string; // e.g. "Xolqy <invites@xolqy.com>"
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  google_sub: string | null;
  password_hash: string | null;
  created_at: number;
}

const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days, seconds
const SESSION_COOKIE = 'xq_sess';
const OAUTH_STATE_COOKIE = 'xq_oauth';
const PBKDF2_ITERS = 100_000;

const enc = new TextEncoder();

// ----------------------------------------------------------------------------
// Small helpers
function uuid(): string {
  return crypto.randomUUID();
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomToken(bytes = 32): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

// Constant-time string compare to avoid timing leaks on hash/token checks.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// ----------------------------------------------------------------------------
// Password hashing (PBKDF2-SHA256)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt, PBKDF2_ITERS);
  return `pbkdf2$${PBKDF2_ITERS}$${b64url(salt)}$${b64url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, iterStr, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;
  const iters = Number(iterStr) || PBKDF2_ITERS;
  const salt = b64urlToBytes(saltB64);
  const bits = await deriveBits(password, salt, iters);
  return timingSafeEqual(b64url(new Uint8Array(bits)), hashB64);
}

async function deriveBits(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
}

// ----------------------------------------------------------------------------
// Cookie helpers
export function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function cookie(name: string, value: string, maxAge: number): string {
  const attrs = [`${name}=${value}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', `Max-Age=${maxAge}`];
  return attrs.join('; ');
}

// ----------------------------------------------------------------------------
// Users
export async function findUserByEmail(env: Env, email: string): Promise<User | null> {
  const { results } = await env.DB.prepare('SELECT * FROM users WHERE email = ?1').bind(email.toLowerCase()).all();
  return (results?.[0] as unknown as User) ?? null;
}

export async function findUserByGoogleSub(env: Env, sub: string): Promise<User | null> {
  const { results } = await env.DB.prepare('SELECT * FROM users WHERE google_sub = ?1').bind(sub).all();
  return (results?.[0] as unknown as User) ?? null;
}

export async function findUserById(env: Env, id: string): Promise<User | null> {
  const { results } = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(id).all();
  return (results?.[0] as unknown as User) ?? null;
}

export async function createUser(
  env: Env,
  opts: { email: string; passwordHash?: string | null; googleSub?: string | null; name?: string | null },
): Promise<User> {
  const id = uuid();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, google_sub, name, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
  ).bind(id, opts.email.toLowerCase(), opts.passwordHash ?? null, opts.googleSub ?? null, opts.name ?? null, now).run();
  return { id, email: opts.email.toLowerCase(), password_hash: opts.passwordHash ?? null, google_sub: opts.googleSub ?? null, name: opts.name ?? null, created_at: now };
}

// Link a Google identity onto an existing (password) account on first Google login.
export async function attachGoogleSub(env: Env, userId: string, sub: string): Promise<void> {
  await env.DB.prepare('UPDATE users SET google_sub = ?2 WHERE id = ?1').bind(userId, sub).run();
}

// ----------------------------------------------------------------------------
// Sessions
export async function createSession(env: Env, userId: string): Promise<string> {
  const id = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(id, userId, now, now + SESSION_TTL).run();
  return id;
}

export async function destroySession(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?1').bind(id).run();
}

// Resolve the logged-in user from the session cookie, or null. Expired sessions
// are deleted lazily.
export async function currentUser(req: Request, env: Env): Promise<User | null> {
  const sid = parseCookies(req)[SESSION_COOKIE];
  if (!sid) return null;
  const now = Math.floor(Date.now() / 1000);
  const { results } = await env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?1 AND s.expires_at > ?2`,
  ).bind(sid, now).all();
  const user = (results?.[0] as unknown as User) ?? null;
  if (!user) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?1 AND expires_at <= ?2').bind(sid, now).run();
    return null;
  }
  return user;
}

export function sessionCookieHeader(sessionId: string): string {
  return cookie(SESSION_COOKIE, sessionId, SESSION_TTL);
}

export function clearSessionCookieHeader(): string {
  return cookie(SESSION_COOKIE, '', 0);
}

// ----------------------------------------------------------------------------
// Sites (multi-tenant ownership)
export async function listSites(env: Env, userId: string) {
  const { results } = await env.DB.prepare(
    'SELECT id, domain, created_at FROM sites WHERE user_id = ?1 ORDER BY created_at ASC',
  ).bind(userId).all();
  return results ?? [];
}

export type AddSiteResult =
  | { ok: true; site: { id: string; domain: string; created_at: number } }
  | { ok: false; error: string; status: number };

// Claim a domain for this account, or report why it couldn't be claimed.
export async function addSite(env: Env, userId: string, domain: string): Promise<AddSiteResult> {
  const clean = normalizeDomain(domain);
  if (!clean) return { ok: false, error: 'invalid domain', status: 400 };
  const existing = await env.DB.prepare('SELECT user_id FROM sites WHERE domain = ?1').bind(clean).all();
  if (existing.results?.[0]) {
    const owner = (existing.results[0] as any).user_id;
    return owner === userId
      ? { ok: false, error: 'you already added this domain', status: 409 }
      : { ok: false, error: 'domain already claimed by another account', status: 409 };
  }
  const id = uuid();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare('INSERT INTO sites (id, user_id, domain, created_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(id, userId, clean, now).run();
  return { ok: true, site: { id, domain: clean, created_at: now } };
}

export async function deleteSite(env: Env, userId: string, siteId: string): Promise<boolean> {
  const res = await env.DB.prepare('DELETE FROM sites WHERE id = ?1 AND user_id = ?2').bind(siteId, userId).run();
  const deleted = (res.meta?.changes ?? 0) > 0;
  if (deleted) await env.DB.prepare('DELETE FROM shares WHERE site_id = ?1').bind(siteId).run();
  return deleted;
}

// ----------------------------------------------------------------------------
// Super-admin: an account (by email) that can view every domain on the platform,
// including domains that just have the script installed but were never claimed.
export function superAdminEmails(env: Env): string[] {
  return String(env.SUPERADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdmin(user: User, env: Env): boolean {
  return superAdminEmails(env).includes(user.email.toLowerCase());
}

// Every distinct tracked domain — claimed sites unioned with domains seen in
// raw events. Includes the site id where the domain has been claimed (null
// otherwise). Used to populate the super-admin's site picker.
export async function listAllDomains(env: Env): Promise<{ domain: string; id: string | null }[]> {
  const { results } = await env.DB.prepare(
    `SELECT d.domain AS domain, st.id AS id
       FROM (SELECT DISTINCT site AS domain FROM events UNION SELECT domain FROM sites) d
       LEFT JOIN sites st ON st.domain = d.domain
      WHERE d.domain IS NOT NULL AND d.domain <> ''
      ORDER BY d.domain ASC`,
  ).all();
  return (results as unknown as { domain: string; id: string | null }[]) ?? [];
}

// Sites a user can view: ones they own plus ones accepted-shared with them.
export async function listAccessibleSites(env: Env, userId: string) {
  const { results } = await env.DB.prepare(
    `SELECT id, domain, created_at, 'owner' AS access FROM sites WHERE user_id = ?1
     UNION
     SELECT s.id, s.domain, s.created_at, 'shared' AS access
       FROM shares sh JOIN sites s ON s.id = sh.site_id
      WHERE sh.user_id = ?1 AND sh.status = 'accepted'
     ORDER BY domain ASC`,
  ).bind(userId).all();
  return results ?? [];
}

export async function getSite(env: Env, siteId: string): Promise<{ id: string; user_id: string; domain: string } | null> {
  const { results } = await env.DB.prepare('SELECT id, user_id, domain FROM sites WHERE id = ?1').bind(siteId).all();
  return (results?.[0] as any) ?? null;
}

// Can this user view stats for this domain? Owner, accepted-share, handled here;
// super-admin is checked separately by the caller.
export async function userCanAccessDomain(env: Env, userId: string, domain: string): Promise<boolean> {
  const d = normalizeDomain(domain);
  const { results } = await env.DB.prepare(
    `SELECT 1 FROM sites WHERE user_id = ?1 AND domain = ?2
     UNION
     SELECT 1 FROM shares sh JOIN sites s ON s.id = sh.site_id
       WHERE sh.user_id = ?1 AND sh.status = 'accepted' AND s.domain = ?2
     LIMIT 1`,
  ).bind(userId, d).all();
  return !!results?.[0];
}

// ----------------------------------------------------------------------------
// Sharing (per-site, read-only)
export interface ShareRow { id: string; email: string; role: string; status: string; created_at: number }

export async function listShares(env: Env, siteId: string): Promise<ShareRow[]> {
  const { results } = await env.DB.prepare(
    'SELECT id, email, role, status, created_at FROM shares WHERE site_id = ?1 ORDER BY created_at ASC',
  ).bind(siteId).all();
  return (results as unknown as ShareRow[]) ?? [];
}

// Owner of the site (or super-admin) creates/returns an invite for an email.
export async function createShare(
  env: Env, siteId: string, byUserId: string, isAdmin: boolean, email: string,
): Promise<{ ok: true; share: { id: string; email: string; token: string; status: string; domain: string }; existed: boolean } | { ok: false; error: string; status: number }> {
  const site = await getSite(env, siteId);
  if (!site) return { ok: false, error: 'site not found', status: 404 };
  if (!isAdmin && site.user_id !== byUserId) return { ok: false, error: 'forbidden', status: 403 };
  const e = String(email || '').trim().toLowerCase();
  if (!isValidEmail(e)) return { ok: false, error: 'invalid email', status: 400 };

  const existing = await env.DB.prepare('SELECT id, token, status FROM shares WHERE site_id = ?1 AND email = ?2').bind(siteId, e).all();
  if (existing.results?.[0]) {
    const r = existing.results[0] as any;
    return { ok: true, existed: true, share: { id: r.id, email: e, token: r.token, status: r.status, domain: site.domain } };
  }
  const id = uuid();
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO shares (id, site_id, email, role, token, status, invited_by, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)',
  ).bind(id, siteId, e, 'viewer', token, 'pending', byUserId, now).run();
  return { ok: true, existed: false, share: { id, email: e, token, status: 'pending', domain: site.domain } };
}

export async function deleteShare(env: Env, shareId: string, byUserId: string, isAdmin: boolean): Promise<boolean> {
  const { results } = await env.DB.prepare(
    'SELECT sh.id, s.user_id AS owner FROM shares sh JOIN sites s ON s.id = sh.site_id WHERE sh.id = ?1',
  ).bind(shareId).all();
  const row = results?.[0] as any;
  if (!row) return false;
  if (!isAdmin && row.owner !== byUserId) return false;
  await env.DB.prepare('DELETE FROM shares WHERE id = ?1').bind(shareId).run();
  return true;
}

// Public invite lookup by token (for the accept page).
export async function getInvite(env: Env, token: string): Promise<{ domain: string; email: string; status: string } | null> {
  const { results } = await env.DB.prepare(
    'SELECT s.domain AS domain, sh.email AS email, sh.status AS status FROM shares sh JOIN sites s ON s.id = sh.site_id WHERE sh.token = ?1',
  ).bind(token).all();
  return (results?.[0] as any) ?? null;
}

export async function acceptInvite(env: Env, token: string, user: User): Promise<{ ok: true; domain: string } | { ok: false; error: string }> {
  const { results } = await env.DB.prepare(
    'SELECT sh.id AS id, sh.email AS email, sh.status AS status, sh.user_id AS user_id, s.domain AS domain FROM shares sh JOIN sites s ON s.id = sh.site_id WHERE sh.token = ?1',
  ).bind(token).all();
  const inv = results?.[0] as any;
  if (!inv) return { ok: false, error: 'This invite is invalid or was revoked.' };
  if (inv.status === 'accepted' && inv.user_id === user.id) return { ok: true, domain: inv.domain };
  if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: `This invite was sent to ${inv.email}. Sign in with that account to accept it.` };
  }
  await env.DB.prepare('UPDATE shares SET status = ?2, user_id = ?3, accepted_at = ?4 WHERE id = ?1')
    .bind(inv.id, 'accepted', user.id, Math.floor(Date.now() / 1000)).run();
  return { ok: true, domain: inv.domain };
}

// Optional invite email via Resend. No-op (returns false) when unconfigured.
export async function sendInviteEmail(
  env: Env, to: string, domain: string, link: string, inviter: string,
): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  const from = env.INVITE_FROM || 'Xolqy <invites@xolqy.com>';
  const html = `<p>${inviter} invited you to view analytics for <b>${domain}</b> on Xolqy.</p>
<p><a href="${link}">Accept the invite</a></p>
<p>Or paste this link into your browser:<br>${link}</p>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject: `You've been invited to view ${domain} on Xolqy`, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function userOwnsDomain(env: Env, userId: string, domain: string): Promise<boolean> {
  const { results } = await env.DB.prepare('SELECT 1 FROM sites WHERE user_id = ?1 AND domain = ?2')
    .bind(userId, normalizeDomain(domain)).all();
  return !!results?.[0];
}

// Strip scheme/path/port and lowercase. "https://Medlar.gr/x" -> "medlar.gr".
export function normalizeDomain(input: string): string {
  let d = String(input || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) return '';
  return d;
}

// ----------------------------------------------------------------------------
// Google OAuth
const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';

export function googleConfigured(env: Env): boolean {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET &&
    !env.GOOGLE_CLIENT_ID.startsWith('replace-me') && !env.GOOGLE_CLIENT_SECRET.startsWith('replace-me'));
}

function redirectUri(req: Request, env: Env): string {
  if (env.GOOGLE_REDIRECT_URI) return env.GOOGLE_REDIRECT_URI;
  return new URL('/auth/google/callback', req.url).toString();
}

// Build the redirect to Google's consent screen + the state cookie to set.
export function googleAuthRedirect(req: Request, env: Env): { location: string; setCookie: string } {
  const state = randomToken(16);
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req, env),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return { location: `${GOOGLE_AUTH}?${params}`, setCookie: cookie(OAUTH_STATE_COOKIE, state, 600) };
}

export function oauthStateCookie(req: Request): string | undefined {
  return parseCookies(req)[OAUTH_STATE_COOKIE];
}

export function clearOauthStateCookie(): string {
  return cookie(OAUTH_STATE_COOKIE, '', 0);
}

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

// Exchange the authorization code for tokens and decode the id_token claims.
export async function exchangeGoogleCode(req: Request, env: Env, code: string): Promise<GoogleProfile> {
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(req, env),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`google token exchange failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error('no id_token in google response');
  const payloadB64 = data.id_token.split('.')[1];
  const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
  if (!claims.sub || !claims.email) throw new Error('google id_token missing sub/email');
  return {
    sub: String(claims.sub),
    email: String(claims.email).toLowerCase(),
    emailVerified: claims.email_verified === true || claims.email_verified === 'true',
    name: claims.name ? String(claims.name) : null,
  };
}
