/**
 * Queue consumer: one message per accepted enquiry. Starts the processing
 * Workflow with a deterministic instance id so duplicate deliveries (Queues
 * are at-least-once) never create a second process for the same enquiry.
 */
import { getEnquiry, setStatus } from './db';

export interface EnquiryMessage {
  type: 'enquiry.received';
  enquiryId: string;
  reference: string;
  /** Unix ms when the message was produced; used only for diagnostics. */
  producedAt: number;
}

export function workflowInstanceId(enquiryId: string): string {
  return `enquiry-${enquiryId}`;
}

export async function consumeEnquiryBatch(batch: MessageBatch<EnquiryMessage>, env: Env): Promise<void> {
  for (const message of batch.messages) {
    const body = message.body;
    if (!body || body.type !== 'enquiry.received' || typeof body.enquiryId !== 'string') {
      // Malformed: acknowledge so it does not retry forever; it will show in logs.
      console.warn('queue: dropping malformed message', { id: message.id });
      message.ack();
      continue;
    }

    try {
      const row = await getEnquiry(env.DB, body.enquiryId);
      if (!row) {
        console.warn('queue: enquiry not found, dropping', { enquiryId: body.enquiryId });
        message.ack();
        continue;
      }
      if (row.status !== 'received' && row.status !== 'queued') {
        // Already picked up by a Workflow (duplicate delivery or a retry after success).
        message.ack();
        continue;
      }

      const id = workflowInstanceId(body.enquiryId);
      try {
        await env.ENQUIRY_WORKFLOW.create({ id, params: { enquiryId: body.enquiryId } });
        await setStatus(env.DB, body.enquiryId, 'processing', { workflowId: id }, { stage: 'workflow_started', detail: id });
      } catch (err) {
        const msg = String(err);
        // A Workflow instance with this id already exists: the earlier delivery won. Idempotent by design.
        if (/already exists|instance.*exists|duplicate/i.test(msg)) {
          message.ack();
          continue;
        }
        throw err;
      }
      message.ack();
    } catch (err) {
      console.error('queue: processing failed, will retry', { enquiryId: body.enquiryId, attempt: message.attempts, error: String(err) });
      message.retry({ delaySeconds: Math.min(60 * message.attempts, 600) });
    }
  }
}
