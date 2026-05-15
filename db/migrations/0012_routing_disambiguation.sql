-- 0012_routing_disambiguation.sql
-- Session 8.5 Step 10: persistent state for multi-vendor routing disambiguation
-- Pattern: nullable jsonb on users. Cleared on resolution or expiry (10 min).

alter table users
  add column if not exists pending_routing_context jsonb;

comment on column users.pending_routing_context is
  'When a couple has multiple couple_threads and sends a message without a TDW code, this stores: { candidate_vendor_ids: uuid[], original_message: text, asked_at: timestamptz }. Cleared on resolution or expiry.';
