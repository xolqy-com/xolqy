/**
 * Solution finder: retrieval over approved service content + a grounded
 * answer from Workers AI, with a rule-based fallback that is labelled as such.
 */
import { loadKnowledge, type KnowledgeChunk, type ServiceCard } from './knowledge';

export interface FinderServiceLink {
  slug: string;
  title: string;
  url: string;
}

export interface FinderReply {
  answer: string;
  services: FinderServiceLink[];
  /** 'ai' = grounded model answer; 'rules' = keyword matcher (no AI involved). */
  mode: 'ai' | 'rules';
  model?: string;
  sources: { title: string; section: string; url: string }[];
  note?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const FINDER_LIMITS = {
  maxInputChars: 600,
  maxTurns: 6,
  minIntervalMs: 1500,
  sessionTtlMs: 30 * 60 * 1000,
  topK: 5,
} as const;

const SYSTEM_PROMPT = `You are the solution finder on xolqy.com, the website of Xolqy, an independent agency that designs, builds, migrates, secures and manages businesses on Cloudflare.

Rules:
- Answer ONLY from the passages provided under CONTEXT. If the passages do not cover the question, say so plainly and suggest the person uses the enquiry form.
- Recommend one or two Xolqy services by name when relevant and explain in one or two sentences why.
- Never state or estimate prices, timelines in days or weeks, discounts, or guarantees. Pricing is per proposal.
- Never ask for or repeat confidential information (passwords, keys, personal data).
- Be concrete and direct. Plain text, no markdown, at most 120 words.
- Finish with a final line exactly in this format: SERVICES: slug-one, slug-two (use only slugs that appear in the context; write SERVICES: none if nothing fits).`;

type AiBinding = { run: (model: string, input: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown> };

function aiOptions(env: Env): Record<string, unknown> | undefined {
  return env.AI_GATEWAY_ID ? { gateway: { id: env.AI_GATEWAY_ID, skipCache: false, cacheTtl: 3600 } } : undefined;
}

export async function embed(env: Env, texts: string[]): Promise<number[][]> {
  const ai = env.AI as unknown as AiBinding;
  const res = (await ai.run(env.AI_EMBED_MODEL || '@cf/baai/bge-base-en-v1.5', { text: texts }, aiOptions(env))) as { data?: number[][] };
  if (!res?.data) throw new Error('embedding-failed');
  return res.data;
}

/** Hard filter for things that must never be sent to a model or stored. */
export function rejectsInput(text: string): string | null {
  if (/\b(sk_live|sk_test|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(text)) return 'secret';
  if (/\b(password|passwd|api[_ -]?key)\s*[:=]\s*\S{6,}/i.test(text)) return 'secret';
  if (/\b\d{13,19}\b/.test(text.replace(/[\s-]/g, ''))) return 'card';
  return null;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/** Rule-based matcher: keyword overlap against each service. No AI involved. */
export function rulesMatch(message: string, services: ServiceCard[]): { ranked: { card: ServiceCard; score: number }[] } {
  const tokens = tokenize(message);
  const text = ` ${tokens.join(' ')} `;
  const ranked = services
    .map((card) => {
      let score = 0;
      for (const kw of card.keywords) {
        if (kw.includes(' ')) {
          if (text.includes(` ${kw} `)) score += 3;
        } else if (tokens.includes(kw)) score += 2;
        else if (tokens.some((t) => t.startsWith(kw) || kw.startsWith(t) && t.length >= 5)) score += 1;
      }
      for (const w of tokenize(card.title)) if (tokens.includes(w)) score += 1;
      return { card, score };
    })
    .sort((a, b) => b.score - a.score);
  return { ranked };
}

export function rulesReply(message: string, services: ServiceCard[], note: string): FinderReply {
  const { ranked } = rulesMatch(message, services);
  const hits = ranked.filter((r) => r.score > 0).slice(0, 2);
  if (hits.length === 0) {
    return {
      mode: 'rules',
      answer:
        'The keyword matcher could not relate your description to a specific service. Try naming what you are building or moving (for example "WordPress migration", "slow shop", "support assistant"), or use the enquiry form and we will reply by email.',
      services: [{ slug: 'all', title: 'All services', url: '/services/' }],
      sources: [],
      note,
    };
  }
  const [first, second] = hits;
  let answer = `Keyword match (no AI involved): the closest service is ${first!.card.title}. ${first!.card.summary}`;
  if (second) answer += ` Also relevant: ${second.card.title}.`;
  answer += ' For pricing and scope, send a short brief through the enquiry form.';
  return {
    mode: 'rules',
    answer,
    services: hits.map((h) => ({ slug: h.card.slug, title: h.card.title, url: h.card.url })),
    sources: hits.map((h) => ({ title: h.card.title, section: 'overview', url: h.card.url })),
    note,
  };
}

interface Match {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

async function retrieve(env: Env, question: string, chunks: KnowledgeChunk[]): Promise<KnowledgeChunk[]> {
  const [vector] = await embed(env, [question]);
  if (!vector) throw new Error('embedding-empty');
  const res = (await env.VECTORIZE.query(vector, { topK: FINDER_LIMITS.topK, returnMetadata: 'none' })) as { matches: Match[] };
  const byId = new Map(chunks.map((c) => [c.id, c]));
  const out: KnowledgeChunk[] = [];
  for (const m of res.matches ?? []) {
    const c = byId.get(m.id);
    if (c && m.score >= 0.45) out.push(c);
  }
  return out;
}

function parseServicesLine(answer: string, known: Map<string, ServiceCard>): { text: string; slugs: string[] } {
  const lines = answer.trim().split('\n');
  const idx = lines.findIndex((l) => /^\s*SERVICES:/i.test(l));
  if (idx === -1) return { text: answer.trim(), slugs: [] };
  const slugs = (lines[idx] ?? '')
    .replace(/^\s*SERVICES:/i, '')
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => known.has(s));
  const text = [...lines.slice(0, idx), ...lines.slice(idx + 1)].join('\n').trim();
  return { text, slugs };
}

export async function aiReply(env: Env, history: ChatTurn[], message: string): Promise<FinderReply> {
  const { chunks, services } = await loadKnowledge();
  const known = new Map(services.map((s) => [s.slug, s]));
  const passages = await retrieve(env, message, chunks);

  const context = passages
    .map((p, i) => `[${i + 1}] service-slug: ${p.slug} | ${p.title} | ${p.section}\n${p.text}`)
    .join('\n\n');
  const available = services.map((s) => `${s.slug} = ${s.title}`).join('; ');

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nAvailable services (slug = name): ${available}` },
    ...history.slice(-4).map((t) => ({ role: t.role, content: t.content })),
    {
      role: 'user',
      content: `CONTEXT:\n${context || '(no relevant passages found)'}\n\nQUESTION: ${message}`,
    },
  ];

  const ai = env.AI as unknown as AiBinding;
  const model = env.AI_CHAT_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
  const res = (await ai.run(model, { messages, max_tokens: 320, temperature: 0.2 }, aiOptions(env))) as { response?: string };
  const raw = (res?.response ?? '').trim();
  if (!raw) throw new Error('empty-model-response');

  const { text, slugs } = parseServicesLine(raw, known);
  const linkSlugs = slugs.length ? slugs : [...new Set(passages.map((p) => p.slug).filter((s) => known.has(s)))].slice(0, 2);

  return {
    mode: 'ai',
    model,
    answer: text.slice(0, 1200),
    services: linkSlugs.map((slug) => ({ slug, title: known.get(slug)!.title, url: known.get(slug)!.url })),
    sources: passages.slice(0, 3).map((p) => ({ title: p.title, section: p.section, url: p.url })),
  };
}

export function aiAvailable(env: Env): { ok: boolean; reason?: string } {
  if (!('AI' in env) || !env.AI) return { ok: false, reason: 'Workers AI binding is absent' };
  if (!('VECTORIZE' in env) || !env.VECTORIZE) return { ok: false, reason: 'Vectorize binding is absent' };
  return { ok: true };
}

/** Full pipeline with fallback. Never throws for the caller. */
export async function answer(env: Env, history: ChatTurn[], message: string): Promise<FinderReply> {
  const { services } = await loadKnowledge();
  const avail = aiAvailable(env);
  if (!avail.ok) return rulesReply(message, services, `AI unavailable (${avail.reason}). Rule-based match shown instead.`);
  try {
    return await aiReply(env, history, message);
  } catch (err) {
    console.warn('finder: AI path failed, falling back to rules', { error: String(err).slice(0, 200) });
    return rulesReply(message, services, 'AI unavailable right now (the model or index did not respond). Rule-based match shown instead.');
  }
}
