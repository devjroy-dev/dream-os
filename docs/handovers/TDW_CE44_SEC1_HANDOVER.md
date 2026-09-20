# TDW_CE44_SEC1_HANDOVER — SEC-1: the public schema is closed to the public key

**Seat:** SEC-1, CE-44. **Sitting:** 20 September 2026, roughly 22:40 to 23:50 IST.
**Cut on:** dream-os `8d4e77105a9f8635c50547a6cd4db18e3a0c243a` · dreamos-pwa `320ad7e39f7e70e0fb4be6b37b84b4299a3c8307`.
**This cut is DOCS-ONLY (C-44.1)** and went to the founder directly under his ruling of 20 September;
the chair reads it from the repo after.

> **THE LADDER, BEFORE ANYTHING ELSE. `0170` IS TAKEN AND IT IS LIVE IN PRODUCTION.**
> It was run on 20 September 2026 and committed. Its bytes are at
> `docs/db/queries/0170_public_schema_lockdown.AS-RUN.sql`, sha256
> `b3e0c972b15d00a6154435b4fa0e6e0e8d319230d068fae64ea0756cf9307ca6`.
> **Until Part B files it into `db/migrations/`, that directory's tail reads `0169` and IS NOT the
> ladder's true tip.** **THE NEXT FREE NUMBER IS `0171`.** No seat allocates `0170` again.

---

## 1 · WHAT WAS WRONG, IN ONE PARAGRAPH

`dreamos-pwa` inlines `NEXT_PUBLIC_SUPABASE_ANON_KEY` into the browser bundle (`lib/supabase.ts`),
as every Supabase site does. That key is meant to reach almost nothing. On this project it reached
**101 of the 102 base tables in schema `public`**, with `SELECT`, `INSERT`, `UPDATE` and `DELETE`
for both `anon` and `authenticated`, no row level security and no policy anywhere: `leads`,
`invoices`, `contracts`, `contract_signatures`, `couples`, `users`, `vendors`, `otp_sessions`,
`admin_config` and the rest, some holding tokens in plain text (`vendor_ig_connections.access_token`
from `0103`, contract `sign_token` from `0138`, circle `invite_token` from `0016`). The single closed
table was `pending_money_acts`, because `0169` enabled RLS on it in its own transaction. "Automatically
expose new tables" was ON, so every future table would have joined this. The estate held test data
and nothing shows abuse, but this was the hard gate on the first real vendor. **F-44.73.**

## 2 · THE CONSUMER LIST, derived by reading both repos at their tips

**dream-os holds exactly two Supabase environment names**, `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`, 123 references each across `src`, `tools` and `scripts`. **There is no
anon key anywhere in the backend**, and no direct Postgres connection in `src` or `tools`. Every
client is the service role:

| where | key | what it reaches |
|---|---|---|
| `src/index.js:51` | service role | vendor lane; `public` and, via `.schema('engine')`, `engine`. Handed to the app lane at `:83`, to the WhatsApp lane in `vendorInboundDeps` at `:149-156` |
| `src/brideIndex.js:82` | service role | bride lane |
| `src/marketingIndex.js:37` | service role | marketing lane |
| `src/lib/supabase.js:20` | service role | shared client for bride-side modules |
| `src/engine/src/core/db.ts:13` | service role, bound at `:15` to `db: { schema: 'engine' }` | the client that makes `engine`'s exposure load-bearing |
| `src/lib/whatsapp.js:90` | service role, lazy | the opt-out gate; no-op without env |
| `src/api/vendor/auth.js:49` | service role | a SEPARATE GoTrue client for the session exchange |
| `src/api/couple/auth.js:37` | service role | the couple twin of the same |
| `tools/f42148_rebind.js:65`, `tools/lc1_backfill.js:89` | service role from the Railway shell | one-shot tools |

Storage buckets reached, all with the service role: `documents`
(`src/engine/src/core/distill.ts:23`), `wa-media` (`src/lib/vendorInbound.js:2503` and twins),
`contracts` (`src/lib/vendor/contracts.js:5`). **There is not one `.channel(` call in dream-os**, so
the backend subscribes to no Realtime channel despite the publication.

**dreamos-pwa has ONE browser client and ONE call on it.** `lib/supabase.ts` builds a lazy Proxy
client from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the only `supabase.*` call
in the repo outside that file is `supabase.auth.refreshSession` at `lib/vendor/api/_base.ts:68`.
There is no `.from(`, no `.rpc(`, no `.storage`, no `.channel(` anywhere under `app`, `lib`,
`components`, `hooks` or `scripts`. All seven `app/api/*/route.ts` files and `middleware.ts` were
opened: none builds a Supabase client; every one talks to dream-os over `fetch`. **The file's own
header calls it the phone-OTP client and that is now out of date:** OTP send, verify and provision
go to dream-os (`lib/auth/otpSignup.ts:145-181`, `app/circle/join/[token]/page.tsx:200`) and run
under the service role. The public key's live use in this estate is **one GoTrue call**.

**Why phone OTP could not be affected.** GoTrue is a separate service from PostgREST. It
authenticates against schema `auth` on its own connection, not as `anon` or `authenticated`, and it
does not consult table grants in `public` to decide whether a phone may be sent a code. The anon
key's whole function at `/auth/v1` is to identify the project and pass the gateway. `0170` names no
object in `auth`.

**Functions.** Fifteen routines in `public`, **not one of them SECURITY DEFINER** — witnessed live,
and it corrects `0031_invite_codes.sql:24`, whose header claims `consume_invite_code` is one while
its DDL declares no security clause. Every `.rpc(` call in the estate (twelve sites) is dream-os on
the service-role client; there are zero in dreamos-pwa. The circle functions that take a token
(`invite_circle_member`, `claim_circle_invite`, `0016`/`0023`/`0099`) are called only from
`src/agent/brideEngine.js:1943`, `src/api/couple/circle.js:47`, `src/api/circle/join.js:303` and
`src/lib/brideInbound.js:275`, all service role.

**The ladder holds ZERO `GRANT`, ZERO `REVOKE` and ZERO `ALTER DEFAULT PRIVILEGES` across all 156
files.** Every privilege the public roles held was made outside the ladder, by the project's own
default privileges and the auto-expose toggle. `0170` is the first migration in this estate to speak
about a privilege at all. **F-44.76.**

## 3 · THE CURE, LEG BY LEG, AND WHY EACH READS AS IT DOES

`0170` is one transaction. Its legs:

**(a) `ENABLE ROW LEVEL SECURITY` on each of the 102 tables, named one per line from the census
rows** rather than swept from the catalog at run time, so the file says what it did and a reader can
diff it. `pending_money_acts` is included as a no-op so the file reads as the whole schema rather
than as a diff against it. RLS with no policy means `anon` and `authenticated` reach no row; the
service role carries BYPASSRLS and is untouched.

**(b) `REVOKE ALL` on all tables and sequences FROM `anon`, `authenticated`.** RLS hides rows; the
grants are what let a role address the table at all. `ALL` and not the four censused privileges,
because narrowing it would leave `anon` holding `TRUNCATE` on 101 tables, which is worse than what
was being cured. `service_role` is named in no REVOKE and keeps everything.

**(c) `REVOKE ALL ON ALL ROUTINES ... FROM PUBLIC, anon, authenticated`, then
`GRANT EXECUTE ON ALL ROUTINES ... TO service_role`.** `FROM PUBLIC` is **the only leg that works**:
Postgres grants EXECUTE on a routine to `PUBLIC`, never to a named role, so a revoke written only
`FROM anon, authenticated` revokes nothing and `has_function_privilege` still reads true
(**F-44.75**). `ALL ROUTINES` and not `ALL FUNCTIONS` because the latter does not reach procedures.
The `GRANT` back to `service_role` is the chair's addition and it is load-bearing: production's
routines held EXECUTE for `PUBLIC`, `anon`, `authenticated`, `postgres` and `service_role`, and
without that line the twelve `.rpc(` call sites would have gone dark. **Routine OWNERS need no
grant:** ownership carries the privilege implicitly and `REVOKE ... FROM PUBLIC` does not touch it,
proven on the plant with a function owned by a non-superuser role which still executed after.

**(d) `ALTER DEFAULT PRIVILEGES`, written FOR each defining role, each in its own sub-block.**
`ALTER DEFAULT PRIVILEGES` binds objects created **by the role that runs it**, so an unqualified
statement covers only the editor's own future objects. The loop reads `pg_default_acl` and writes
the revoke for every role that has ever defined a default privilege in `public`. Each role's three
statements sit in their own `BEGIN ... EXCEPTION WHEN insufficient_privilege` block, because on a
Supabase project the defining roles are `postgres` and `supabase_admin` and the editor is a member
of neither the second nor a superuser; without the sub-block that one error would cancel the whole
migration, every table and every revoke with it.

**(e) NOT DONE, deliberately.** `USAGE` on schema `public` is not revoked. Nothing in `auth`,
`storage`, `graphql_public` or `engine` is named. `public` is NOT removed from Exposed schemas —
dream-os talks to the same Data API with the service-role key, so un-exposing it takes the backend
down with the stranger. `engine` STAYS exposed — `src/engine/src/core/db.ts:15` binds a client to
`db: { schema: 'engine' }` and 56 further sites use `.schema('engine')`; its safety is its grants,
and the census shows the public roles holding nothing on all 25 engine tables. **`FORCE ROW LEVEL
SECURITY` is NOT set:** it reaches only a table's OWNER, proven on a non-superuser owner where FORCE
took the owner from 1 row to 0 on its own table while `service_role`, holding BYPASSRLS, still read
1. It buys nothing against `anon`, which is already fully subject to RLS, and breaks owner-run work.
"Harden Data API" was not pressed and has not been read by anyone here.

## 4 · THE GATES, THE PROOF, AND THE WALK

**Every export of the sitting, by hash.**

| what | sha256 |
|---|---|
| census BEFORE | `50b2fe3a92ae0dfb9a266ca3394bb6c4441a7e50d2ef426e8897425560412c52` |
| snapshot BEFORE | `68090da3404bb19b53ec4225afc7762cd937375cea4692224c15daa5f14a3edf` |
| snapshot re-export after e-30 | `e0baa1276f7e4dbeb7937efdaa801c28176bdfbe5555ef5d2fa94c793446dead` |
| census AFTER | `ced0b73e99103f8cace2c7a1edc295a687d86a1f33d5388b5d78ab7fe00ccc20` |
| snapshot AFTER | `88f5bd9e711c4dfd04ef683a9f865c8fb2fdbd611e95613dbaef1f8bdec32898` |
| `0170` as run | `b3e0c972b15d00a6154435b4fa0e6e0e8d319230d068fae64ea0756cf9307ca6` |
| the undo, as generated | `ca549c007edefece37e70e9cacc52136f11eb5f5e1f84460d89c7d14ce0b8359` |
| the undo, with C-44.11's guard added (this cut) | `331914312cf7eb6b323b9216d0c97ac2019c6e0e6386a369a26eb406b2868b5a` |

The census BEFORE equals the 20 September export byte for byte, which is what an unchanged estate
re-running the same query produces; it matched what was read off his screen in the sitting, and the
snapshot taken minutes later is unambiguously of the sitting and agrees on all seven controls.

**The gates before the cure.** Census controls 102 / 101 / 101 / 25 / 18 / 0 / 2. Its 102 public
table names diffed against the 20 September export (identical, same order) and against `0170`'s 102
`ALTER TABLE` lines (exact cover, none missing, none extra). Snapshot, 3590 rows, complete:
**the editor is `postgres`, `rolsuper` FALSE, `rolbypassrls` TRUE**; all 102 tables and all 15
routines owned by `postgres`, which the editor may act for, so the **ownership gate passed**; two
defining roles, `postgres` (may act) and `supabase_admin` (**may not**), so the generator **predicted
before the cure was pasted** that `0170` would report handled 1, skipped 1, naming `supabase_admin`;
`PUBLIC` held nothing on any relation (the PUBLIC gate passed) and EXECUTE on all 15 routines;
grantees on relations `anon` 816, `authenticated` 816, `postgres` 816, `service_role` 816.

**The cure.** `Success. No rows returned`. No error, so the transaction committed.

**The census AFTER.** Public 102 / **0** / **0**; engine 25 / 18 / 0 with every engine row identical
field by field. All 102 tables RLS on, zero off, zero policies, zero forced, and not one of the eight
privilege columns true for either role on any table. No table appeared or vanished.

**The snapshot AFTER.** Relations: `anon` 816 → **0**, `authenticated` 816 → **0**; `postgres` 816
and `service_role` 816 unchanged. Routines: `PUBLIC`, `anon` and `authenticated` held EXECUTE on all
15 before, all three at **0** after; `postgres` and `service_role` keep all 15. Default privileges
96 rows → 72: `postgres`'s reduced to `postgres` and `service_role`, `supabase_admin`'s untouched.
`B rls` 102 on, 0 forced, all owned by `postgres`. Publication unchanged at 16 members.

**The owner's probe**, his machine, his key, same shell, five minutes apart:

```
probe at 2026-09-20T17:57:33Z    http=200 bytes=47
probe at 2026-09-20T18:02:34Z    http=401 bytes=198
```

A key published in the site's own bundle read a row, then was refused. 198 bytes is PostgREST's
refusal, not data. Both `401` and `403` were a pass; his gateway chose `401`.

**The dashboard**, both screenshots held. BEFORE: 3 of 3 schemas exposed (`engine`,
`graphql_public`, `public`), auto-expose ON with Supabase's own note recommending it be disabled,
Exposed tables 102 of 127. AFTER: switch OFF and saved, **Exposed tables 0 of 127**, **Exposed
functions 0 of 15**, three schemas still exposed, Extra search path / Max rows 1000 / Pool size
untouched, Harden Data API not pressed.

**F-44.81, read to him before the cure.** Sixteen public tables sit in publication
`supabase_realtime`: `circle_activity`, `circle_members`, `circle_sessions`, `clients`,
`conversations`, `couple_bookings`, `couple_receipts`, `couple_state`, `couple_tasks`, `events`,
`expenses`, `invoices`, `leads`, `messages`, `muse_saves`, `notes`. Neither repo subscribes to a
channel with any key. `0170` does not touch the publication and the after-snapshot shows it
unchanged. Realtime delivers a `postgres_changes` row to a role only if that role could SELECT it,
and after `0170` the public roles hold neither privilege nor policy; the SQL half of that is proven,
**the Realtime service's own behaviour is NOT witnessed by this seat** and is not claimed.

**The walk, six steps, none failed.** It opened with a fixture SELECT against DEV440 returning 8
leads, and the booking step's lead was chosen **from those rows**: `Walk H1 Book`, `Walk P5 Book`,
`Walk P5 Advance`, `Walk45`, `Swati Test`, `Riya Test` all `booked`; `Dev Test 3i` and
`Dev Test 3i b` `new`. Then: phone OTP on 9888294440 into the vendor shell; a lead detail (`Swati
Test`) with package "Photographs and film" Rs 80,000, its three-milestone schedule, state Booked,
arrived 17 Sep, wedding date 22 Feb 2027; the sentence "Dev Test 3i b is booked" returning the
door's confirmation question naming lead, package and figure; a WhatsApp turn from 9888294440 with
the Railway log carrying it end to end, outbound to 919888294440 with its wamid then the receipt
webhook read and sent, `matched=1`; the admin switchboard with its routes; and invoice
`TDW/DEV440/21` rendering from a signed Storage URL, which is the step that exercised Storage, a
door the cure never touched. **The rollback was never run in earnest.**

## 5 · THE RESIDUAL, UNSOFTENED

**`supabase_admin`'s default privileges still grant `anon` and `authenticated` on tables, sequences
and functions in `public`.** The editor is not a member of that role and cannot alter them. A table
created **by that role** would still arrive granted. Proven on the plant rather than reasoned: after
the cure, a table created by the editor's own role came out closed to both public roles and one
created by the skipped role came out with SELECT to both. Three things close it and none of them is
`0170`: the dashboard switch now OFF; **the protocol law that every migration creating a table in
`public` enables RLS in the same transaction**, which removes the dependence on a dashboard setting
someone can turn back on; and the plain fact that this estate's ladder is pasted into the editor and
therefore created by the editor's own role.

**A precaution and not a finding, passed to the founder:** `vendor_ig_connections` held a plain
access token while the tables were reachable. If a real Instagram account was ever connected,
reconnecting it once before launch rotates the token.

## 6 · FINDINGS, ERRORS, CORRECTIONS, DEVIATION

**F-44.73** the estate's public schema reachable with the public key, 101 of 102 tables, auto-expose
ON — **CLOSED** by this sitting, with **F-44.55** (the census) closed beside it.
**F-44.74** the census cannot source an exact rollback: it sees four privileges per role and the
estate holds eight. Cured by the F-44.74 snapshot, which reads the ACLs themselves.
**F-44.75** `has_table_privilege` / `has_function_privilege` answer for a privilege held from ANY
source, `PUBLIC` included, so a REVOKE naming only the two roles can leave the census reading true;
the routine leg revokes `FROM PUBLIC`.
**F-44.76** every privilege the public roles held in `public` was made outside the migration ladder.
**F-44.77** public tables sit in `supabase_realtime` from `0001:80` while neither repo subscribes.
**F-44.78** (to Block 09) `0031`'s header claims SECURITY DEFINER for `consume_invite_code` and its
DDL declares none; `db/README.md`'s "Current state" is four months stale, naming `0002` as the
latest applied while the tail is `0169`.
**F-44.79** a routine's ACL is NULL before the cure and non-NULL after the rollback while every
effective privilege matches: a snapshot comparison compares **privileges** and never `acl_is_null`.
**F-44.80** `ALL FUNCTIONS` does not reach procedures; `ALL ROUTINES` does.
**F-44.81** the Realtime reach, above.
**F-44.82** production holds **eight** table privileges per role, `MAINTAIN` included, and the census
sees four (widens F-44.74).
**F-44.83** the Supabase SQL editor renders no `RAISE NOTICE`, so a migration whose only report is a
NOTICE cannot be witnessed by the founder. Now protocol law.
**F-44.84** schema `public` holds **zero sequences and zero procedures**, so `0170`'s sequence line
and its `ALL ROUTINES` wording are inert on this estate today. Both stay; the record does not claim
they did work here.

**e-27** a comparison of the local census against the founder's export reported all 127 rows
differing on eleven columns, which reads exactly like a plant that does not match the estate. Cause:
`psql --csv` writes booleans `t`/`f`, the dashboard writes `true`/`false`, and the comparison was
string equality. **A comparison whose false answer looks like a real finding is as dangerous as one
whose empty answer looks like a pass.** Normalise before comparing, always.
**e-28** the plant's second defining role was planted holding default privileges but without CREATE
on schema `public`, so the first end-to-end proof of leg (d) for that role failed. Had the DO block's
NOTICE been read instead of the outcome, both roles would have been reported proven on a log line.
**e-29** the generator emitted `ALTER DEFAULT PRIVILEGES FOR ROLE` for **skipped** roles, which the
editor cannot run — the rollback would have cancelled itself in the one minute it exists for. Cause:
writing the undo from the shape of the cure instead of from what the cure was able to do. r2 omits
skipped roles and says so by name where the statements would have been.
**e-30** the undo was run once, against the pre-cure estate, before the cure. Cause: the instruction
lived in prose above a file, in an editor where five tabs were all called "Untitled query" and Run is
the green button. **Measured, not asserted:** the snapshot was re-exported and compared across all
3590 rows, zero differing either way. **This is C-44.11's origin.** It is also, unintentionally, the
only end-to-end evidence that this exact undo's bytes execute cleanly on production.
**e-31** two column names written from memory into a founder-bound SELECT (`leads.stage` → `state`,
`vendors.handle` → `routing_handle`), both refused by Postgres in front of him, twice, before the
seat read the schema doc. Now protocol law.

**c-44.32** (chair) the kickoff said engine "25 tables, RLS off"; the rows say 18 off and 7 on.
**c-44.33** (chair) the note said 101 tables hold all eight privileges; the rows say all 102,
`pending_money_acts` included — its closure is RLS alone, not its grants.
**c-44.34** (SEC-1, correcting its own read-first) **eight** privileges per role, not seven.
**c-44.35** (chair) change 1 asked for a NOTICE the founder could never have seen.

**d-1, the founder's deviation, recorded as his.** The card said stop at the door's question and do
not answer; he answered YES. The act applied: `Dev Test 3i b` is booked with client, event and
invoice `TDW/DEV440/24`. It stays (R-43.18, no row corrected by hand). It made the walk **stronger**
than the one written: step 3 as carded proved the door could read and stage against RLS-on tables,
and his yes proved the whole money path could WRITE to them.

## 7 · WHAT PART B OWES, written for a seat that has read none of the above

1. **File `0170` into `db/migrations/0170_public_schema_lockdown.sql`, byte for byte**, from
   `docs/db/queries/0170_public_schema_lockdown.AS-RUN.sql`, verified against sha256
   `b3e0c972b15d00a6154435b4fa0e6e0e8d319230d068fae64ea0756cf9307ca6`. **Do not re-author it, do not
   tidy it, do not renumber it.** It is live in production; the file is a record of what ran.
2. **The floor cell**, pinned under C-44.7 to what cannot move (a fixed historical commit range, the
   packet's own committed manifest, or bytes in their one permanent home — never
   base-against-working-tree, never a count of a live module). It reads `db/migrations` and fails
   when a `CREATE TABLE` in schema `public` has no matching `ENABLE ROW LEVEL SECURITY` in the same
   file. **It carries a planted control that must make it fail** (C-44.4): a cell whose empty answer
   and whose broken answer look the same is not evidence.
3. **Its bench**, with mutations, judged on exit codes (R-40.85), counts per repo (R-40.86).
4. **The survey: all 53 benches in `scripts/` that read `db/migrations`, EVERY cell**, for one that
   counts the ladder or pins its tail — filing `0170` moves that count by one and a bench pinned to
   `0169` will redden. The list at this tip is in `scripts/`; derive it again rather than trusting
   this sentence.
5. **The full floor**, `scripts/run-floor.sh --delivery <manifest> --check`, never stopped, green
   being "FLOOR = NAMED BASE, no delta". It carries a bench, so it is CODE: the ZIP's hash, the file
   table against base, the blocks with how each was falsified, the bench's counts and mutations and
   the floor's verdict line go to the chair BEFORE the founder runs it.

## 8 · CRAFT THIS SEAT LEARNED THAT THE CODE DOES NOT SHOW

- **Build the plant from the census's own rows and PROVE IT EQUAL before rehearsing anything on it.**
  127 of 127 rows on twelve columns, and all seven controls, against the founder's export. A
  rehearsal on a plant nobody proved is a story.
- **Plant the roles as Supabase has them:** `anon`, `authenticated` and `service_role` with
  `service_role` carrying BYPASSRLS, an `authenticator` holding all three, and **the session running
  the rehearsal a NON-superuser that is not a member of the platform's defining role.** The first
  plant this seat built ran as the bootstrap superuser and could alter both defining roles;
  production's editor cannot, and the whole of the chair's change 1 exists because of that gap.
- **Compare privileges, never `acl_is_null`** (F-44.79), and **normalise `t`/`f` against
  `true`/`false` before comparing anything** (e-27).
- **A plant is only as good as its engine version.** Production carries `MAINTAIN`; the container's
  Postgres is 16.15 and does not. A rollback generated from a PRODUCTION snapshot cannot be
  rehearsed whole on a 16 plant — it fails on `unrecognized privilege type "maintain"` and then on
  the real estate's function signatures, which a census-built plant does not have. Rehearse the
  **generator** against a plant-built snapshot; never claim a production-derived artefact was
  rehearsed when it was not. The guard of C-44.11 was proven on the plant; **this sitting's undo was
  proven on production, by accident, at e-30.**
- **Test the refusals, not just the pass.** The generator was fired at six broken exports — a moved
  control, a truncated export, `PUBLIC` holding a relation privilege, an export with no grants at
  all, an r1 export with no section G, and a real owner change on the plant — and wrote nothing in
  all six.
- **The census cannot see ownership.** On the estate with one table's owner changed it read a
  perfectly clean 102 / 101 / 101 / 25 / 18 / 0 / 2 while `0170` would have aborted on
  `must be owner of table landing_slides`. That is why the ownership gate lives in the snapshot.

---

*Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.*
