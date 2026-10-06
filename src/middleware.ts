import { defineMiddleware } from 'astro:middleware';
import { SECURITY_HEADERS } from '@/server/http';

/**
 * Applies to on-demand rendered routes only (prerendered pages get headers
 * from public/_headers via Static Assets). Adds the security header set and
 * keeps private responses out of shared caches.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const { pathname } = context.url;
  if (pathname.startsWith('/api/') || pathname.startsWith('/admin')) {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!response.headers.has(k)) response.headers.set(k, v);
    if (pathname.startsWith('/admin')) {
      response.headers.set('cache-control', 'private, no-store');
      response.headers.set('x-robots-tag', 'noindex, nofollow');
      response.headers.set(
        'content-security-policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
      );
    }
  }
  return response;
});
