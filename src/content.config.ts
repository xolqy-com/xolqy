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

export const collections = { services, insights };
