/**
 * Email notifications through the Cloudflare Email Service binding.
 * The binding is only usable once the sending domain is onboarded in the
 * dashboard and NOTIFY_EMAIL / EMAIL_FROM are set. Everything else fails
 * loudly with a code the Workflow records on the enquiry.
 */
import type { EnquiryRow } from './db';
import { escapeHtml } from './http';

export class EmailNotConfiguredError extends Error {
  readonly code = 'EMAIL_NOT_CONFIGURED';
  constructor(detail: string) {
    super(`EMAIL_NOT_CONFIGURED: ${detail}`);
  }
}

export function emailConfig(env: Env): { ok: true; from: string; fromName: string; notify: string } | { ok: false; reason: string } {
  if (!('EMAIL' in env) || !env.EMAIL) return { ok: false, reason: 'EMAIL binding is absent' };
  if (!env.EMAIL_FROM) return { ok: false, reason: 'EMAIL_FROM is empty' };
  if (!env.NOTIFY_EMAIL) return { ok: false, reason: 'NOTIFY_EMAIL is empty' };
  return { ok: true, from: env.EMAIL_FROM, fromName: env.EMAIL_FROM_NAME || 'Xolqy', notify: env.NOTIFY_EMAIL };
}

const LABELS: Record<string, string> = {
  'websites-and-applications': 'Websites & Applications',
  'cloudflare-migration': 'Cloudflare Migration',
  'performance-and-delivery': 'Performance & Delivery',
  'security-and-zero-trust': 'Security & Zero Trust',
  'ai-and-automation': 'AI & Automation',
  'managed-cloudflare': 'Managed Cloudflare',
  audit: 'Cloudflare Audit',
  'not-sure': 'Not sure yet',
};

export function serviceLabel(value: string): string {
  return LABELS[value] ?? value;
}

/** Staff notification: the full enquiry, for the inbox that handles replies. */
export async function sendStaffNotification(env: Env, enquiry: EnquiryRow, siteUrl: string): Promise<string> {
  const cfg = emailConfig(env);
  if (!cfg.ok) throw new EmailNotConfiguredError(cfg.reason);

  const subject = `New enquiry ${enquiry.reference}: ${serviceLabel(enquiry.service)} from ${enquiry.name}`;
  const lines = [
    `Reference: ${enquiry.reference}`,
    `Received: ${enquiry.created_at}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Website: ${enquiry.website ?? '(not given)'}`,
    `Service: ${serviceLabel(enquiry.service)}`,
    `Budget: ${enquiry.budget ?? '(not given)'}`,
    `Country / location: ${enquiry.country ?? '?'} / ${enquiry.colo ?? '?'}`,
    '',
    'Brief:',
    enquiry.brief,
    '',
    `Staff view: ${siteUrl}/admin/`,
  ];
  const text = lines.join('\n');
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0a0a0a">
<h2 style="margin:0 0 12px">New enquiry ${escapeHtml(enquiry.reference)}</h2>
<table cellpadding="4" style="border-collapse:collapse">
<tr><td><b>Name</b></td><td>${escapeHtml(enquiry.name)}</td></tr>
<tr><td><b>Email</b></td><td><a href="mailto:${escapeHtml(enquiry.email)}">${escapeHtml(enquiry.email)}</a></td></tr>
<tr><td><b>Website</b></td><td>${enquiry.website ? escapeHtml(enquiry.website) : '(not given)'}</td></tr>
<tr><td><b>Service</b></td><td>${escapeHtml(serviceLabel(enquiry.service))}</td></tr>
<tr><td><b>Budget</b></td><td>${escapeHtml(enquiry.budget ?? '(not given)')}</td></tr>
<tr><td><b>Received</b></td><td>${escapeHtml(enquiry.created_at)}</td></tr>
</table>
<h3>Brief</h3>
<p style="white-space:pre-wrap">${escapeHtml(enquiry.brief)}</p>
<p><a href="${escapeHtml(siteUrl)}/admin/">Open the staff view</a></p>
</body></html>`;

  const result = await env.EMAIL.send({
    from: { name: cfg.fromName, email: cfg.from },
    to: cfg.notify,
    replyTo: enquiry.email,
    subject,
    text,
    html,
    headers: { 'X-Xolqy-Reference': enquiry.reference },
  });
  return result.messageId;
}

/** Optional acknowledgement to the person who enquired. Contains no details beyond the reference. */
export async function sendAcknowledgement(env: Env, enquiry: EnquiryRow, siteUrl: string): Promise<string> {
  const cfg = emailConfig(env);
  if (!cfg.ok) throw new EmailNotConfiguredError(cfg.reason);

  const text = [
    `Hello ${enquiry.name},`,
    '',
    `Thank you for your enquiry. Your reference is ${enquiry.reference}.`,
    'We have received it and will reply by email with questions or a proposal.',
    '',
    `You can follow its processing at ${siteUrl}/labs/#enquiry-pipeline using the reference.`,
    '',
    'Xolqy',
    siteUrl,
  ].join('\n');

  const result = await env.EMAIL.send({
    from: { name: cfg.fromName, email: cfg.from },
    to: { name: enquiry.name, email: enquiry.email },
    subject: `We received your enquiry (${enquiry.reference})`,
    text,
    headers: { 'X-Xolqy-Reference': enquiry.reference, 'Auto-Submitted': 'auto-replied' },
  });
  return result.messageId;
}
