/**
 * Cloudflare Health Check: a quick, public, read-only look at a domain from
 * the outside. It makes at most three HTTP requests to the site and a handful
 * of DNS-over-HTTPS lookups, and reports what any browser or resolver could
 * see. It is a teaser for the paid audit, not a substitute for it, and the
 * page says so.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface CheckResult {
  id: string;
  group: 'Connection' | 'Cloudflare' | 'Headers' | 'DNS and email';
  label: string;
  status: CheckStatus;
  detail: string;
  /** Points available; info checks carry 0. */
  weight: number;
  /** Optional guide on this site that explains the fix. */
  guide?: string;
}

export interface HealthReport {
  domain: string;
  checkedAt: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  behindCloudflare: boolean;
  checks: CheckResult[];
}

const DOMAIN_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Accepts "Example.com", "https://www.example.com/path" and returns the hostname, or null. */
export function normaliseDomain(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s || s.length > 300) return null;
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  s = s.split(/[/?#]/)[0] ?? '';
  if (s.includes('@') || s.includes(':')) return null;
  s = s.replace(/\.$/, '');
  if (!DOMAIN_RE.test(s)) return null;
  if (/(^|\.)(localhost|local|internal|test|example|invalid)$/.test(s)) return null;
  return s;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

interface DohAnswer { name: string; type: number; data: string }
interface DohResponse { Status: number; AD?: boolean; Answer?: DohAnswer[] }

async function doh(name: string, type: string): Promise<DohResponse | null> {
  try {
    const res = await withTimeout(
      fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}&do=1`, {
        headers: { accept: 'application/dns-json' },
      }),
      4000,
    );
    if (!res.ok) return null;
    return (await res.json()) as DohResponse;
  } catch {
    return null;
  }
}

const txt = (r: DohResponse | null) => (r?.Answer ?? []).filter((a) => a.type === 16).map((a) => a.data.replace(/^"|"$/g, '').replace(/"\s*"/g, ''));

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

async function get(url: string, fetcher: Fetcher = fetch): Promise<{ res: Response; ms: number } | null> {
  const t0 = Date.now();
  try {
    const res = await withTimeout(
      fetcher(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'user-agent': 'XolqyHealthCheck/1.0 (+https://xolqy.com/health-check/)', accept: 'text/html,*/*' },
      }),
      8000,
    );
    // Only headers are needed; release the body.
    res.body?.cancel().catch(() => {});
    return { res, ms: Date.now() - t0 };
  } catch {
    return null;
  }
}

/** Follow up to four same-site redirects over HTTPS and return the final response. */
async function fetchHome(domain: string, fetcher: Fetcher = fetch): Promise<{ res: Response; ms: number; finalUrl: string } | null> {
  let url = `https://${domain}/`;
  for (let i = 0; i < 5; i++) {
    const r = await get(url, fetcher);
    if (!r) return null;
    const loc = r.res.headers.get('location');
    if (r.res.status >= 300 && r.res.status < 400 && loc) {
      const next = new URL(loc, url);
      if (next.protocol !== 'https:') return { ...r, finalUrl: url };
      const host = next.hostname;
      if (host !== domain && host !== `www.${domain}` && `www.${host}` !== domain) return { ...r, finalUrl: next.toString() };
      url = next.toString();
      continue;
    }
    return { ...r, finalUrl: url };
  }
  return null;
}

/**
 * `self`: when the domain being checked is this site, a Worker cannot fetch its
 * own hostname (Cloudflare sends the subrequest to an origin that does not
 * exist and answers 523). The caller passes a service binding to this Worker
 * instead, and the plain-HTTP redirect, which is a zone setting the binding
 * cannot see, is reported as information.
 */
export async function runHealthCheck(domain: string, opts: { self?: Fetcher } = {}): Promise<HealthReport> {
  const checks: CheckResult[] = [];
  const add = (c: CheckResult) => checks.push(c);

  const [home, plain, a, aaaa, caa, apexTxt, dmarc, ns] = await Promise.all([
    fetchHome(domain, opts.self),
    opts.self ? Promise.resolve(null) : get(`http://${domain}/`),
    doh(domain, 'A'),
    doh(domain, 'AAAA'),
    doh(domain, 'CAA'),
    doh(domain, 'TXT'),
    doh(`_dmarc.${domain}`, 'TXT'),
    doh(domain, 'NS'),
  ]);

  // ---- Connection --------------------------------------------------------------
  if (home) {
    add({ id: 'https', group: 'Connection', label: 'HTTPS', status: home.res.status >= 520 && home.res.status <= 530 ? 'fail' : home.res.status < 500 ? 'pass' : 'warn', detail: `The site answers over HTTPS (HTTP ${home.res.status}) at ${home.finalUrl.replace(/\/$/, '')}.`, weight: 15 });
    add({ id: 'ttfb', group: 'Connection', label: 'Response time', status: 'info', detail: `First response in about ${home.ms} ms, measured once from a Cloudflare data centre. One request is an indication, not a benchmark.`, weight: 0 });
  } else {
    add({ id: 'https', group: 'Connection', label: 'HTTPS', status: 'fail', detail: 'No answer over HTTPS within 8 seconds, or the certificate was rejected.', weight: 15 });
  }

  if (plain) {
    const loc = plain.res.headers.get('location') ?? '';
    const redirects = plain.res.status >= 300 && plain.res.status < 400 && loc.startsWith('https://');
    add({ id: 'redirect', group: 'Connection', label: 'HTTP to HTTPS redirect', status: redirects ? 'pass' : 'fail', detail: redirects ? `Plain HTTP is redirected to HTTPS (${plain.res.status}).` : 'Plain HTTP is served without redirecting to HTTPS, so a mistyped link stays unencrypted.', weight: 10 });
  } else {
    add({ id: 'redirect', group: 'Connection', label: 'HTTP to HTTPS redirect', status: 'info', detail: opts.self ? 'Checked from inside this site, where the zone redirect cannot be observed.' : 'Plain HTTP did not answer, which is acceptable if HSTS is set.', weight: 0 });
  }

  const h = home?.res.headers ?? new Headers();
  // This site runs on Workers, so it is behind Cloudflare by construction.
  const behindCloudflare = Boolean(opts.self) || (h.get('server') ?? '').toLowerCase() === 'cloudflare' || h.has('cf-ray');

  const altSvc = h.get('alt-svc') ?? '';
  if (opts.self) add({ id: 'http3', group: 'Connection', label: 'HTTP/3', status: 'info', detail: 'A zone setting, not visible from inside this site.', weight: 0 });
  else add({ id: 'http3', group: 'Connection', label: 'HTTP/3', status: /h3/.test(altSvc) ? 'pass' : 'warn', detail: /h3/.test(altSvc) ? 'HTTP/3 is advertised, which helps visitors on mobile networks.' : 'HTTP/3 is not advertised. On Cloudflare it is one switch under Speed.', weight: 5 });

  // ---- Cloudflare ----------------------------------------------------------------
  add({
    id: 'cloudflare',
    group: 'Cloudflare',
    label: 'Served through Cloudflare',
    status: behindCloudflare ? 'pass' : 'fail',
    detail: behindCloudflare ? 'Requests pass through Cloudflare: edge caching, DDoS protection and the WAF are available.' : 'The site is not proxied through Cloudflare, so it has no edge cache, WAF or DDoS protection from it.',
    weight: 15,
  });
  if (behindCloudflare) {
    const cache = h.get('cf-cache-status') ?? 'none';
    add({ id: 'cache', group: 'Cloudflare', label: 'Homepage cache status', status: 'info', detail: `cf-cache-status: ${cache}. ${cache === 'HIT' ? 'The homepage is served from the edge cache.' : cache === 'DYNAMIC' ? 'HTML is fetched from the origin on every request, which is normal unless pages are cacheable.' : 'Worth reviewing in an audit.'}`, weight: 0 });
  }
  const nsHosts = (ns?.Answer ?? []).filter((x) => x.type === 2).map((x) => x.data.replace(/\.$/, ''));
  if (nsHosts.length) {
    const onCf = nsHosts.every((n) => n.endsWith('.ns.cloudflare.com'));
    add({ id: 'ns', group: 'Cloudflare', label: 'DNS hosted on Cloudflare', status: 'info', detail: onCf ? 'Authoritative DNS is on Cloudflare.' : `Nameservers: ${nsHosts.slice(0, 3).join(', ')}.`, weight: 0 });
  }

  // ---- Headers -------------------------------------------------------------------
  if (home) {
    const hsts = h.get('strict-transport-security') ?? '';
    const maxAge = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0);
    add({ id: 'hsts', group: 'Headers', label: 'HSTS', status: maxAge >= 15552000 ? 'pass' : hsts ? 'warn' : 'fail', detail: hsts ? `Strict-Transport-Security max-age is ${Math.round(maxAge / 86400)} days${maxAge >= 15552000 ? '.' : '; six months or more is recommended.'}` : 'No Strict-Transport-Security header, so browsers may still try plain HTTP first.', weight: 8 });

    const csp = h.get('content-security-policy') ?? '';
    add({ id: 'csp', group: 'Headers', label: 'Content-Security-Policy', status: csp ? 'pass' : 'warn', detail: csp ? 'A Content-Security-Policy is set, limiting where scripts can load from.' : 'No Content-Security-Policy. It is the main browser-side defence against injected scripts.', weight: 8 });

    const nosniff = (h.get('x-content-type-options') ?? '').toLowerCase() === 'nosniff';
    add({ id: 'nosniff', group: 'Headers', label: 'X-Content-Type-Options', status: nosniff ? 'pass' : 'warn', detail: nosniff ? 'nosniff is set.' : 'Missing nosniff, so browsers may guess file types.', weight: 4 });

    const frame = Boolean(h.get('x-frame-options')) || /frame-ancestors/i.test(csp);
    add({ id: 'frame', group: 'Headers', label: 'Clickjacking protection', status: frame ? 'pass' : 'warn', detail: frame ? 'The site cannot be framed by other sites.' : 'Neither X-Frame-Options nor CSP frame-ancestors is set, so other sites can frame these pages.', weight: 4 });

    const referrer = h.get('referrer-policy');
    add({ id: 'referrer', group: 'Headers', label: 'Referrer-Policy', status: referrer ? 'pass' : 'warn', detail: referrer ? `Referrer-Policy: ${referrer}.` : 'No Referrer-Policy; full URLs may leak to other sites.', weight: 3 });
  }

  // ---- DNS and email ------------------------------------------------------------
  const unknown = (id: string, label: string) =>
    add({ id, group: 'DNS and email', label, status: 'info', detail: 'Could not be looked up just now; run the check again in a minute.', weight: 0 });

  if (!a) unknown('dnssec', 'DNSSEC');
  if (a) {
    add({ id: 'dnssec', group: 'DNS and email', label: 'DNSSEC', status: a.AD ? 'pass' : 'warn', detail: a.AD ? 'DNS answers are signed and validated.' : 'DNS answers are not signed. On Cloudflare DNSSEC is one click plus a record at the registrar.', weight: 8, guide: '/insights/dnssec-on-cloudflare/' });
  }
  const hasAaaa = (aaaa?.Answer ?? []).some((x) => x.type === 28);
  if (!aaaa) unknown('ipv6', 'IPv6');
  else add({ id: 'ipv6', group: 'DNS and email', label: 'IPv6', status: hasAaaa ? 'pass' : 'warn', detail: hasAaaa ? 'The domain has IPv6 addresses.' : 'No IPv6 address. Cloudflare-proxied sites get IPv6 automatically.', weight: 3 });

  const hasCaa = (caa?.Answer ?? []).some((x) => x.type === 257);
  if (!caa) unknown('caa', 'CAA records');
  else add({ id: 'caa', group: 'DNS and email', label: 'CAA records', status: hasCaa ? 'pass' : 'warn', detail: hasCaa ? 'CAA records limit which authorities may issue certificates.' : 'No CAA records, so any certificate authority may issue for this domain.', weight: 4 });

  const spf = txt(apexTxt).find((t) => t.toLowerCase().startsWith('v=spf1'));
  if (!apexTxt) unknown('spf', 'SPF');
  else add({ id: 'spf', group: 'DNS and email', label: 'SPF', status: spf ? 'pass' : 'fail', detail: spf ? `SPF is published (${spf.length > 90 ? `${spf.slice(0, 90)}…` : spf}).` : 'No SPF record: anyone can claim to send email from this domain.', weight: 6 });

  const dm = txt(dmarc).find((t) => t.toLowerCase().startsWith('v=dmarc1'));
  const policy = /;\s*p=(\w+)/i.exec(dm ?? '')?.[1]?.toLowerCase();
  if (!dmarc) unknown('dmarc', 'DMARC');
  else add({
    id: 'dmarc',
    group: 'DNS and email',
    label: 'DMARC',
    status: !dm ? 'fail' : policy === 'none' ? 'warn' : 'pass',
    detail: !dm ? 'No DMARC record, so receiving servers have no instruction for mail that fails SPF or DKIM.' : policy === 'none' ? 'DMARC is published with p=none: it reports but does not stop spoofed mail.' : `DMARC is enforced (p=${policy}).`,
    weight: 6,
  });

  // ---- Score -----------------------------------------------------------------------
  const scored = checks.filter((c) => c.weight > 0);
  const total = scored.reduce((s, c) => s + c.weight, 0);
  const got = scored.reduce((s, c) => s + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight / 2 : 0), 0);
  const score = total ? Math.round((got / total) * 100) : 0;
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return { domain, checkedAt: new Date().toISOString(), score, grade, behindCloudflare, checks };
}
