import { z } from 'zod';
import { SERVICE_INTERESTS, BUDGET_RANGES } from '@/data/site';

const interests = SERVICE_INTERESTS.map((s) => s.value) as [string, ...string[]];
const budgets = BUDGET_RANGES.map((b) => b.value) as [string, ...string[]];

const trimmed = (max: number) => z.string().trim().max(max);

/** Validation for the project enquiry. Mirrors the client-side rules. */
export const EnquirySchema = z.object({
  name: trimmed(120).min(2, 'Please enter your name.'),
  email: trimmed(254)
    .toLowerCase()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please enter a valid email address.'),
  website: trimmed(200)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https?:\/\/[^\s]+\.[^\s]{2,}$/i.test(v), 'Please enter a full URL starting with https://'),
  service: z.enum(interests, { message: 'Please choose the service you are interested in.' }),
  budget: z
    .enum(budgets)
    .optional()
    .transform((v) => (v ? v : null)),
  brief: trimmed(2000)
    .min(40, 'Please write at least 40 characters so we can respond usefully.')
    .max(2000, 'Please keep the brief under 2000 characters.'),
  // Honeypot: must be empty.
  company: z.string().max(0, 'Spam check failed.').optional(),
  'cf-turnstile-response': z.string().max(2048).optional(),
});

export type EnquiryInput = z.infer<typeof EnquirySchema>;

/** Flatten zod issues into { field: message } for the form. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Very rough screen for secrets pasted into free text. We refuse rather than store them. */
export function looksLikeSecret(text: string): boolean {
  return (
    /\b(sk_live|sk_test|rk_live|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(text) ||
    /\b(password|passwd|api[_ -]?key|secret)\s*[:=]\s*\S{6,}/i.test(text)
  );
}
