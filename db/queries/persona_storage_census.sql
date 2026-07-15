-- ════════════════════════════════════════════════════════════════════
-- db/queries/persona_storage_census.sql — THE STORAGE CENSUS (READ-ONLY)
-- TDW_04 B1 seal rider (CE-ruled 2026-07-15) — F-04.34(i), step 1 of 2.
--
-- WHY. A4's copy-law sweep proved ZERO RENDERED PERSONA STRINGS and passed. It
-- checked RENDER. It never checked STORAGE. scrubText is a render-time firewall on
-- ONE lane (vendor-engine chat); the calendar grid, the day sheet,
-- /api/v2/vendor/events and all of B5 read events.title RAW. The law was verified
-- against the wrong layer — for two blocks running. Proof: engine row c679204b's
-- notes have carried "as requested by Harvey" since 2026-07-14, through the entire
-- A-block audit, through A4's sweep, and through B0. Nobody saw it because nobody
-- read notes.
--
-- THE COPY LAW'S NEW STORAGE CLAUSE (CE-promoted 2026-07-15): persona names are
-- never rendered AND never stored in vendor-plane rows; write doors scrub-with-
-- witness; copy sweeps verify BOTH layers. This file is the storage re-sweep.
--
-- READ-ONLY. No DDL, no DML. Guarded UPDATEs are ruled PER BATCH after the CE sees
-- this output — no blind rewrites of binder notes (engine.records.note is the
-- vendor's own cabinet prose; a regex loose there would eat their words).
--
-- GATE: B5 does not open until this census has run and its ruled fixes are applied.
-- No calendar surface gets built on unswept titles.
--
-- Word-bounded (\m..\M) so "Harveys Ltd" or a client actually named Donna is not
-- silently swept into a false positive. Every hit is eyeballed before anything moves.
-- ════════════════════════════════════════════════════════════════════
with vend as (
  select v.id as vendor_id, a.id as agent_id
  from engine.agents a
  join engine.users  eu on eu.id = a.user_id
  join public.users  pu on pu.auth_user_id = eu.auth_user_id
  join public.vendors v on v.user_id = pu.id
)
select 'public.events' as source, e.id::text, e.kind as context,
       e.event_date::text as ref, 'title' as col, e.title as value, e.created_at
  from public.events e join vend on vend.vendor_id = e.vendor_id
 where e.title ~* '\m(harvey|donna|victor)\M'
union all
select 'public.events', e.id::text, e.kind, e.event_date::text, 'notes', e.notes, e.created_at
  from public.events e join vend on vend.vendor_id = e.vendor_id
 where e.notes ~* '\m(harvey|donna|victor)\M'
union all
select 'public.leads', l.id::text, l.state, l.name, 'notes', l.notes, l.created_at
  from public.leads l join vend on vend.vendor_id = l.vendor_id
 where l.notes ~* '\m(harvey|donna|victor)\M'
union all
select 'engine.records', r.id::text, r.stage, r.client, 'note', r.note, r.created_at
  from engine.records r join vend on vend.agent_id = r.agent_id
 where r.note ~* '\m(harvey|donna|victor)\M'
union all
select 'engine.records', r.id::text, r.stage, r.client, 'reason_for_action', r.reason_for_action, r.created_at
  from engine.records r join vend on vend.agent_id = r.agent_id
 where r.reason_for_action ~* '\m(harvey|donna|victor)\M'
union all
select 'engine.records', r.id::text, r.stage, r.client, 'client', r.client, r.created_at
  from engine.records r join vend on vend.agent_id = r.agent_id
 where r.client ~* '\m(harvey|donna|victor)\M'
order by created_at;

-- COLUMNS SWEPT: public.events.title/notes · public.leads.notes · engine.records
--   .note/.reason_for_action/.client (all cabinet-rendered).
-- NOT SWEPT, and the CE should rule whether they must be: public.leads.vendor_summary
--   (named in the ruling — VERIFY IT EXISTS against docs/db or SCHEMA before adding;
--   it is not in this executor's witnessed column lists and this file will not guess
--   a column name into founder-run SQL — that is the exact A4/B0 repeat-class defect
--   the witnessed-column rule exists to kill) · engine.messages.content (the turn
--   log — arguably NOT vendor-plane; it is the trail 06 reads).
