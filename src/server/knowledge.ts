/**
 * The finder's knowledge base: approved service content only, split into
 * passages small enough to embed and to quote. Built from the content
 * collection, so there is exactly one source of truth for what the assistant
 * may say. Drafts are excluded.
 */
import { getCollection } from 'astro:content';
import { HOME_FAQS } from '@/data/content';
import { serviceHref } from '@/lib/service-href';

export interface KnowledgeChunk {
  /** Stable id: <slug>:<section>:<n> */
  id: string;
  slug: string;
  title: string;
  section: string;
  url: string;
  text: string;
  keywords: string[];
}

export interface ServiceCard {
  slug: string;
  title: string;
  summary: string;
  url: string;
  keywords: string[];
}

let cache: { chunks: KnowledgeChunk[]; services: ServiceCard[] } | null = null;

function clean(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> text
    .replace(/[*_`>#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitBody(body: string): { heading: string; text: string }[] {
  const parts: { heading: string; text: string }[] = [];
  const sections = body.split(/^##\s+/m);
  for (const s of sections) {
    const [first, ...rest] = s.split('\n');
    const heading = first?.trim() ?? '';
    const text = clean(rest.join('\n'));
    if (text.length > 40) parts.push({ heading: heading || 'Overview', text });
  }
  return parts;
}

export async function loadKnowledge(): Promise<{ chunks: KnowledgeChunk[]; services: ServiceCard[] }> {
  if (cache) return cache;
  const services = (await getCollection('services', ({ data }) => !data.draft)).sort((a, b) => a.data.order - b.data.order);

  const chunks: KnowledgeChunk[] = [];
  const cards: ServiceCard[] = [];

  for (const s of services) {
    const slug = s.id;
    const url = serviceHref(slug);
    const title = s.data.title;
    const keywords = s.data.keywords.map((k) => k.toLowerCase());
    cards.push({ slug, title, summary: s.data.summary, url, keywords });

    const push = (section: string, text: string, n = 0) => {
      const t = text.trim();
      if (t.length < 30) return;
      chunks.push({ id: `${slug}:${section}:${n}`, slug, title, section, url, text: t.slice(0, 1800), keywords });
    };

    push('overview', `${title}. ${s.data.headline} ${s.data.summary} Outcome: ${s.data.outcome}`);
    push('problems', `Problems ${title} solves: ${s.data.problems.join(' ')}`);
    push('deliverables', `Deliverables of ${title}: ${s.data.deliverables.join('; ')}.`);
    push('stack', `Cloudflare products used in ${title}: ${s.data.stack.map((t) => `${t.name} (${t.role})`).join(' ')}`);
    push('process', `Process for ${title}: ${s.data.process.map((p) => `${p.stage}: ${p.output}`).join(' ')}`);
    s.data.faqs.forEach((f, i) => push('faq', `Q: ${f.q} A: ${f.a}`, i));
    splitBody(s.body ?? '').forEach((sec, i) => push(`body-${i}`, `${sec.heading}: ${sec.text}`, i));
  }

  // Wiki entries: one passage per term, so the finder can define products and point to the pillar page.
  const wiki = await getCollection('wiki', ({ data }) => !data.draft);
  for (const w of wiki) {
    chunks.push({
      id: `wiki:${w.id}:0`,
      slug: `wiki-${w.id}`,
      title: w.data.term,
      section: 'definition',
      url: `/wiki/${w.id}/`,
      text: `${w.data.term}: ${w.data.summary} Use it when: ${w.data.useWhen} Pricing: ${w.data.pricing}`.slice(0, 1800),
      keywords: [w.data.term.toLowerCase(), ...w.data.related],
    });
  }

  HOME_FAQS.forEach((f, i) => {
    chunks.push({
      id: `general:faq:${i}`,
      slug: 'general',
      title: 'General questions',
      section: 'faq',
      url: '/#faqs',
      text: `Q: ${f.q} A: ${f.a}`,
      keywords: [],
    });
  });

  cache = { chunks, services: cards };
  return cache;
}
