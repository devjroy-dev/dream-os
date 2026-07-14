# TDW_01_HYGIENE_FINAL (v2) — Consolidated: Ground Truth, All Rulings, Remaining Work
**v2, 2026-07-14 — supersedes v1 AND every scattered ruling from the Chief Engineer session. This is the ONLY Block-01 document. The executor works from this alone; nothing here requires a return trip except the one founder-input table in §6.**
**Status at consolidation:** Phase A SHIPPED · Phase B SHIPPED (rulings applied) · Phase C IN FLIGHT (drop SQL pending §6 inputs) · Phase D READY (instructions corrected below).
**v1's failure, owned:** v1 was written on code-dependency mapping without the prod inventory. Its Phase C/D premises were partly wrong (§3 corrects them from verified reality). The audit-before-spec rule is now BUILD_PROTOCOL law (§7).

---

## 1. WHAT IS DONE (verified, ratified — do not revisit)
| Item | Outcome |
|---|---|
| A1 legacy engine trio | `pwaEngine.js`, `pwaSystemPrompt.js`, `pwaTools.js` deleted; re-verification greps run; comments in `lib/vendor/*.js` corrected to name live callers |
| A2 root debris | One-shot scripts deleted after package.json/Railway checks |
| `.bak` sweep (ruling #2, extended) | All 12 (7 named + 5 found) diff-gated and deleted; no unique code lost; RATIFIED |
| B: dead chain (Q2a) | `lib/frost-api/vendor.ts` → `lib/mocks/vendor.ts` → `lib/types/vendor.ts` deleted as a set; tsc clean before/after |
| B: type-tree truth (Q4) | NO fold — independent trees confirmed. Vendor tree = `lib/vendor/types/` (live). Frost tree = `lib/types/` minus vendor.ts (live: common, discover, bride). Lying `// lib/types/...` headers in `lib/vendor/types/*` corrected |
| B: live-required mocks kept (Q1a, Q3a) | `lib/vendor/mocks/vendor.ts` (USE_MOCKS branches in `lib/vendor/api/vendor.ts`) → excision OWNED BY TDW_03 P1. `lib/mocks/bride.ts` (via `lib/frost-api/couple.ts`) → OWNED BY TDW_13 P5. Both assignments already written into those specs |
| C: migration verdicts | `0002` STAYS (creates live `vendor_state`, `notes`) · `0057` STAYS (live `demo_vendors`, `demo_leads`) · `0068` ARCHIVABLE (nothing it created exists in prod; `public.binders` absent — recorded in BASELINE as self-describing fact; binder concept lives on the engine plane per LD-1) |
| C: engine.orgs cluster (ruling a) | Approved: one transaction — five FK constraints dropped BY NAME → `org_members` → `orgs`. `scope_org_id` columns REMAIN (all-NULL, unconstrained); their verdict is TDW_02's by addendum (already applied there) |
| Doc regime | Committed to the session/repo per the founder |

## 2. STANDING RULINGS BORN IN THIS BLOCK (common law for all 18 blocks)
1. **0063 collision:** duplicate migration numbers are DOCUMENTED, never renamed — header line in each twin + SCHEMA ladder note + BASELINE entry. Applied history is immutable (LD-8).
2. **`.bak` law:** git is the archive; editor backups delete behind a diff gate; unique uncommitted code is the only stop.
3. **Gaps get owners:** a deletion requiring surgery on a live surface is never done in hygiene and never left as a log entry — it is assigned by dated addendum to the block that owns the surface.
4. **Zero-referenced ≠ abandoned:** grep verdicts on table names miss endpoint-referencing frontends (`cover_photos` case) — every drop candidate gets a feature-level look, not just a text search.
5. **Dependency clusters:** drops with dependents = named constraint drops, one transaction per cluster, all-NULL dependent columns verified (guaranteed by the empty referenced table; state it in SQL comments). Any non-NULL dependent value = STOP and escalate, never cascade. `cascade` is banned — the record must show what died.
6. **Audit-before-spec (the v1 lesson):** no spec touching production state ships without its ground-truth inventory as a prerequisite document (§7).

## 3. CORRECTED GROUND TRUTH (replaces v1's wrong premises)
- Migration ladder tail = **0071**. `0063` exists TWICE (`0063_users_auth_user_id.sql`, `0063_vendor_activity_log.sql`); `0064_vendor_base_fee.sql` exists. v1's "backfill missing 0063/0064" is VOID → replaced by ruling §2.1's collision documentation.
- Prod = **94 tables** pre-drop; the founder's pasted inventory is the authority; BASELINE.md is generated from it, including the `binders`-absent fact and the 0063 note.
- Railway config is dashboard-only (no railway.json/Procfile) — A3's `index.js` vs `src/index.js` verdict executes only on the founder's pasted start commands (§6).
- `cover_photos`: table exists (zero rows), backend was NEVER built (zero dream-os references; `admin/photos.js` is portfolio approval on `vendor_portfolio`), frontend EXISTS (`app/admin/cover/page.tsx`, five dead endpoint calls) + a control-room coming-soon line. Superseded by `landing_slides` (audience-tagged per TDW_13). CE recommendation: drop table + delete the orphaned page + the control-room line, recorded "superseded by landing_slides." Founder's line rules (§6).
- `PROJECT_PROMPT_ADDITION.md`: NO verdict yet — excluded from every archive list until the founder speaks (§6).

## 4. PHASE C — CLOSE-OUT INSTRUCTIONS (execute on §6 inputs, one pass)
1. On the approval line: write ALL drop SQL in ONE block — the orgs cluster per ruling §2.5 (named constraints → org_members → orgs, one transaction) + the remaining approved singles + any Step-25 dependents under the same cluster ruling. Founder executes in the SQL editor; one verify query confirms the post-drop table count.
2. Backup per the founder's word (§6). If `counts-as-record`: the zero-row inventory paste is the artifact; log the deviation in the handover.
3. SCHEMA.md gains the "Dropped 2026-07" section: every table AND every named constraint, with one-line reasons (`cover_photos: superseded by landing_slides` if dropped).

## 5. PHASE D — CORRECTED FINAL LIST (single bundle, one commit set)
1. **Docs regime:** already committed per the founder — verify presence, fill any gaps from the canonical set only.
2. **Masterplan:** the CE-session v2 export is canon (per §6 confirmation). The corrupted-zip copy is discarded.
3. **BASELINE.md:** generated from the founder's inventory minus the drops; carries the 0063 note + the binders-absent fact + a "Dropped 2026-07" pointer.
4. **0063 collision documentation** per ruling §2.1. NO backfill stubs.
5. **Migration archive:** move `0068` ONLY → `db/migrations/archive/` with the §1 note. `0002`/`0057` stay. No renames anywhere (git mv only, names preserved).
6. **docs/ archive moves:** `ROADMAP.md`, `ROADMAP_BRIDE.md`, `HANDOVER_BRIDE.md`, zero-byte `HANDOVER.md`, `SESSION_1_MOM.md`, `HANDOVER_FINAL.md`, `B1_SPEC.md`, `VENDOR_PORT_ROADMAP.md` (+ its "superseded by TDW_11 (F-6)" line), retired SPEC-1/SPEC-1.5. **NOT** `PROJECT_PROMPT_ADDITION.md` unless §6 says archive.
7. **cover_photos frontend** (if the drop is approved): delete `app/admin/cover/page.tsx` + the control-room coming-soon line; tsc gate.
8. **A3 closes** on the Railway paste: delete the stale entry file (or document dual-service boot in README if both live); record boot truth in README either way.
9. **The README line-targeted fix** that failed in Step 15 — retry included here.
10. **Handover:** ships as ONE document — what shipped, drift log (v1's premise failures included verbatim), spec deviations (backup mode if applicable), the §2 standing rulings restated, MASTERPLAN status flip to DONE.

## 6. THE ONLY REMAINING FOUNDER INPUTS (one table; answer inline, once)
| # | Question | CE recommendation |
|---|---|---|
| 1 | Drop approval line (`approved: 1–11` or exceptions by name) | approve all 11, incl. cover_photos with its frontend consequence (§3) |
| 2 | Backup word: `counts-as-record` or `csv` | counts-as-record (zero rows; CSVs would be theatre) |
| 3 | `PROJECT_PROMPT_ADDITION.md`: in use / archive | founder-only knowledge |
| 4 | Railway: paste each service's start command from the dashboard | unblocks A3 |
| 5 | Masterplan: confirm the CE-session v2 export as canon | yes |

## 7. PROTOCOL AMENDMENT (append to TDW_BUILD_PROTOCOL §3, this block's commit)
"**3.5 Audit-before-spec:** no spec that touches production state (schema, prod data, deletions) is executable until its ground-truth inventory exists as a prerequisite document, verified against live systems — the BRIDE_AUDIT standard, universal. Where a spec predates its audit, the executor's FIRST sitting is a verification pass of every named table/column/route BEFORE any patch; findings return to the Chief Engineer; the spec is amended ONCE; then build. One amendment cycle, not six interrupts."

## 8. ACCEPTANCE (block-close checklist)
1. `grep -rn "pwaEngine" src/` empty · the 12 `.bak`s gone · the Q2 chain gone, tsc clean.
2. Post-drop table count matches (94 − approved); every drop + constraint named in SCHEMA's Dropped section; BASELINE reconciles to the inventory.
3. `0068` in archive with its note; 0063 twins carry their headers; zero renamed files in `git diff --stat`.
4. Smoke trio: Railway boot + one Victor turn + one WA vendor message + one WA bride message.
5. docs/ matches §5.6 exactly; masterplan v2 in place with status DONE; the protocol carries §7.
6. If cover dropped: `app/admin/cover` gone, control-room line gone, tsc clean.
