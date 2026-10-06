/**
 * Cloudflare Access (Zero Trust) token validation for the staff view.
 * Access puts a signed JWT in the Cf-Access-Jwt-Assertion header; we verify
 * signature (RS256 against the team's JWKS), issuer, audience and expiry on
 * every request. If Access is not configured, the staff view fails closed.
 * https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export interface AccessIdentity {
  email: string;
  sub: string;
  issuedAt?: number;
  expiresAt?: number;
  /** true only for the local development bypass; never in production. */
  devBypass?: boolean;
}

export type AccessResult = { ok: true; identity: AccessIdentity } | { ok: false; status: 401 | 403 | 503; reason: string };

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(teamDomain: string) {
  let set = jwksCache.get(teamDomain);
  if (!set) {
    set = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`), { cooldownDuration: 30_000, cacheMaxAge: 600_000 });
    jwksCache.set(teamDomain, set);
  }
  return set;
}

function normaliseTeamDomain(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export async function verifyAccess(request: Request, env: Env & { ACCESS_DEV_BYPASS?: string }): Promise<AccessResult> {
  const teamDomain = normaliseTeamDomain(env.ACCESS_TEAM_DOMAIN || '');
  const aud = env.ACCESS_AUD || '';

  if (!teamDomain || !aud) {
    // Local development only: an explicit bypass with a visible banner.
    if (import.meta.env.DEV && env.ACCESS_DEV_BYPASS === 'true') {
      return { ok: true, identity: { email: 'dev@localhost', sub: 'dev', devBypass: true } };
    }
    return { ok: false, status: 503, reason: 'Access is not configured (ACCESS_TEAM_DOMAIN / ACCESS_AUD). The staff view is closed until it is.' };
  }

  const token = request.headers.get('cf-access-jwt-assertion') ?? readCookie(request, 'CF_Authorization');
  if (!token) return { ok: false, status: 401, reason: 'No Access token on the request. Open this page through Cloudflare Access.' };

  try {
    const { payload } = await jwtVerify(token, jwks(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience: aud,
      algorithms: ['RS256'],
    });
    const email = typeof (payload as JWTPayload & { email?: unknown }).email === 'string' ? (payload as { email: string }).email : '';
    if (!email || !payload.sub) return { ok: false, status: 403, reason: 'Token verified but carries no identity.' };
    return { ok: true, identity: { email, sub: payload.sub, issuedAt: payload.iat, expiresAt: payload.exp } };
  } catch (err) {
    return { ok: false, status: 403, reason: `Access token rejected: ${String((err as Error)?.message ?? err).slice(0, 120)}` };
  }
}

function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  for (const part of cookie.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}
