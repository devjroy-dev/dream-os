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
-- SCOPE: INTERNAL names only — `harvey|donna` (CE-ruled Q-B1-11/12, 2026-07-15). NOT
-- `victor`. The first run swept victor too and returned 12 hits: 3 internal-name rows
-- (the violation) and NINE identical `"estimate via Victor"` rows in public.leads.notes
-- written BY OUR OWN SOURCE (donnaLead.ts:197/:234, `noteAdds.push('estimate via
-- Victor')`) on every lead carrying a value estimate. That is not a model defect — it is
-- deliberate PROVENANCE, and scrubText maps Harvey->Victor precisely BECAUSE Victor is
-- what the vendor may see. A clause forbidding stored "Victor" would forbid the output
-- of the function the same law mandates. So the clause was amended to its three-layer
-- truth: internal names banned at every layer; the vendor-facing name lawful in CONTENT,
-- banned in CHROME; sweeps verify storage and render separately. The nine rows STAY, and
-- this regex must never re-flag them or the sweep becomes noise nobody reads.
--
-- Word-bounded (\y..\y) so "Harveys Ltd" or a client actually named Donna surfaces as a
-- hit rather than being silently swept. Every hit is eyeballed before anything moves.
--
-- NOT SWEPT, permanently: engine.messages.content. THE EVIDENCE PLANE IS NEVER SWEPT
-- (CE standing rule) — it is the turn log and the trail Block 06 exists to read;
-- rewriting it would destroy the record of the defect.
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
 where e.title ~* '\y(harvey|donna)\y'
union all
select 'public.events', e.id::text, e.kind, e.event_date::text, 'notes', e.notes, e.created_at
  from public.events e join vend on vend.vendor_id = e.vendor_id
 where e.notes ~* '\y(harvey|donna)\y'
union all
select 'public.leads', l.id::text, l.state, l.name, 'notes', l.notes, l.created_at
  from public.leads l join vend on vend.vendor_id = l.vendor_id
 where l.notes ~* '\y(harvey|donna)\y'
union all
select 'engine.records', r.id::text, r.stage, r.client, 'note', r.note, r.created_at
  from engine.records r join vend on vend.agent_id = r.agent_id
 where r.note ~* '\y(harvey|donna)\y'
union all
select 'engine.records', r.id::text, r.stage, r.client, 'reason_for_action', r.reason_for_action, r.created_at
  from engine.records r join vend on vend.agent_id = r.agent_id
 where r.reason_for_action ~* '\y(harvey|donna)\y'
union all
select 'engine.records', r.id::text, r.stage, r.client, 'client', r.client, r.created_at
  from engine.records r join vend on vend.agent_id = r.agent_id
 where r.client ~* '\y(harvey|donna)\y'
union all
select 'public.leads', l.id::text, l.state, l.name, 'vendor_summary', l.vendor_summary, l.created_at
  from public.leads l join vend on vend.vendor_id = l.vendor_id
 where l.vendor_summary ~* '\y(harvey|donna)\y'
order by created_at;

-- COLUMNS SWEPT: public.events.title/notes · public.leads.notes/vendor_summary ·
--   engine.records.note/.reason_for_action/.client (all cabinet-rendered).
--   vendor_summary is WITNESSED — it appears in B0's U1 output (public.leads' column
--   list, founder-run 2026-07-15), not inferred from prose.
