/**
 * GET /api/resources/<key>
 * Streams an allow-listed object from R2 with ETag validation and public
 * cache headers. Keys not in src/data/resources.ts are never looked up.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { findResource } from '@/data/resources';
import { error, SECURITY_HEADERS } from '@/server/http';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const item = findResource(params.key ?? '');
  if (!item) return error(404, 'not-found', 'No such resource.');

  const ifNoneMatch = request.headers.get('if-none-match');
  const object = await env.RESOURCES.get(item.key, { onlyIf: ifNoneMatch ? { etagDoesNotMatch: ifNoneMatch.replace(/^W\//, '').replace(/"/g, '') } : undefined });
  if (!object) {
    // Either not uploaded yet or the stored object is unreadable.
    const head = await env.RESOURCES.head(item.key);
    if (!head) return error(404, 'not-uploaded', 'This resource has not been uploaded to R2 yet (see README > Resources).');
    return new Response(null, { status: 304, headers: { etag: head.httpEtag, 'cache-control': 'public, max-age=3600' } });
  }
  if (!('body' in object) || !object.body) {
    return new Response(null, { status: 304, headers: { etag: object.httpEtag, 'cache-control': 'public, max-age=3600' } });
  }

  const headers = new Headers(SECURITY_HEADERS);
  headers.set('content-type', item.contentType);
  headers.set('etag', object.httpEtag);
  headers.set('content-length', String(object.size));
  headers.set('cache-control', 'public, max-age=3600, stale-while-revalidate=86400');
  headers.set('content-disposition', `attachment; filename="${item.filename}"`);
  headers.set('x-resource-source', 'r2');
  return new Response(object.body, { status: 200, headers });
};
