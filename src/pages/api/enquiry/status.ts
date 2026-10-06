/**
 * GET /api/enquiry/status?ref=XQ-XXXXXX
 * Public processing timeline for one enquiry, by its random reference. Returns
 * stages and timestamps only: never the name, email, website or brief.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getEnquiryByReference, listEvents } from '@/server/db';
import { json, error, clientKey, allowed } from '@/server/http';

export const prerender = false;

const STAGE_LABELS: Record<string, string> = {
  received: 'Accepted and stored in D1',
  queued: 'Queued for processing (Queues)',
  workflow_started: 'Workflow instance started',
  notify_attempt: 'Notifying staff (Workflow step)',
  notified: 'Staff notified by email',
  acknowledged: 'Acknowledgement sent to you',
  failed: 'Processing problem recorded (visible to staff)',
  ack_failed: 'Acknowledgement could not be sent',
  archived: 'Archived by staff',
};

export const GET: APIRoute = async ({ url, request }) => {
  const ref = (url.searchParams.get('ref') ?? '').trim().toUpperCase();
  if (!/^XQ-[A-Z2-9]{6}$/.test(ref)) return error(400, 'bad-reference', 'A reference looks like XQ-7F3K2A.');

  // Reuse the finder limiter: references are random, but lookups are still bounded.
  if (!(await allowed(env.FINDER_LIMITER, `status:${await clientKey(request)}`))) {
    return error(429, 'rate-limited', 'Too many lookups. Please wait a minute.');
  }

  const row = await getEnquiryByReference(env.DB, ref);
  if (!row) return error(404, 'not-found', 'No enquiry with that reference.');
  const events = await listEvents(env.DB, row.id);

  return json({
    ok: true,
    reference: row.reference,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attempts: row.attempts,
    hasError: row.status === 'notification_failed' || row.last_error !== null,
    timeline: events.map((e) => ({
      at: e.at,
      stage: e.stage,
      label: STAGE_LABELS[e.stage] ?? e.stage,
      // Detail is operational (ids, codes), never personal; failures show the code only.
      detail: e.stage === 'failed' || e.stage === 'ack_failed' ? (e.detail ?? '').split(':')[0] : e.detail,
    })),
  });
};
