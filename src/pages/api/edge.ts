/**
 * GET /api/edge
 * Real request metadata attached by Cloudflare for the Labs "edge inspector".
 * One response describes one request from one place; it is not a latency or
 * uptime measurement, and the page says so.
 */
import type { APIRoute } from 'astro';
import { json } from '@/server/http';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const cf = ((request as Request & { cf?: IncomingRequestCfProperties }).cf ?? {}) as Partial<IncomingRequestCfProperties> & Record<string, unknown>;
  const pick = (k: string) => {
    const v = cf[k];
    return typeof v === 'string' || typeof v === 'number' ? v : null;
  };
  return json(
    {
      ok: true,
      servedAt: new Date().toISOString(),
      servedBy: {
        colo: pick('colo'),
        city: pick('city'),
        region: pick('region'),
        country: pick('country'),
        continent: pick('continent'),
        timezone: pick('timezone'),
      },
      connection: {
        httpProtocol: pick('httpProtocol'),
        tlsVersion: pick('tlsVersion'),
        tlsCipher: pick('tlsCipher'),
        asn: pick('asn'),
        asOrganization: pick('asOrganization'),
        clientAcceptEncoding: pick('clientAcceptEncoding'),
      },
      rayId: request.headers.get('cf-ray'),
      local: !request.headers.get('cf-ray'),
      note: 'Metadata for this single request only. One request does not establish global latency or uptime.',
    },
    { headers: { vary: 'Accept-Encoding' } },
  );
};
