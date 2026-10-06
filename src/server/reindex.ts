/**
 * (Re)builds the Vectorize index from the approved service content.
 * Idempotent: vectors are upserted by stable id, and ids that disappeared
 * since the last run are deleted. The manifest of indexed ids lives in KV.
 */
import { loadKnowledge } from './knowledge';
import { embed } from './finder';

export interface ReindexResult {
  ok: boolean;
  indexed: number;
  deleted: number;
  dimensions?: number;
  at: string;
  error?: string;
}

const MANIFEST_KEY = 'knowledge:manifest';

export async function reindexKnowledge(env: Env): Promise<ReindexResult> {
  const at = new Date().toISOString();
  try {
    const { chunks } = await loadKnowledge();
    const previous = ((await env.CONFIG.get(MANIFEST_KEY, 'json')) as { ids?: string[] } | null)?.ids ?? [];

    let dimensions = 0;
    const BATCH = 16;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const slice = chunks.slice(i, i + BATCH);
      const vectors = await embed(env, slice.map((c) => c.text));
      dimensions = vectors[0]?.length ?? dimensions;
      await env.VECTORIZE.upsert(
        slice.map((c, j) => ({
          id: c.id,
          values: vectors[j]!,
          metadata: { slug: c.slug, title: c.title, section: c.section, url: c.url },
        })),
      );
    }

    const current = new Set(chunks.map((c) => c.id));
    const stale = previous.filter((id) => !current.has(id));
    if (stale.length) await env.VECTORIZE.deleteByIds(stale);

    await env.CONFIG.put(MANIFEST_KEY, JSON.stringify({ ids: [...current], at, count: current.size, dimensions }));
    return { ok: true, indexed: current.size, deleted: stale.length, dimensions, at };
  } catch (err) {
    return { ok: false, indexed: 0, deleted: 0, at, error: String(err).slice(0, 300) };
  }
}

export async function lastReindex(env: Env): Promise<{ at: string; count: number; dimensions: number } | null> {
  try {
    const m = (await env.CONFIG.get(MANIFEST_KEY, 'json')) as { at: string; count: number; dimensions: number } | null;
    return m ?? null;
  } catch {
    return null;
  }
}
