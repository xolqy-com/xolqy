/**
 * FinderSession: one Durable Object per solution-finder conversation.
 * SQLite-backed storage holds the bounded history; the object serialises
 * requests per session, enforces turn and pacing limits, and expires itself
 * with an alarm. No personal data is intentionally collected; input that
 * looks like a secret or a card number is refused before it is stored.
 */
import { DurableObject } from 'cloudflare:workers';
import { answer, rejectsInput, FINDER_LIMITS, type ChatTurn, type FinderReply } from './finder';

export interface AskInput {
  message: string;
}

export type AskResult =
  | { ok: true; reply: FinderReply; turnsLeft: number }
  | { ok: false; error: 'too-fast' | 'session-exhausted' | 'input-too-long' | 'input-rejected' | 'empty'; message: string; turnsLeft: number };

export class FinderSession extends DurableObject<Env> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        mode TEXT,
        created_at INTEGER NOT NULL
      )`);
      this.sql.exec(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    });
  }

  private userTurns(): number {
    const row = this.sql.exec(`SELECT COUNT(*) AS n FROM messages WHERE role = 'user'`).one();
    return Number(row.n ?? 0);
  }

  private lastAt(): number {
    const row = this.sql.exec(`SELECT MAX(created_at) AS t FROM messages WHERE role = 'user'`).one();
    return Number(row.t ?? 0);
  }

  private history(): ChatTurn[] {
    return this.sql
      .exec<{ role: string; content: string }>(`SELECT role, content FROM messages ORDER BY id ASC`)
      .toArray()
      .map((r) => ({ role: r.role as ChatTurn['role'], content: r.content }));
  }

  private async touch(): Promise<void> {
    await this.ctx.storage.setAlarm(Date.now() + FINDER_LIMITS.sessionTtlMs);
  }

  async ask(input: AskInput): Promise<AskResult> {
    const message = (input.message ?? '').replace(/\s+/g, ' ').trim();
    const used = this.userTurns();
    const turnsLeft = Math.max(0, FINDER_LIMITS.maxTurns - used);

    if (!message) return { ok: false, error: 'empty', message: 'Describe the project in a sentence or two.', turnsLeft };
    if (message.length > FINDER_LIMITS.maxInputChars) {
      return { ok: false, error: 'input-too-long', message: `Please keep it under ${FINDER_LIMITS.maxInputChars} characters.`, turnsLeft };
    }
    if (turnsLeft <= 0) {
      return { ok: false, error: 'session-exhausted', message: 'This session has reached its limit. Start a new one, or send the enquiry form.', turnsLeft: 0 };
    }
    if (Date.now() - this.lastAt() < FINDER_LIMITS.minIntervalMs) {
      return { ok: false, error: 'too-fast', message: 'One moment, the previous answer is still being prepared.', turnsLeft };
    }
    const rejected = rejectsInput(message);
    if (rejected) {
      return {
        ok: false,
        error: 'input-rejected',
        message: rejected === 'card' ? 'Please do not enter card or account numbers.' : 'Please remove passwords, keys or other secrets from the message.',
        turnsLeft,
      };
    }

    const history = this.history();
    const now = Date.now();
    this.sql.exec(`INSERT INTO messages (role, content, created_at) VALUES ('user', ?, ?)`, message, now);

    const reply = await answer(this.env, history, message);

    this.sql.exec(`INSERT INTO messages (role, content, mode, created_at) VALUES ('assistant', ?, ?, ?)`, reply.answer, reply.mode, Date.now());
    await this.touch();

    return { ok: true, reply, turnsLeft: turnsLeft - 1 };
  }

  async summary(): Promise<{ turns: number; turnsLeft: number }> {
    const used = this.userTurns();
    return { turns: used, turnsLeft: Math.max(0, FINDER_LIMITS.maxTurns - used) };
  }

  /** Session expiry: wipe everything. */
  async alarm(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }
}
