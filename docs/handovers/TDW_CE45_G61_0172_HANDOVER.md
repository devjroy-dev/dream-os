# TDW · CE-45 · G6-1 · 0172 · HANDOVER · dream-os

Cures **F-44.168** (the seat's e-133): GET /api/v2/vendor/solutions/number answered 500 on every visit on production.
Standing cure for **F-44.169** going forward: **A-45.8**, pinned by b128.

## The cause, from the founder's own reads (25 September)

- Railway, dream-os deploy logs, 14:49 to 15:25 IST: `vendor_wabas read: permission denied for table vendor_wabas`
  (door.js's one throw, carrying Postgres's message).
- `information_schema.role_table_grants`: `service_role` held only REFERENCES, TRIGGER, TRUNCATE on vendor_wabas and
  vendor_wa_events (all seven on vendors). All three owned by postgres.
- `pg_default_acl`, schema public: tables created by postgres give service_role `Dxtm`, never SELECT, INSERT, UPDATE or
  DELETE (F-44.169). 0170 does not cause this; what narrowed that default is not witnessed in the repo.
- The census (`has_table_privilege('service_role', …)` over every relation in public, a control row on vendors): only
  0171's two tables lack the four privileges. Nothing else in public is affected.
- 0171 shipped with no grant, and its rehearsal ran as a BYPASSRLS editor role, never as service_role: the seat's error.

## What changed

- `db/migrations/0172_own_number_grants.sql`: one transaction; GRANT SELECT, INSERT, UPDATE, DELETE on the two tables TO
  service_role; anon and authenticated not granted (0170's line); revert and report query commented.
- `docs/db/PUBLIC_SCHEMA.md`: the staleness note names 0172 and F-44.169.
- `scripts/b128_g61_migration_grants_bench.js` (A-45.8): every CREATE TABLE in db/migrations from 0171 on grants
  service_role the four in its own file; 0171 the one named exemption, cured by 0172 and held both ways.

## Proof

- **The plant (Postgres 16), his condition reproduced first:** postgres's default ACL set to give service_role only
  TRUNCATE, REFERENCES, TRIGGER; 0171 applied as postgres; the grants read exactly his; the door's select, PostgREST-shaped
  (`BEGIN; SET LOCAL ROLE service_role; …`), refused with his production message. 0172 applied: service_role reads,
  inserts, updates and deletes on both tables; anon and authenticated still refused.
- **b128: 13 pass, 0 fail**; its checker proven on six synthetic migrations; M1 (0172 losing a grant) reddens it.
- The differential and the floor: on the base given at the cut.

## The walk

0172 pasted in Supabase (one transaction), then the report query in its own tab (both tables: service_role with all
seven). Then /vendor/number opened once, and Railway's dream-os log shows no new "permission denied" line (the room stays
the shell: 2a is dark until S4).

## The walk, as recorded (25 September 2026)

Carried into the tree by G6-2 (CE-46) with its first dream-os delivery, verbatim from G6-1's seat-close (27 September 2026).

Part A 23:29 IST: 0172's BEGIN, two GRANTs, COMMIT in Supabase, "Success. No rows returned". A2: vendor_wa_events and
vendor_wabas each with postgres and service_role holding DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE; no anon
or authenticated row. Part B: b128 13/0, FLOOR = NAMED BASE, 2f49ac0..08025d4, five of five byte-identical to 0172_1b. Part C
23:51 to 23:54 IST: Railway dream-os 2b7836a9, Deploy Logs "wabas": no logs found; /solutions/number 304 where it was 500.
F-44.168 cured on production (confirmed again by IGD-1, 26 September). A-45.8 standing, pinned by b128.
