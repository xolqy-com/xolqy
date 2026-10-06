/**
 * D1 access for enquiries. Every statement is parameterised. No function here
 * ever logs personal data.
 */

export type EnquiryStatus = 'received' | 'queued' | 'processing' | 'notified' | 'notification_failed' | 'archived';

export interface EnquiryRow {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  website: string | null;
  service: string;
  budget: string | null;
  brief: string;
  status: EnquiryStatus;
  attempts: number;
  last_error: string | null;
  workflow_id: string | null;
  notified_at: string | null;
  acknowledged_at: string | null;
  country: string | null;
  colo: string | null;
  turnstile_hostname: string | null;
  turnstile_challenge_ts: string | null;
}

export interface EnquiryEventRow {
  id: number;
  enquiry_id: string;
  at: string;
  stage: string;
  detail: string | null;
}

export interface NewEnquiry {
  name: string;
  email: string;
  website: string | null;
  service: string;
  budget: string | null;
  brief: string;
  country: string | null;
  colo: string | null;
  turnstileHostname: string | null;
  turnstileChallengeTs: string | null;
}

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

export function makeReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let out = '';
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `XQ-${out}`;
}

export async function insertEnquiry(db: D1Database, input: NewEnquiry): Promise<{ id: string; reference: string }> {
  const id = crypto.randomUUID();
  // Retry on the (very unlikely) reference collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = makeReference();
    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO enquiries (id, reference, name, email, website, service, budget, brief, country, colo, turnstile_hostname, turnstile_challenge_ts)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`,
          )
          .bind(
            id,
            reference,
            input.name,
            input.email,
            input.website,
            input.service,
            input.budget,
            input.brief,
            input.country,
            input.colo,
            input.turnstileHostname,
            input.turnstileChallengeTs,
          ),
        db
          .prepare(`INSERT INTO enquiry_events (enquiry_id, stage, detail) VALUES (?1, 'received', 'Accepted after validation and Turnstile verification')`)
          .bind(id),
      ]);
      return { id, reference };
    } catch (err) {
      if (attempt === 2 || !String(err).includes('UNIQUE')) throw err;
    }
  }
  throw new Error('unreachable');
}

export async function getEnquiry(db: D1Database, id: string): Promise<EnquiryRow | null> {
  return (await db.prepare(`SELECT * FROM enquiries WHERE id = ?1`).bind(id).first<EnquiryRow>()) ?? null;
}

export async function getEnquiryByReference(db: D1Database, reference: string): Promise<EnquiryRow | null> {
  return (await db.prepare(`SELECT * FROM enquiries WHERE reference = ?1`).bind(reference).first<EnquiryRow>()) ?? null;
}

export async function listEvents(db: D1Database, enquiryId: string): Promise<EnquiryEventRow[]> {
  const { results } = await db
    .prepare(`SELECT id, enquiry_id, at, stage, detail FROM enquiry_events WHERE enquiry_id = ?1 ORDER BY id ASC`)
    .bind(enquiryId)
    .all<EnquiryEventRow>();
  return results;
}

export async function setStatus(
  db: D1Database,
  id: string,
  status: EnquiryStatus,
  extra: { lastError?: string | null; workflowId?: string; notifiedAt?: string; acknowledgedAt?: string; incrementAttempts?: boolean } = {},
  event?: { stage: string; detail?: string },
): Promise<void> {
  const sets: string[] = [`status = ?2`, `updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`];
  const binds: unknown[] = [id, status];
  let n = 3;
  if (extra.lastError !== undefined) {
    sets.push(`last_error = ?${n++}`);
    binds.push(extra.lastError);
  }
  if (extra.workflowId !== undefined) {
    sets.push(`workflow_id = ?${n++}`);
    binds.push(extra.workflowId);
  }
  if (extra.notifiedAt !== undefined) {
    sets.push(`notified_at = ?${n++}`);
    binds.push(extra.notifiedAt);
  }
  if (extra.acknowledgedAt !== undefined) {
    sets.push(`acknowledged_at = ?${n++}`);
    binds.push(extra.acknowledgedAt);
  }
  if (extra.incrementAttempts) sets.push(`attempts = attempts + 1`);

  const statements = [db.prepare(`UPDATE enquiries SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds)];
  if (event) {
    statements.push(
      db.prepare(`INSERT INTO enquiry_events (enquiry_id, stage, detail) VALUES (?1, ?2, ?3)`).bind(id, event.stage, event.detail ?? null),
    );
  }
  await db.batch(statements);
}

export async function addEvent(db: D1Database, id: string, stage: string, detail?: string): Promise<void> {
  await db.prepare(`INSERT INTO enquiry_events (enquiry_id, stage, detail) VALUES (?1, ?2, ?3)`).bind(id, stage, detail ?? null).run();
}

export interface EnquirySummary {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  website: string | null;
  service: string;
  budget: string | null;
  brief: string;
  status: EnquiryStatus;
  attempts: number;
  last_error: string | null;
  country: string | null;
}

export async function listEnquiries(db: D1Database, limit = 100): Promise<EnquirySummary[]> {
  const { results } = await db
    .prepare(
      `SELECT id, reference, created_at, updated_at, name, email, website, service, budget, brief, status, attempts, last_error, country
       FROM enquiries ORDER BY created_at DESC LIMIT ?1`,
    )
    .bind(limit)
    .all<EnquirySummary>();
  return results;
}

export async function countByStatus(db: D1Database): Promise<Record<string, number>> {
  const { results } = await db.prepare(`SELECT status, COUNT(*) AS n FROM enquiries GROUP BY status`).all<{ status: string; n: number }>();
  return Object.fromEntries(results.map((r) => [r.status, r.n]));
}
