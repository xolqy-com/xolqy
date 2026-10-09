import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const faq = z.object({ q: z.string(), a: z.string() });

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    order: z.number().int(),
    /** Mono eyebrow above the headline. */
    eyebrow: z.string(),
    /** Page headline, specific to the service. */
    headline: z.string(),
    /** One or two sentences used in listings and meta descriptions. */
    summary: z.string().max(320),
    /** The outcome a client buys. */
    outcome: z.string(),
    problems: z.array(z.string()).min(3),
    deliverables: z.array(z.string()).min(4),
    stack: z.array(z.object({ name: z.string(), role: z.string() })).min(2),
    process: z.array(z.object({ stage: z.string(), output: z.string() })).length(4),
    faqs: z.array(faq).min(3),
    nextStep: z.object({ label: z.string(), href: z.string() }),
    /** Enquiry form option this service maps to. */
    interest: z.string(),
    /** Terms used by the rule-based finder fallback and for embedding chunks. */
    keywords: z.array(z.string()).min(4),
    relatedLabs: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(320),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    /** Business, technical or both. */
    audience: z.enum(['business', 'technical', 'both']),
    topics: z.array(z.string()).min(1),
    readingMinutes: z.number().int().positive(),
    relatedServices: z.array(z.string()).default([]),
    /** Drafts are excluded from routes, the index, the sitemap and the finder. */
    draft: z.boolean().default(false),
  }),
});

/** Client work. Only facts the client has agreed to publish; no invented results. */
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    client: z.string(),
    url: z.string().url(),
    sector: z.string(),
    location: z.string(),
    order: z.number().int(),
    eyebrow: z.string(),
    headline: z.string(),
    summary: z.string().max(320),
    /**
     * Screenshot of the live site (src/assets/work/<slug>.jpg, 1540x700). Served
     * through Cloudflare Images (see astro.config.mjs), so the repository holds
     * one master per project and every size and format is derived on request.
     */
    image: image().optional(),
    imageAlt: z.string().optional(),
    /**
     * Optional muted loop of the live site (public/media/work/<slug>.mp4,
     * 1100x500 H.264). Plays over the screenshot, which stays as its poster
     * and as the fallback for reduced motion and data saver.
     */
    video: z.string().optional(),
    /** What Xolqy was asked to do, in one sentence. */
    brief: z.string(),
    /** Cloudflare products and other key technologies, with their role. */
    stack: z.array(z.object({ name: z.string(), role: z.string() })).min(2),
    /** Capability tags shown on cards. */
    tags: z.array(z.string()).min(1),
    /** Qualitative outcomes only, never figures. */
    outcomes: z.array(z.string()).min(2),
    relatedServices: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * Wiki: short, factual entries on Cloudflare products and the terms around them.
 * Each entry points at the "pillar" service pages and insights it belongs to, so
 * definitional searches land on a page that links to the commercial ones.
 */
const wiki = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/wiki' }),
  schema: z.object({
    term: z.string(),
    category: z.enum(['Compute', 'Data', 'AI', 'Security', 'Delivery', 'Platform', 'Concepts']),
    /** One-paragraph definition, also used as the meta description. */
    summary: z.string().max(320),
    /** Official documentation URL. */
    docs: z.string().url().optional(),
    useWhen: z.string(),
    avoidWhen: z.string().optional(),
    /** Pricing model in one or two sentences, qualitative where figures change often. */
    pricing: z.string(),
    limits: z.string().optional(),
    /** Service slugs: the pillar pages this term supports. */
    pillars: z.array(z.string()).default([]),
    /** Insight slugs. */
    insights: z.array(z.string()).default([]),
    /** Other wiki slugs. */
    related: z.array(z.string()).default([]),
    updatedAt: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, insights, work, wiki };
