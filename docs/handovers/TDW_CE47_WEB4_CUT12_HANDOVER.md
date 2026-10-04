# TDW · CE-47 · WEB-4 · CUT 12 HANDOVER · F-44.272, option A: the files made to match the live database (dream-os)

Cut at dream-os `a7620ce`, 3 October 2026, ahead of cut 11 (the chair's order). Migration **0193**. Rung **b207**
(+ b207r on Postgres 16). A NO-OP ON THE LIVE DATABASE. Its SQL goes in before the push.

## Source of truth
The founder's two read-only reads of 3 October 2026: pg_constraint for the nine tables (22 rows), and
information_schema.columns for discover_heroes and the seven linked tables (106 rows). Nothing taken from PUBLIC_SCHEMA.md
(it is stale: e.g. demo_claim_requests has no bride_phone live).

## 0193_live_links_declared.sql
1 · The 22 links live carries and no migration declared (contracts 6, payment_schedules 2, tds_ledger 3, team_members 2,
    team_messages 2, team_payments 4, team_tasks 3), each added ONLY where its table exists and no constraint of that name
    is on it, with pg_get_constraintdef's live text verbatim. Live: all 22 exist, so nothing runs.
2 · DROP TABLE IF EXISTS public.pending_actions: declared by 0002, absent live, read by nothing in src. Live: nothing runs.
3 · discover_heroes as live: DROP COLUMN IF EXISTS vendor_id; ADD COLUMN IF NOT EXISTS cloudinary_public_id text and
    updated_at timestamptz NOT NULL DEFAULT now(); id's default set to uuid_generate_v4() only where it differs. Live:
    nothing runs. (0044 declared vendor_id with a cascade; a table of that name already existed live, so 0044's
    CREATE TABLE IF NOT EXISTS never ran there.)
No row is written, changed or removed. One transaction.

## 0184's header
0184 (the IG deletion purge) says pending_actions cascades. There is no pending_actions table live, and after 0193 there
is none in the files either: that sentence describes nothing, and the purge touches no missing table (it is not broken).
Read 0184's header with this correction; the applied migration file is not edited.
src/lib/prospectExit.js's comment no longer counts pending_actions in its blast radius, and says why.

## Proven
b207 14/0 (the 22 verbatim and name-guarded; the one drop; discover_heroes guarded; no row written; one transaction; the
stale comment; nothing reads pending_actions; two mutations). Clean tip: 3 passed, 11 failed.
b207r 14/0 on Postgres 16: LIVE copy (the live shape, the 22 links, planted rows): 0193 changes NOTHING (links, constraint
and default object ids, column order and defaults, pending_actions absent, every row by count and hash), twice. FILES copy
(the shape without the links, 0044's discover_heroes and 0002's pending_actions put back): after 0193 its links and its
nine tables' columns EQUAL live's, pending_actions gone, every table keeps its rows; twice is identical. Mutations: the name
guard removed refuses on live; the default guard removed replaces live's default object.
Differential over every reader of the migrations folder, prospectExit and the two tables, and the source walkers
(89 benches), engine built both sides: exits identical; only b10_p1's printed ladder top moved (0192 -> 0193), in its own
pre-existing red.
