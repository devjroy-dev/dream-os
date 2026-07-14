-- NOTE (TDW_01): 0063 was double-reserved; both files applied to prod. Twin: 0063_users_auth_user_id.sql. See SCHEMA ladder note + db/BASELINE.md.
-- 0063_vendor_activity_log.sql
-- Cross-surface activity memory (Phase 1.5).
-- Every mutating tool call on EITHER surface (WhatsApp PA or PWA Business
-- Manager) writes one row here. Both engines read the last few rows into
-- their dynamic context so each surface knows what the other just did —
-- "you raised that invoice on the app a few minutes ago".
--
-- Append-only. Never updated, never read transactionally. A write failure
-- here must NEVER block the actual tool action — callers log-and-continue.
-- No FK to the specific entity (invoice/lead/event) because the summary text
-- is a snapshot, and we don't want a deleted invoice to orphan-error a read.
--
-- STATUS: already applied to production 2026-05-29.

create table if not exists vendor_activity_log (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references vendors(id) on delete cascade,
  surface     text not null check (surface in ('whatsapp', 'pwa')),
  action      text not null,          -- tool name, e.g. 'create_invoice', 'record_payment'
  summary     text not null,          -- one-line human-readable snapshot
  entity_type text,                   -- optional: 'invoice' | 'lead' | 'event' | 'client' | 'expense' | null
  entity_id   uuid,                   -- optional: the affected row's id (informational only, not an FK)
  created_at  timestamptz not null default now()
);

create index if not exists vendor_activity_log_vendor_recent_idx
  on vendor_activity_log (vendor_id, created_at desc);
