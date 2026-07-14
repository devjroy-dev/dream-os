# TDW_01_HYGIENE_FINAL — Legacy Deletion & Repo Sanitation
**Blocks:** everything (runs first — LD-6) · **Repos:** dream-os, dreamos-pwa
**Read first:** `TDW_BUILD_PROTOCOL.md`, `TDW_00_MASTERPLAN.md`, `docs/SCHEMA.md`, `src/api/vendor/core.js`, `src/api/router.js`
**Author:** Chief Engineer session, 2026-07-14

## 1. Purpose
Two brains, one body: the Victor/Donna engine (`src/engine/`) owns the live
vendor chat, while the Myra-era engine (`src/agent/pwa*`) sits beside it,
still plausible-looking, still commented as if live. Plus dead mocks, dead
demo remnants, and repo-root debris. Every future session pays a confusion
tax. This spec deletes the legacy era — code and database — so no executor
ever patches the wrong brain again.

## 2. Non-goals
- No behavior changes to any live surface. This spec only removes what
  nothing live touches. Zero feature work.
- WhatsApp engines (`engine.js`, `brideEngine.js`, `circleEngine.js`,
  their tools/prompts/onboarding) are LIVE — untouched.
- No migration renumbering (LD-8). Archive, never rename.

## 3. Phase A — dream-os code deletion

### A1. Verified-dead legacy PWA engine (delete)
Dependency map verified 2026-07-14: no imports outside `src/agent/` reach
these; `lib/vendor/*.js` references are comments only.
- `src/agent/pwaEngine.js`
- `src/agent/pwaSystemPrompt.js`
- `src/agent/pwaTools.js`

**Executor MUST re-verify before each deletion** (protocol §3.2):
```bash
grep -rn "pwaEngine\|pwaSystemPrompt\|pwaTools" src --include="*.js" | grep -v "^src/agent/pwa" | grep -v "^\s*//"
# must return ONLY comment lines. Any require/import hit = STOP, report.
```

### A2. Candidates requiring executor verification (delete only if dead)
For each: grep who imports it; if only legacy trio (now deleted) imported
it, delete; else keep and record why in handover.
- `src/agent/onboarding.js` (vendor PWA onboarding — check `api/vendor/onboarding.js` doesn't import it)
- `src/agent/systemPrompt.js` — imported by live `engine.js` (WA). KEEP unless proven otherwise.
- Root-level debris in dream-os: `ask_harvey.js`, `build_demo_system_os.py`,
  `deploy_admin_invite.py`, `deploy_dream_os.py`, `append_schema_phase35.py`,
  `package.json.bak` — one-shot scripts from past sessions. Delete after
  confirming none are referenced by `package.json` scripts or Railway config.
- Comment sweep: update the "Called by REST handlers and pwaEngine tool
  executors" headers in `src/lib/vendor/*.js` to name the live callers
  (REST handlers + Victor door). Comments that lie are debt.

### A3. Legacy index check
`index.js` (root, 999 lines) vs `src/index.js` (973): determine which one
Railway boots (`package.json` main/start + Railway config). The other is a
stale fork — delete it. If both are live entry points (vendor + bride
processes), record that clearly in README instead and delete nothing.

## 4. Phase B — dreamos-pwa deletion
- `lib/mocks/vendor.ts`, `lib/vendor/mocks/vendor.ts` — verified: no live
  page imports them. Re-verify, delete.
- Duplicate type tree: `lib/types/vendor.ts` vs `lib/vendor/types/vendor.ts`
  — identify which the live vendor pages import; fold stragglers into the
  live one; delete the other. Same check for `lib/types/bride.ts`.
- Repo-root debris: `frost_muse_bloom.zip`, `phase2_pkg.zip`, `cleanup.sh`,
  `cleanup-bride.sh`, `delete_may26_files.sh` — delete.
- `components/demo`, `hooks/demo` — KEEP (demo surface is Block 08 and
  live via subdomains).
- `tsc --noEmit` after each deletion batch. Zero new errors.

## 5. Phase C — database legacy discovery + drop (founder-gated)
Never blind-drop. Protocol:
1. **Inventory:** founder runs in Supabase SQL editor and pastes output:
```sql
select table_schema, table_name,
       (select count(*) from information_schema.columns c
        where c.table_schema=t.table_schema and c.table_name=t.table_name) as cols
from information_schema.tables t
where table_schema in ('public','engine')
  and table_type='BASE TABLE'
order by 1,2;
```
2. **Cross-reference:** executor greps every table name against BOTH repos
   (`.from('<name>')`, raw SQL, migrations). Tables with zero live-code
   references → candidate list. Known candidate families to test:
   old demo-system remnants (pre-0056 rebuild), any `tdw-2`-era tables,
   superseded waitlist/experiment tables. `taste_quiz_images`, `muse_pool`,
   `spotlight`, `discover_heroes`, `admin_config` are LIVE (admin content
   system) — not candidates.
3. **Founder review:** candidate list with row counts
   (`select count(*)`) presented in chat. Founder approves each drop by name.
4. **Backup then drop:** for each approved table — CSV export (Supabase
   dashboard) saved by founder, then `drop table <schema>.<name>;` applied
   by founder. Executor writes the exact SQL; founder executes.
5. **Record:** SCHEMA.md gains a "Dropped 2026-07" section listing every
   drop with date and reason.

## 6. Phase D — migration archive + docs regime
- `mkdir db/migrations/archive/` — move (never rename) migration files whose
  objects were dropped in Phase C or superseded-and-dropped earlier (e.g.
  first/second demo-system migrations if their tables are gone). Each move
  logged in SCHEMA.md.
- Backfill the missing `0063`/`0064` gap files if recoverable from SCHEMA.md
  descriptions; else add `0063_MISSING.md` stubs stating what they did
  (per SCHEMA.md) so the ladder is self-describing.
- Write `db/BASELINE.md`: current prod schema snapshot (tables + columns,
  generated from the Phase C inventory) so nobody reads 71 files again.
- Install the doc regime: commit `TDW_BUILD_PROTOCOL.md`,
  `TDW_00_MASTERPLAN.md`, this file into `dream-os/docs/`. Move superseded
  docs (`ROADMAP.md`, `ROADMAP_BRIDE.md`, `HANDOVER_BRIDE.md`, zero-byte
  `HANDOVER.md`, `SESSION_1_MOM.md`) into `docs/archive/`. `ROADMAP_FINAL`,
  `SCHEMA`, `API_CONTRACTS`, `UNIT_ECONOMICS`, `FINDINGS_LOG`,
  `DEVS_HOLY_GRAIL` stay.

## 7. Acceptance criteria
1. `grep -rn "pwaEngine" src/` returns nothing (dream-os).
2. Railway boot + one full Victor chat turn + one WA vendor message + one
   WA bride message all work post-deletion (founder smoke).
3. `node --check` clean on all touched backend files; `tsc --noEmit` clean
   on dreamos-pwa.
4. Every dropped table has: founder approval in chat, a saved CSV, a
   SCHEMA.md "Dropped" entry.
5. `db/BASELINE.md` exists and matches the Phase C inventory.
6. No migration file renamed or renumbered anywhere (LD-8 audit:
   `git diff --stat` shows only moves to `archive/` and additions).

## 8. Native-implications clause
Pure removal — improves the port by shrinking the surface. The duplicate-type
fold (Phase B) is a direct prerequisite for the shared `@tdw/api` package.

## 9. Session boundaries
One executor session, phases in order A→B→C→D. Phase C blocks on founder
inventory paste — executor proceeds with D-docs work while waiting if needed.
Handover updates MASTERPLAN status to DONE and names any survivor files kept
with reasons.
