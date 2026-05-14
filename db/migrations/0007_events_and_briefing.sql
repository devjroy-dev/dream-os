-- ════════════════════════════════════════════════════════════════════
-- Migration 0007 — Events, delivery_status, briefing_enabled
-- Date:    2026-05-14
-- Session: 6
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════

-- events table — vendor-logged shoots, calls, meetings, tasks etc.
create table events (
  id               uuid primary key default uuid_generate_v4(),
  vendor_id        uuid not null references vendors(id) on delete cascade,
  title            text not null,
  event_date       date not null,
  event_time       time,
  kind             text not null check (kind in ('shoot','call','meeting','task','reminder','recce','other')),
  linked_lead_id   uuid references leads(id) on delete set null,
  state            text not null default 'upcoming' check (state in ('upcoming','done','cancelled')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index events_vendor_id_idx           on events(vendor_id);
create index events_event_date_idx          on events(event_date);
create index events_state_idx               on events(state);
create index events_vendor_date_state_idx   on events(vendor_id, event_date, state);

create trigger events_updated_at
  before update on events
  for each row execute function set_updated_at();

alter publication supabase_realtime add table events;

-- messages.delivery_status — updated by Twilio status callback webhook
-- values: queued, sent, delivered, read, failed, undelivered, skipped_window_closed
alter table messages add column delivery_status text;

-- vendors.briefing_enabled — per-vendor kill switch for morning briefing
alter table vendors add column briefing_enabled boolean not null default true;
