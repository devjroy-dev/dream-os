-- 0062_couple_enquiries.sql
-- The bride's "Enquired" ledger. One row per (couple, vendor) enquiry made from
-- the Discover feed. Powers the new "Enquired" section in the Frost Vendors room,
-- where each row shows a pre-filled wa.me link to the TDW couple-facing agent.
--
-- Distinct from:
--   enquiry_taps  — anonymous analytics counter (handle + timestamp, no couple_id)
--   leads         — the VENDOR-side record (vendor sees it in their Leads tab)
--   couple_bookings — vendors the couple has actually committed to ("My team")
--
-- A single Discover "Enquire" tap now writes: this row (bride side) + a vendor
-- lead (vendor side) + the existing WhatsApp ping + enquiry_taps analytics.

create table if not exists couple_enquiries (
  id              uuid primary key default gen_random_uuid(),
  couple_id       uuid not null references couples(id) on delete cascade,
  vendor_id       uuid not null references vendors(id) on delete cascade,
  -- Snapshot vendor display fields at enquiry time so the bride's list renders
  -- without a join even if the vendor later changes details.
  vendor_name     text,
  vendor_category text,
  vendor_city     text,
  routing_handle  text,
  vendor_lead_id  uuid,            -- the leads.id created on the vendor side (nullable)
  created_at      timestamptz not null default now()
);

-- One enquiry record per couple↔vendor pair (re-enquiring just bumps created_at).
create unique index if not exists couple_enquiries_couple_vendor_uidx
  on couple_enquiries (couple_id, vendor_id);

create index if not exists couple_enquiries_couple_idx
  on couple_enquiries (couple_id, created_at desc);
