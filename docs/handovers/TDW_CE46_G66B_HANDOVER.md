# TDW · CE-46 · G6-4 · cut B · F-44.247 · Meta's Instagram deletion purges her threads · handover

Base: G6-5's dream-os cut on G6-4's on c252d67. Lands after cut A. Rung b157. Migration 0184 (allocated by the chair).

## Apply
0184 in the SQL editor BEFORE the push (the callback calls the function). Its report is the commented SELECT at the file's foot:
one row, ig_deletion_purge, prosecdef false, service_role_exec true, anon_exec false.

## What changed
- `db/migrations/0184_ig_deletion_purge.sql`: one function, `public.ig_deletion_purge(p_vendor_id uuid) RETURNS jsonb`, SECURITY
  INVOKER, every name schema-qualified, no search_path (b91's law); EXECUTE for service_role only. In one transaction: her
  channel 'instagram' threads' messages deleted; those threads deleted (pending actions and drafts cascade; notes and polls keep
  their rows with the link nulled); `leads.counterparty_ig_id` nulled on her leads (the chair's (a): the lead stays, it is her
  business record); her `vendor_ig_connections` row deleted.
- `src/api/vendor/ig.js` POST /data-deletion: one `supabase.rpc('ig_deletion_purge')`; an error answers 500 so Meta asks again.
  /deauthorize unchanged. GET /deletion-status gains the founder-approved paragraph on conversations and leads; photos unchanged.
- `docs/db/PUBLIC_SCHEMA.md`: 0184's note.
- Re-pinned by label: b07_p4a 11.16 (the signature before the purge), b153 1.2 (deauthorize deletes, data-deletion purges).

## Rungs
b157 19/0 (the SQL run in PGlite, fetched by npm into the temp dir at run time); b91 53/0 and b128 13/0 with 0184 on the ladder.
