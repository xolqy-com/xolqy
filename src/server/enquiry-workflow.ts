/**
 * EnquiryWorkflow: durable, retried processing of one enquiry.
 *
 *   load  ->  mark processing  ->  notify staff (retries)  ->  acknowledge (optional)  ->  finalise
 *
 * Any notification failure after the retry budget is recorded on the enquiry
 * (status notification_failed, last_error) so staff can see it in /admin/.
 * The Workflow never throws past that point, which keeps the instance history
 * readable in the dashboard and avoids retrying a permanently misconfigured step.
 */
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { getEnquiry, setStatus, addEvent } from './db';
import { sendStaffNotification, sendAcknowledgement, EmailNotConfiguredError } from './email';

export interface EnquiryWorkflowParams {
  enquiryId: string;
}

/** "CODE: human message", never personal data. The code is what the public timeline shows. */
function describeError(err: unknown): string {
  const raw = String(err instanceof Error ? err.message : err).replace(/^NonRetryableError:\s*/, '');
  const code = /\b([A-Z][A-Z0-9_]{5,})\b/.exec(raw)?.[1] ?? 'NOTIFY_FAILED';
  const rest = raw.replace(new RegExp(`^${code}:?\\s*`), '');
  return `${code}: ${rest}`.slice(0, 500);
}

export class EnquiryWorkflow extends WorkflowEntrypoint<Env, EnquiryWorkflowParams> {
  async run(event: WorkflowEvent<EnquiryWorkflowParams>, step: WorkflowStep): Promise<{ status: string }> {
    const { enquiryId } = event.payload;
    const siteUrl = this.env.SITE_URL || 'https://xolqy.com';

    const enquiry = await step.do('load enquiry', async () => {
      const row = await getEnquiry(this.env.DB, enquiryId);
      if (!row) throw new NonRetryableError(`enquiry ${enquiryId} not found`);
      return row;
    });

    if (enquiry.status === 'notified' || enquiry.status === 'archived') {
      return { status: enquiry.status };
    }

    await step.do('mark processing', async () => {
      await setStatus(this.env.DB, enquiryId, 'processing', { incrementAttempts: true }, { stage: 'notify_attempt', detail: 'Workflow processing started' });
    });

    let notifyError: string | null = null;
    try {
      const messageId = await step.do(
        'notify staff',
        { retries: { limit: 5, delay: '30 seconds', backoff: 'exponential' }, timeout: '2 minutes' },
        async () => {
          try {
            return await sendStaffNotification(this.env, enquiry, siteUrl);
          } catch (err) {
            // Misconfiguration will not fix itself in 30 seconds: fail fast and record it.
            if (err instanceof EmailNotConfiguredError) throw new NonRetryableError(err.message);
            const code = (err as { code?: string })?.code ?? '';
            if (/E_SENDER_NOT_VERIFIED|E_VALIDATION|E_INVALID/.test(code)) throw new NonRetryableError(`${code}: ${String(err)}`);
            throw err;
          }
        },
      );
      await step.do('record notification', async () => {
        await setStatus(
          this.env.DB,
          enquiryId,
          'notified',
          { notifiedAt: new Date().toISOString(), lastError: null },
          { stage: 'notified', detail: `Staff notification sent (message ${messageId})` },
        );
      });
    } catch (err) {
      notifyError = describeError(err);
      await step.do('record notification failure', async () => {
        await setStatus(this.env.DB, enquiryId, 'notification_failed', { lastError: notifyError }, { stage: 'failed', detail: notifyError ?? 'unknown' });
      });
    }

    if (!notifyError && this.env.ENQUIRY_ACK === 'true') {
      try {
        const ackId = await step.do(
          'acknowledge sender',
          { retries: { limit: 3, delay: '1 minute', backoff: 'exponential' }, timeout: '2 minutes' },
          async () => {
            try {
              return await sendAcknowledgement(this.env, enquiry, siteUrl);
            } catch (err) {
              if (err instanceof EmailNotConfiguredError) throw new NonRetryableError(err.message);
              throw err;
            }
          },
        );
        await step.do('record acknowledgement', async () => {
          await setStatus(this.env.DB, enquiryId, 'notified', { acknowledgedAt: new Date().toISOString() }, { stage: 'acknowledged', detail: `Acknowledgement sent (message ${ackId})` });
        });
      } catch (err) {
        // The staff were notified; an acknowledgement failure is recorded but not fatal.
        await step.do('record acknowledgement failure', async () => {
          await addEvent(this.env.DB, enquiryId, 'ack_failed', String(err instanceof Error ? err.message : err).slice(0, 300));
        });
      }
    }

    return { status: notifyError ? 'notification_failed' : 'notified' };
  }
}
