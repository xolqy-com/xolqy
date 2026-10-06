/**
 * POST /admin/actions  (form-encoded: action=reindex | action=archive&id=...)
 * Staff actions behind Cloudflare Access. The token is verified here as well
 * as on the page, because a POST must never rely on the page having checked.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { verifyAccess } from '@/server/access';
import { reindexKnowledge } from '@/server/reindex';
import { setStatus } from '@/server/db';
import { error, sameOrigin } from '@/server/http';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const access = await verifyAccess(request, env as Env & { ACCESS_DEV_BYPASS?: string });
  if (!access.ok) return error(access.status, 'access', access.reason);
  if (!sameOrigin(request, env.SITE_URL)) return error(403, 'bad-origin', 'Cross-site requests are not accepted.');

  const fd = await request.formData();
  const action = String(fd.get('action') ?? '');

  if (action === 'reindex') {
    const result = await reindexKnowledge(env);
    const q = new URLSearchParams(result.ok ? { reindex: `ok:${result.indexed}:${result.deleted}` } : { reindex: `error:${result.error ?? 'unknown'}` });
    return redirect(`/admin/?${q}`, 303);
  }

  if (action === 'archive') {
    const id = String(fd.get('id') ?? '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return error(400, 'bad-id', 'Invalid enquiry id.');
    await setStatus(env.DB, id, 'archived', {}, { stage: 'archived', detail: `by ${access.identity.email}` });
    return redirect('/admin/?archived=1', 303);
  }

  return error(400, 'unknown-action', 'Unknown action.');
};
