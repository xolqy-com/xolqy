/**
 * Worker entrypoint for xolqy.com.
 * - fetch: hands every request to Astro (prerendered assets + on-demand routes)
 * - queue: consumes enquiry messages and starts one Workflow per enquiry
 * - exports the Workflow and Durable Object classes bound in wrangler.jsonc
 */
import { handle } from '@astrojs/cloudflare/handler';
import { consumeEnquiryBatch, type EnquiryMessage } from './server/queue-consumer';

export { EnquiryWorkflow } from './server/enquiry-workflow';
export { FinderSession } from './server/finder-session';

export default {
  async fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
  async queue(batch, env) {
    await consumeEnquiryBatch(batch, env);
  },
} satisfies ExportedHandler<Env, EnquiryMessage>;
