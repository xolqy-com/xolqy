-- LOCAL DEVELOPMENT FIXTURE. Never run against production.
-- Two clearly labelled sample enquiries so the staff view and the pipeline
-- tracer have something to show. Run: npm run db:seed:local
INSERT OR IGNORE INTO enquiries (id, reference, name, email, website, service, budget, brief, status, country, colo)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'XQ-DEV001', 'Dev Fixture One', 'fixture-one@example.invalid', 'https://example.invalid',
   'cloudflare-migration', '5k-15k', 'DEV FIXTURE: Move three WordPress sites from shared hosting to Cloudflare with redirects preserved and email untouched.', 'notified', 'GR', 'ATH'),
  ('00000000-0000-4000-8000-000000000002', 'XQ-DEV002', 'Dev Fixture Two', 'fixture-two@example.invalid', NULL,
   'ai-and-automation', '', 'DEV FIXTURE: Build a support assistant grounded in our help centre with a monthly cost cap and logging.', 'notification_failed', 'DE', 'FRA');

INSERT INTO enquiry_events (enquiry_id, stage, detail) VALUES
  ('00000000-0000-4000-8000-000000000001', 'received', 'Accepted after validation and Turnstile verification'),
  ('00000000-0000-4000-8000-000000000001', 'queued', 'Message sent to xolqy-enquiries'),
  ('00000000-0000-4000-8000-000000000001', 'workflow_started', 'enquiry-00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000001', 'notified', 'Staff notification sent'),
  ('00000000-0000-4000-8000-000000000002', 'received', 'Accepted after validation and Turnstile verification'),
  ('00000000-0000-4000-8000-000000000002', 'queued', 'Message sent to xolqy-enquiries'),
  ('00000000-0000-4000-8000-000000000002', 'workflow_started', 'enquiry-00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000002', 'failed', 'EMAIL_NOT_CONFIGURED: NOTIFY_EMAIL or EMAIL_FROM is empty');

UPDATE enquiries SET last_error = 'EMAIL_NOT_CONFIGURED: NOTIFY_EMAIL or EMAIL_FROM is empty', attempts = 1
WHERE id = '00000000-0000-4000-8000-000000000002';
