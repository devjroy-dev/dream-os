# TDW · E-1 — THE EXIT-CODE CENSUS (CE-39, 2026-09-03)

**Tips measured:** dream-os `e947570` (main) · dreamos-pwa `d57cada` (worklist). Sibling-full clones, `npm ci` both, `npm run build` dream-os, preflight CLEAR. Harness: every bench bare, exit code captured DIRECTLY to a file (never through a pipe), warm-up pass discarded, no `BENCH_TIMEOUT`, tree clean after every pass in both repos.

**The table:** `0 pass · 1 fail · 2 error · 3 refused` (F-39.55). Ruled this sitting: **F-39.67** — an unexpected throw is an ERROR (2), never a FAIL (1), estate-wide.

## §1 · MEASURED, PRE-CURE
dream-os 168 run: 148×0 · 16×1 · 2×2 · 2×3 — non-zero SET == `floor-base.txt` (20 lines). pwa 98 run: 74×0 · 23×1 · 1×3 — non-zero SET == the `printf` base (24 lines).

## §2 · MEASURED, POST-CURE (both floors by SET)
**dream-os** — nothing joins, nothing leaves. Four lines move, two leave the base file: `test-shape` RED→REFUSED · `b06_gauntlet` RED→REFUSED · `b5b_movementb_bench` RED→ERROR · `b5_wa_door_smoke`, `bf1` leave (refusals never enter a base, c-39.57). Base: 16 lines (15 RED + 1 ERROR). `--check` rc=0.
**dreamos-pwa** — IDENTICAL SET before and after. One line leaves the base file: `REFUSED: b50_fetch_loop_bench`. Base: 23 lines. `--check` rc=0.

## §3 · CURES APPLIED (one line at the exit site) — with both-ways proof
dream-os (50 edits, 47 files): 37 catch→2 · 8 catch-less async mains given `.catch(…exit(2))` · refusals → 3 at `b06_gauntlet` :2586/:4548, `b6_floors` :130, `test-shape` :32, `b06_f0613_relay` :27.
pwa (24 edits, 17 files): 13 refusals 1→3 (`b41`:153, `tdw08_console`:48, `tdw09_surface`:34/:39, `tdw09_surface_census`:42/:49, `tdw09_type`:37, `tdw09_type_census`:42, `tdw13_d6_parity_matrix`:49, `tdw15_p1_events`:175, `tdw_f0774_readers`:367, `tdw_f0774_vacuity_probe`:131/:157) · `tdw19_p2a` :86 2→3 · throws→2 at `settleWords`:139, `b41`:271 (the bf1 split), `crewCommit`/`rosterMint` (appended `.catch`), `postAccess` (sync `main()` → try/catch), `tdw09_type` (top-level await → `uncaughtException` handler, measured: a TLA rejection is NOT an unhandledRejection) · `tdw09_p2b_vocab` doctrine superseded (three lines, not one — disclosed: refusal cells counted as fails, so a `refused` count was needed for refusals-only→3, RED-wins→1).
Runners (both): exit 2 → `ERROR:` line · refusals excluded from the `--check` diff and counted beside the verdict · STOP if a base carries `REFUSED:` · dream-os glob excludes `_noop_middleware.js` by name.

**Proofs (rc measured direct):** refuse→3: test-shape 1→3, b06_gauntlet 2→3 (key), dist hidden: b6_floors 2→3, b06_f0613 1→3, b06_gauntlet 2→3; sibling hidden: tdw13_d6 1→3, tdw15_p1 1→3, tdw09_p2b 1→3; tsc hidden: tdw19_p2a 2→3; dirty tree: vacuity_probe 1→3. throw→2 (planted throw on a temp copy): b0450, b0452, b15, b06_m4, b0455, b41, tdw09_type, crewCommit, rosterMint, settleWords, postAccess all → 2; same plant on the UNCURED b0452 → 1. RED wins: tdw09_p2b with a vocabulary term mutated → 1. Restored → every specimen back to its measured code. Runner: `b5b_movementb` reads `ERROR:` live; a base carrying `REFUSED:` STOPs (witnessed on dream-os with the old base).

## §4 · REPORTED, NOT CURED (priced)
- **assert-throws benches** — `b3_rider_bench`, `b5_describe_bench` (dream-os), `tdw09_p2c` (pwa): a failed assertion and a load error are both node's 1. ~10 lines each (a fail counter + verdict exit).
- **`tdw09_type_census` :177/:180/:198** `--apply` usage errors exit 1 — unreachable bare; 2 is the right code. Three characters, left for the chair.
- **The 9 `run-*-proof.sh` wrappers** — `set -e`: a tsc type error is tsc's own 2 (on-table, measured: `postAccess` read ERROR when my first edit did not type-check), a missing binary is 127 (reads RED). One trap line per wrapper, or one shared helper.
- **`dist_gate.js` (9 adopters)** greens a stated SKIP — doctrine, unruled.
- **`closerReads.js` and `b08_p5_closer_scenarios.js`** run under the dream-os glob with no verdict — unruled (ruling 4 named `_noop_middleware` only).
- **dream-os glob misses 4 runnable benches** (F-E1.3): `tdw09_p2b_vocab_os.proof.mjs`, `tdw09_rider2_budget.proof.mjs`, `tools/bench/*` ×2 — unruled.
- **`b5b_movementb_bench`** :225 uncaught TypeError — the 2 is real; the bench is broken. Own sitting.

## §5 · RIDERS
(i) **F-39.66 — HELD.** The finding text is at neither tip; no `Undo` exists in `app/w`/`components/worklist`. The only cancel-with-undo derivable is `components/vendor/slices/SliceShell.tsx:642–651` (invoices/events left-swipe → `undoableMutation` → 「Removed.」+Undo, shared with leads/expenses delete). A one-line cure there changes copy on four slices; the vetoed string 「Cancelled.」 needs its site named before a vendor-facing byte moves.
(ii) **PAIR regen for 0130 — REFUSED (exit 3, by hand).** The PAIR's first half (`db/queries/public_schema_dump.sql`) is founder-run in the Supabase SQL editor; no CSV is committed; `format_public_schema.js` cannot run without it. Writing 「vendors 49 columns」 into the header unwitnessed would violate the SQL-provenance law. Needs the CSV.

## §6 · SEAT CORRECTIONS
c-E1.1 a fix-up keyed on a filename clobbered a second edit in the same file (caught by the applier's exactly-once rule; nothing written). c-E1.2 the applier used `String.replace` with a string replacer — a literal `$'` in `new` would have duplicated the file; caught before write, function replacer since. c-E1.3 four mid-line `//` tags swallowed a closer (`b41`:153/:271, `tdw09_surface`:39, `settleWords`:139) — SyntaxError; found by the plant, re-tagged `/* */`, syntax-swept both repos. c-E1.4 `postAccess.main()` is synchronous; the `.catch` did not type-check — try/catch instead. c-E1.5 three plants that never reached the code under test (a wrapper `.js` path, an unreachable-code TS error, a comment-line mutation) were each re-planted until the output carried the plant.

## dream-os — E-1 exit-code census (measured pass; warm-up discarded; rc captured direct)

| # | bench | rc | printed verdict / reason line | table class | off-table? |
|---|---|---|---|---|---|
| 1 | `_noop_middleware` | 0 | (no output) | exit 0 — NOT A BENCH (middleware export run by the glob) | chair question: exclude from glob or leave |
| 2 | `b0450_bands_bench` | 0 | [GET /vendor/bands] binder hop failed (soft): records exploded | PASS (0) | catch→1 (throw would read as FAIL) |
| 3 | `b0451_crew_page_bench` | 0 | [GET /crew] assignments read failed: events exploded | PASS (0) | catch→1 (throw would read as FAIL) |
| 4 | `b0452_collab_bench` | 0 | b0452_collab_bench: 52 passed, 0 failed | PASS (0) | async main with no catch: a throw is node's 1. Cure: append .catch(...exit(2)) |
| 5 | `b0453_collab_wiring_bench` | 0 | [whatsapp:out] REFUSED — no Meta lane for from='' to=919000000001; check this service's *_PHONE_NUMBER_ID + *_ | PASS (0) | catch→1 (throw would read as FAIL) |
| 6 | `b0454_owner_assignments_bench` | 0 | b0454_owner_assignments_bench: 19 passed, 0 failed | PASS (0) | catch→1 (throw would read as FAIL) |
| 7 | `b0455_money_loop_bench` | 0 | b0455_money_loop_bench: 73 passed, 0 failed | PASS (0) | catch→1 (throw would read as FAIL) |
| 8 | `b0457_assign_bench` | 0 | 30 passed, 0 failed | PASS (0) |  |
| 9 | `b0457_crew_bench` | 0 | 21 passed, 0 failed | PASS (0) |  |
| 10 | `b0457_crud_crew_bench` | 0 | 19 passed, 0 failed | PASS (0) |  |
| 11 | `b0457_gap_bench` | 0 | 10 passed, 0 failed | PASS (0) |  |
| 12 | `b0461_p6_bench` | 0 | 25 passed, 0 failed | PASS (0) |  |
| 13 | `b0496_pinlogin_tier_bench` | 0 | F-04.96 dream-os: ALL GREEN (11/11) | PASS (0) |  |
| 14 | `b0497_assign_crew_door_guidance_bench` | 0 | F-04.97: ALL GREEN | PASS (0) |  |
| 15 | `b0498_fresh_crew_rider_bench` | 0 | [vendor-e chat:meta] failed (open meter): eng.from(...).select(...).eq(...).not is not a function | PASS (0) | no catch: throw→node 1. Cure: append .catch(...exit(2)) |
| 16 | `b0498_wa_assign_punct_bench` | 0 | 17 passed, 0 failed | PASS (0) |  |
| 17 | `b05_arc_m1_bench` | 0 | [bride-webhook] error: Error: engine 400 | PASS (0) |  |
| 18 | `b05_arc_m2_bench` | 0 | GREEN — her figure or the honest question, never ten times what she said; | PASS (0) |  |
| 19 | `b05_arc_m3_bench` | 0 | GREEN — the couple door survives its own cabinet write. Live witness is the FOUNDER's. | PASS (0) |  |
| 20 | `b05_arc_m4_bench` | 1 | 18 passed, 1 failed | FAIL (1) |  |
| 21 | `b05_arc_m5_bench` | 0 | GREEN — the orphan is gone, its classifier waits whole and uncalled, and the census says so out loud. | PASS (0) |  |
| 22 | `b05_arc_m6_bench` | 1 | 17 passed, 3 failed | FAIL (1) | no catch: throw→node 1 (two meanings). Cure: append .catch(...exit(2)) |
| 23 | `b05_couple_soul_bench` | 0 | GREEN — the soul is wired on the real seam, cached, one-homed, and self-consistent. | PASS (0) |  |
| 24 | `b05_f0515_calendar_parse_bench` | 0 | GREEN — fenced empty = honest no-events · fenced-with-prose parsed · clean passthrough byte-identical · malfor | PASS (0) |  |
| 25 | `b05_f0516_metalane_symmetry_bench` | 0 | GREEN — bride branch mirrors vendor (explicit number required) · tonight's constellation routes vendor · legit | PASS (0) |  |
| 26 | `b05_f0518_onboarding_bench` | 0 | [couple:onboarding] users name error: users write refused | PASS (0) |  |
| 27 | `b05_f0532_haiku_ceiling_bench` | 0 | GREEN — the agent lane's ceiling is Haiku on the real wires (two survive M5); | PASS (0) |  |
| 28 | `b05_f0550_ping_drain_bench` | 0 | [leadPings] drain stamp failed (ping stays open, will re-surface): boom | PASS (0) |  |
| 29 | `b05_f0555_media_dedupe_bench` | 1 | [webhook:vendor-image] guard row insert failed (audit best-effort, turn continues): duplicate key value violat | FAIL (1) |  |
| 30 | `b05_f056_otp_meta_bench` | 0 | PASS — 25 passed, 0 failed | PASS (0) |  |
| 31 | `b05_f0578_namefill_bench` | 0 | VERDICT: GREEN | PASS (0) |  |
| 32 | `b05_f0583_race_bench` | 0 | [agent:resolve] degraded to the cap-zero refusal over a RESOLVE FAILURE — NOT a cap event; hunt "[agent:resolv | PASS (0) | catch→1 (throw would read as FAIL) |
| 33 | `b05_f0589_name_at_mint_bench` | 0 | 31 PASS · 0 FAIL   (31 cells) | PASS (0) |  |
| 34 | `b05_f059_signup_bench` | 0 | PASS — 10 passed, 0 failed | PASS (0) |  |
| 35 | `b05_m1_transport_bench` | 0 | [whatsapp:out] REFUSED — no Meta lane for from='10000000000' to=919800000002; check this service's *_PHONE_NUM | PASS (0) |  |
| 36 | `b05_m1b_inbound_bench` | 0 | GREEN — Meta-path wiring (text/circle/dead-end) over the REAL core + faithful supabase fake, non-vacuous. Verb | PASS (0) |  |
| 37 | `b05_m2_vendor_inbound_bench` | 0 | [agent:cap-gate] METER UNREACHABLE — turn allowed through unmetered: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KE | PASS (0) |  |
| 38 | `b05_media_shim_bench` | 0 | GREEN — Meta media -> OCR/media branches with a STABLE url · guardrails · F-05.14 · auth-by-host. Live witness | PASS (0) |  |
| 39 | `b05_meta_router_bench` | 0 | GREEN — 31 passed, 0 failed | PASS (0) |  |
| 40 | `b05_p2_sendwa_bench` | 0 | GREEN — registry + sendWa gate + brideCron routing proven; refuse↔send hinges only on template status. | PASS (0) |  |
| 41 | `b05_p3d_board_counts_bench` | 0 | b05_p3d_board_counts_bench: 10 passed, 0 failed | PASS (0) |  |
| 42 | `b05_p3d_prospect_exit_bench` | 0 | [admin:prospects] conversation check FAILED for x1: conversations unreachable — REFUSING the delete: a thread  | PASS (0) |  |
| 43 | `b05_p4_crons_bench` | 1 | 46 passed, 2 failed | FAIL (1) |  |
| 44 | `b05_r365_agent_race_bench` | 0 | 17 passed, 0 failed | PASS (0) |  |
| 45 | `b0607_oow_completion_bench` | 0 | [enquiry:oow] brief row insert failed: insert refused | PASS (0) |  |
| 46 | `b06_0081_bench` | 0 | [memory] messages.meta absent (apply 0081) — saved the row without the mark | PASS (0) |  |
| 47 | `b06_advisor_bench` | 0 | ALL PASS  16/16 | PASS (0) | no catch: throw→node 1. Cure: append .catch(...exit(2)) |
| 48 | `b06_advisor_route_bench` | 0 | ALL PASS  16/16 | PASS (0) | catch→1 (throw would read as FAIL) |
| 49 | `b06_bride_arrival_bench` | 0 | [relay:wa] delivered_receipt undeliverable vendor=v1 reason=mutated | PASS (0) |  |
| 50 | `b06_donna_cache_bench` | 0 | ALL PASS  16/16 | PASS (0) | catch→1 (throw would read as FAIL) |
| 51 | `b06_downgrade_bench` | 0 | [provider_downgrade] donna: deepseek failed (bench-scripted donna-deepseek failure) — Haiku for the rest of th | PASS (0) | catch→1 (throw would read as FAIL) |
| 52 | `b06_f0613_relay_bench` | 0 | THE LIVE VERDICT IS EVENING FIVE'S — declared here, never claimed. | PASS (0) | DIST MISSING refusal exits 1 (:27). Cure: 1→3 |
| 53 | `b06_f0658_bench` | 0 | GREEN — the law that was ruled for every room now reaches every room; the planner's | PASS (0) |  |
| 54 | `b06_f0667_bench` | 0 | GREEN — the lens closes the prompt and not merely its file; business and consult | PASS (0) |  |
| 55 | `b06_f0681_bench` | 0 | THE LIVE VERDICT IS OUTSTANDING: the next gauntlet run's | PASS (0) |  |
| 56 | `b06_f0692_bench` | 0 | 23/23 PASS | PASS (0) | catch→1 (throw would read as FAIL) |
| 57 | `b06_forkc_wireguard_bench` | 0 | [wire-guard report file] insert refused | PASS (0) |  |
| 58 | `b06_fresh_thread_bench` | 0 | 10/10 PASS | PASS (0) | no catch: throw→node 1. Cure: append .catch(...exit(2)) |
| 59 | `b06_gauntlet` | 2 | ANTHROPIC_API_KEY absent — the incumbent lane cannot run. Set it in this shell (never paste it anywhere else)  | ERROR (2) — but the 2 is a REFUSAL (ANTHROPIC_API_KEY absent, :4548) | refusal exits 2 (:4548 key, :2586 dist); catch→1 (:4619). Cure: 2→3 ×2, 1→2 ×1 |
| 60 | `b06_m0_bench` | 0 | GREEN — her sentence survives the routing token, reaches the model once, is claimed first only when it is firs | PASS (0) |  |
| 61 | `b06_m1_bench` | 0 | GREEN — the estate's recency is legible, the clock tells the local truth, and the instrument that grades it ca | PASS (0) |  |
| 62 | `b06_m2_bench` | 0 | GREEN — a recency question met by hands that cannot answer it can no longer be answered with a quiet; the tell | PASS (0) |  |
| 63 | `b06_m3_bench` | 0 | [agent:cap-gate] METER UNREACHABLE — turn allowed through unmetered: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KE | PASS (0) |  |
| 64 | `b06_m4_bench` | 0 | GREEN — first contact answers the person in front of it, money wears the house's own hand, | PASS (0) | catch→1 (throw would read as FAIL) |
| 65 | `b06_m4b_bench` | 0 | GREEN — the register has a floor under its law: the glyph cannot reach the wire, | PASS (0) |  |
| 66 | `b06_m4c_bench` | 0 | GREEN — the voice has its closing clauses back, position is a floor and not a hope, | PASS (0) |  |
| 67 | `b06_m4d_bench` | 0 | GREEN — the context stopped teaching the vocabulary the soul forbids, the law closes | PASS (0) |  |
| 68 | `b06_meter_bench` | 1 | [harvest usage] ledger write failed: relation vanished (bench-scripted failure) | FAIL (1) | catch→1 (throw would read as FAIL) |
| 69 | `b06_pwa_flip_seam_bench` | 0 | 9/9 PASS | PASS (0) |  |
| 70 | `b06_relay_foundations_bench` | 0 | 42/42 cells green | PASS (0) | catch→1 (throw would read as FAIL) |
| 71 | `b06_relay_hand_bench` | 0 | [relaySeat] doorbell not rung: doorbell_threw: meta refused | PASS (0) | catch→1 (throw would read as FAIL) |
| 72 | `b06_sonnet_bench` | 0 | ALL PASS  13/13 | PASS (0) | catch→1 (throw would read as FAIL) |
| 73 | `b06_wa_words_bench` | 0 | 19/19 PASS | PASS (0) | no catch: throw→node 1. Cure: append .catch(...exit(2)) |
| 74 | `b07_auth_crossover_bench` | 0 | GREEN — the specimen is refused at both server edges, the forged couple_id hydrates | PASS (0) |  |
| 75 | `b07_f0772_circle_auth_bench` | 1 | RED  §12.14 NO DATA HALF: this delivery writes nothing to production rows | FAIL (1) |  |
| 76 | `b07_f0774_stripper_bench` | 0 | GREEN — b07_f0774_stripper_bench 20/20 | PASS (0) |  |
| 77 | `b07_f0776_doors_bench` | 0 | 64 passed, 0 failed | PASS (0) |  |
| 78 | `b07_f0784_panel_bench` | 0 | 59 passed, 0 failed | PASS (0) |  |
| 79 | `b07_f0789_phantom_columns_bench` | 0 | 19 passed, 0 failed | PASS (0) |  |
| 80 | `b07_f0791_guard_stack_bench` | 1 | 37 passed, 1 failed | FAIL (1) |  |
| 81 | `b07_p1_bench` | 0 | GREEN — b07_p1_bench 75/75 | PASS (0) | catch→1 (throw would read as FAIL) |
| 82 | `b07_p2_bench` | 0 | GREEN — b07_p2_bench 48/48 | PASS (0) | catch→1 (throw would read as FAIL) |
| 83 | `b07_p3_bench` | 0 | GREEN — b07_p3_bench 55/55 | PASS (0) | no catch: throw→node 1. Cure: append .catch(...exit(2)) |
| 84 | `b07_p4a_ig_bench` | 0 | [igImport] IG_REDIRECT_URI does not end at the canonical callback path. Expected pathname "/api/v2/vendor/ig/c | PASS (0) | no catch: throw→node 1. Cure: append .catch(...exit(2)) |
| 85 | `b07_p4b_body_bench` | 1 | RED  b07_p4b_body_bench 75/76 | FAIL (1) |  |
| 86 | `b07_p4b_probe_bench` | 0 | ok   §3.8 the ig router serves exactly P4a's route set — no start route appeared | PASS (0) |  |
| 87 | `b07_p4b_slice1_bench` | 0 | ok   §2.1 the refused server-302 start route is named as refused | PASS (0) |  |
| 88 | `b07_p5_bench` | 1 | [demo-lead-alert] registered-user check FAILED for demo vendor demo-1: users plane down — REFUSING the alert r | FAIL (1) |  |
| 89 | `b07_p6_bench` | 0 | GREEN — b07_p6_bench 29/29 | PASS (0) |  |
| 90 | `b08_console_bench` | 0 | b08_console_bench: 71 passed, 0 failed, 0 skipped | PASS (0) |  |
| 91 | `b08_p1_lifecycle_bench` | 1 | [admin/demo/invite] SENT BUT NOT STAMPED for legacy_jewellers: onInvited refused: illegal_transition (engaged  | FAIL (1) |  |
| 92 | `b08_p3_seeing_surface_bench` | 0 | b08_p3_seeing_surface_bench: 61 passed, 0 failed, 0 skipped | PASS (0) |  |
| 93 | `b08_p4_factory_bench` | 0 | b08_p4_factory_bench: 83 passed, 0 failed, 0 skipped | PASS (0) |  |
| 94 | `b08_p5_closer_bench` | 0 | [closer:watch] prospect=p1 conv=cK classes=marketplace_presence signed=false normalized=0 provider=anthropic — | PASS (0) |  |
| 95 | `b08_p5_closer_scenarios` | 0 | [provider_misconfigured] deepseek routed but its key is absent — anthropic fallback | exit 0 — transcript generator, no verdict; prints DEEPSEEK_API_KEY ABSENT and proceeds | no verdict semantics; chair question |
| 96 | `b08_p5_eliza_bench` | 0 | [model_refused] wa_marketing.nudge_model="claude-sonnet-4-6" is outside this surface's allow-set (F-08.84) — f | PASS (0) |  |
| 97 | `b08_p5_invite_bench` | 0 | [admin/demo/invite] SENT BUT NOT STAMPED for swatitomar_p4b: markInviteSent refused: already_stamped (2026-09- | PASS (0) |  |
| 98 | `b08_p5_oow_relay_bench` | 1 | [enquiry:oow] brief FAILED key=enquiry_brief_vendor ctx=bench: Meta send failed: code 132001 | FAIL (1) |  |
| 99 | `b08_p5_prospect_intake_bench` | 0 | [admin:prospects] registered check FAILED for 919000000123: db down — REFUSING: nothing is waiting on this, an | PASS (0) |  |
| 100 | `b08_p5_unblock_bench` | 1 | [enquiry-enrichment] failed (non-fatal): supabase.from(...).select(...).eq(...).eq(...).eq(...).is is not a fu | FAIL (1) |  |
| 101 | `b08_p6_purge_bench` | 0 | b08_p6_purge_bench: 60 passed, 0 failed, 0 skipped | PASS (0) | catch→1 (throw would read as FAIL) |
| 102 | `b09_d3_structural_bench` | 0 | VERDICT: GREEN | PASS (0) |  |
| 103 | `b09_d3b_singlepersist_bench` | 0 | VERDICT: GREEN | PASS (0) |  |
| 104 | `b09_d4_honestmouth_bench` | 0 | [bride-webhook] muse save failed: pipeline exploded | PASS (0) |  |
| 105 | `b09_f09173_bride_media_bench` | 0 | GREEN — the seam is filled, both doors see, and the vendor lane did not move. | PASS (0) |  |
| 106 | `b10_p1_search_bench` | 1 | [requireAdmin] ADMIN_SESSION_SECRET is not set on this service — REFUSING every session. This door fails CLOSE | FAIL (1) |  |
| 107 | `b10_p2_bridge_bench` | 1 | b10_p2_bridge_bench: 73 passed, 9 failed  (total 82) | FAIL (1) | catch→1 (throw would read as FAIL) |
| 108 | `b10_p3_mint_deck_bench` | 1 | b10_p3_mint_deck_bench: 145 passed, 2 failed  (total 147) | FAIL (1) | catch→1 (throw would read as FAIL) |
| 109 | `b14_d1_visibility_bench` | 0 | b14_d1_visibility_bench: 36 passed, 0 failed  (total 36) | PASS (0) | catch→1 (throw would read as FAIL) |
| 110 | `b14_d2_template_bench` | 0 | b14_d2_template_bench: 27 passed, 0 failed  (total 27) | PASS (0) |  |
| 111 | `b14_d3_polls_bench` | 0 | b14_d3_polls_bench: 68 passed, 0 failed  (total 68) | PASS (0) | catch→1 (throw would read as FAIL) |
| 112 | `b14_d4_delegation_bench` | 0 | [DELETE /couple/circle/member] delegation clear error: bench: forced clear failure | PASS (0) | catch→1 (throw would read as FAIL) |
| 113 | `b14_d5_copy_bench` | 0 | 38/38 cells green | PASS (0) |  |
| 114 | `b15_schema_register_bench` | 0 | GREEN — the register survives its own generator. | PASS (0) | catch→1 (throw would read as FAIL) |
| 115 | `b16_p1_engagements_bench` | 0 | VERDICT: GREEN | PASS (0) |  |
| 116 | `b36_leadgate_a_bench` | 0 | [leadgate] UNKNOWN TIER 'undefined' on vendor 23165e38-6510-4639-ab6a-9f35bab93742 — resolved to BASIC and the | PASS (0) |  |
| 117 | `b37_f1625_band_floor_bench` | 0 | ok   the serializer census DISPOSITIONED the new key (R-37.4's guard answered) | PASS (0) |  |
| 118 | `b38_doorboot_enrich_bench` | 0 | ok   12.3  and the shared fallback is UNMOVED for its other callers | PASS (0) | catch→1 (throw would read as FAIL) |
| 119 | `b39_telemetry_bench` | 0 | ok   6.7  a single error declares NO count — quiet on the common case | PASS (0) | catch→1 (throw would read as FAIL) |
| 120 | `b39_worklist_today_bench` | 0 | [leadgate] UNKNOWN TIER 'gold' on vendor 11111111-1111-4111-8111-111111111111 — resolved to BASIC and the lead | PASS (0) | catch→1 (throw would read as FAIL) |
| 121 | `b3_rider_bench` | 0 | 20/20 PASS | PASS (0) — assert.ok design, no exit call, no catch | a real fail and a load error are both node's 1 — WIDER (report, ~10 lines) |
| 122 | `b41_ist_clock_bench` | 0 | GREEN — the IST day has one home, six doors read it, and the header | PASS (0) |  |
| 123 | `b43_solutions_doors_bench` | 0 | 35 PASS · 0 FAIL | PASS (0) |  |
| 124 | `b44_public_vendor_card_bench` | 0 | 47 PASS · 0 FAIL | PASS (0) |  |
| 125 | `b45_precutover_seat_bench` | 0 | 9 PASS · 0 FAIL | PASS (0) |  |
| 126 | `b46_money_books_bench` | 0 | 29 PASS · 0 FAIL | PASS (0) |  |
| 127 | `b47_money_crossing_bench` | 0 | b47 — 23 PASS · 0 FAIL | PASS (0) |  |
| 128 | `b48_engine_mounts_bench` | 0 | 6 passed, 0 failed | PASS (0) | catch→1 (throw would read as FAIL) |
| 129 | `b49_writer_hygiene_bench` | 0 | b49 — 13 PASS · 0 FAIL | PASS (0) |  |
| 130 | `b50_preflight_verdict_bench` | 0 | GREEN — b50_preflight_verdict 8/8 | PASS (0) |  |
| 131 | `b51_invoice_document_bench` | 0 | GREEN — b51 invoice document 67/67 | PASS (0) |  |
| 132 | `b52_vendor_rails_door_bench` | 0 | GREEN — b52 vendor rails door 29/29 | PASS (0) |  |
| 133 | `b5_describe_bench` | 0 | 18/18 PASS | PASS (0) | catch→1 (throw would read as FAIL) |
| 134 | `b5_wa_door_bench` | 0 | 32/32 PASS | PASS (0) |  |
| 135 | `b5_wa_door_smoke` | 3 | STOP — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. | REFUSED (3) |  |
| 136 | `b5_webhookcore_bench` | 0 | GREEN — webhookCore's surviving surface holds: inbound log + empty guard, non-vacuously. 32 cells RETIRED at M | PASS (0) |  |
| 137 | `b5b_movementb_bench` | 2 | BENCH ERROR TypeError: Cannot read properties of undefined (reading 'length') | ERROR (2) — uncaught TypeError :225 | code correct; bench itself broken; sits in base as RED — REPORT, not this sitting's cure |
| 138 | `b5c_prospect_lane_bench` | 0 | [dead-letter] captured failed turn id-1 service=marketing phone=9199 | PASS (0) |  |
| 139 | `b6_door_rider_bench` | 0 | 15/15 PASS | PASS (0) | catch→1 (throw would read as FAIL) |
| 140 | `b6_f79_bench` | 0 | [harvest usage] ledger write failed: supabase.schema is not a function | PASS (0) | catch→1 (throw would read as FAIL) |
| 141 | `b6_f80_bench` | 0 | [harvest usage] ledger write failed: supabase.schema is not a function | PASS (0) | catch→1 (throw would read as FAIL) |
| 142 | `b6_floors_bench` | 0 | 47/47 PASS | PASS (0) | dist-absent refusal exits 2 (:130); catch→1 (:271). Cure: 2→3, 1→2 |
| 143 | `b6_open_question_bench` | 0 | ALL PASS  28/28 | PASS (0) | catch→1 (throw would read as FAIL) |
| 144 | `b6_referent_bench` | 0 | 36/36 PASS | PASS (0) | catch→1 (throw would read as FAIL) |
| 145 | `b6_rider_bench` | 0 | [harvest usage] ledger write failed: supabase.schema is not a function | PASS (0) | catch→1 (throw would read as FAIL) |
| 146 | `b6_s1_bench` | 0 | 24/24 PASS | PASS (0) |  |
| 147 | `b6_s2_bench` | 0 | 48/48 PASS | PASS (0) |  |
| 148 | `b6_sitting2_bench` | 0 | [door:composed-reply] bench: update forced to fail | PASS (0) | catch→1 (throw would read as FAIL) |
| 149 | `b6_witness_bench` | 0 | 22/22 — ALL PASS | PASS (0) |  |
| 150 | `bOB_d2_onboarding_gate_bench` | 0 | [onboarding-gate] failed open: detonated inside the predicate | PASS (0) |  |
| 151 | `bOB_m_bridename_fill_bench` | 0 | bOB_m_bridename_fill_bench: 19 ok, 0 FAIL | PASS (0) |  |
| 152 | `bOB_micro_predicate_wire_bench` | 0 | [couple:onboarding] users name error: boom | PASS (0) |  |
| 153 | `bOB_taxonomy_bench` | 0 | VERDICT: GREEN | PASS (0) |  |
| 154 | `bf1_bride_tool_fidelity_bench` | 3 | BF1_VERDICT: NOT_RUN reason=no_key write_red=0 cells=0/0 | REFUSED (3) |  |
| 155 | `checker_bench` | 0 | ERROR gate                BENCH-ONLY by deliberate restraint, CE-accepted. | PASS (0) |  |
| 156 | `closerReads` | 0 | (no output) | exit 0 — NOT A BENCH (shared reader run by the glob) | chair question |
| 157 | `tdw09_micro_bench` | 0 | PASS  §4.8 COPY — expected-zero: the four error strings are byte-identical | PASS (0) |  |
| 158 | `tdw09_p2b_vocab_os` | 0 | tdw09_p2b_vocab_os: 18 passed, 0 failed (total 18) | PASS (0) |  |
| 159 | `tdw09_rider2_budget` | 0 | N-5  route      delete budget_total from the patch     §1.3 RED | PASS (0) |  |
| 160 | `tdw10_billing_bench` | 0 | ALL GREEN — 52 green, 0 red | PASS (0) |  |
| 161 | `tdw10_combined_cap_bench` | 0 | tdw10_combined_cap: 37 passed, 0 failed  (total 37) | PASS (0) |  |
| 162 | `tdw10_selfserve_bench` | 0 | tdw10_selfserve: 30 passed, 0 failed | PASS (0) |  |
| 163 | `tdw10_tier_bench` | 0 | tdw10_tier_bench: 81 passed, 0 failed  (total 81) | PASS (0) |  |
| 164 | `tdw15_p1_receipt_image` | 0 | tdw15_p1_receipt_image: 26 passed, 0 failed  (total 26) | PASS (0) |  |
| 165 | `tdw15_p3_daystogo_bench` | 0 | PASS 13   FAIL 0 | PASS (0) |  |
| 166 | `test-shape` | 1 | ✗ ANTHROPIC_API_KEY not set in environment. Run inside your Codespace where the key exists. | FAIL (1) — but the 1 is a REFUSAL (ANTHROPIC_API_KEY absent, :32) | refusal exits 1. Cure: 1→3. Sits in base as RED |
| 167 | `tdw10c_couple_meter_bench` | 0 | [couple-cap] meter unreadable — FAILING OPEN, the turn proceeds: admin_config is on fire | PASS (0) |  |
| 168 | `tdw15_f1510_category_vocabulary_bench` | 0 | 11/11 cells green | PASS (0) |  |

**168 benches · exit 0 — NOT A BENCH (middleware export run by the glob): 1 · PASS (0): 144 · FAIL (1): 15 · ERROR (2) — but the 2 is a REFUSAL (ANTHROPIC_API_KEY absent, :4548): 1 · exit 0 — transcript generator, no verdict; prints DEEPSEEK_API_KEY ABSENT and proceeds: 1 · PASS (0) — assert.ok design, no exit call, no catch: 1 · REFUSED (3): 2 · ERROR (2) — uncaught TypeError :225: 1 · exit 0 — NOT A BENCH (shared reader run by the glob): 1 · FAIL (1) — but the 1 is a REFUSAL (ANTHROPIC_API_KEY absent, :32): 1**

## dreamos-pwa — E-1 exit-code census (measured pass; warm-up discarded; rc captured direct)

| # | bench | rc | printed verdict / reason line | table class | off-table? |
|---|---|---|---|---|---|
| 1 | `b05_f0589_pwa_name_wire_bench` | 0 | 14 PASS · 0 FAIL   (14 cells) | PASS (0) |  |
| 2 | `b40_worklist_shell_bench` | 0 | FLOOR GREEN | PASS (0) | on-table: fails→1 (RED wins), refusals-only→3 (:3546). No cure |
| 3 | `b41_theme_bleed_fixture` | 0 | OPEN-AS-NARROWED and the founder's eye is the verdict on the card: | PASS (0) | REFUSED exits 1 (:153 theme unreadable); catch prints REFUSED and exits 1 (:271 — throw AND refusal on one code). Cure: :153 1→3; :271 split not one-line — REPORT |
| 4 | `b50_fetch_loop_bench` | 3 | This is NOT a pass and NOT a fail: the harness could not be stood up. | REFUSED (3) | on-table (F-39.55 reference shape); :499 exit 1 is the loop-fail verdict, not a catch |
| 5 | `f04_94_cure2_session_shape` | 0 | CURE-2b SESSION-SHAPE: ALL GREEN | PASS (0) |  |
| 6 | `f04_96_three_rail_session` | 0 | F-04.96 THREE-RAIL SESSION-SHAPE: ALL GREEN | PASS (0) |  |
| 7 | `f0539_demo_authority` | 0 | F-05.39 DEMO AUTHORITY: ALL GREEN | PASS (0) |  |
| 8 | `obp_bride_form` | 0 | VERDICT: GREEN | PASS (0) |  |
| 9 | `obp_vendor_form` | 0 | VERDICT: GREEN | PASS (0) |  |
| 10 | `tdw05_p3d_board_tiles` | 0 | tdw05_p3d_board_tiles: 24 passed, 0 failed | PASS (0) |  |
| 11 | `tdw05_p3d_prospect_exit` | 0 | tdw05_p3d_prospect_exit: 28 passed, 0 failed | PASS (0) |  |
| 12 | `tdw06_f06133_drawer` | 0 | TDW_06 F-06.133 DRAWER REMOVAL: ALL GREEN  41/41 | PASS (0) |  |
| 13 | `tdw06_m3_report_chip` | 0 | TDW_06 M-3 REPORT CHIP: ALL GREEN | PASS (0) |  |
| 14 | `tdw07_f0760_claim` | 0 | GREEN — tdw07_f0760_claim 82/82 | PASS (0) |  |
| 15 | `tdw07_f0766_orphan` | 0 | GREEN — tdw07_f0766_orphan 28/28 | PASS (0) |  |
| 16 | `tdw07_f0772_circle` | 0 | GREEN — tdw07_f0772_circle 132/132 | PASS (0) |  |
| 17 | `tdw07_f0784_panel` | 0 | 34 passed, 0 failed | PASS (0) |  |
| 18 | `tdw07_f0789_conversations` | 0 | 30 passed, 0 failed | PASS (0) |  |
| 19 | `tdw07_f0790_dashboard` | 0 | 8 passed, 0 failed | PASS (0) |  |
| 20 | `tdw07_p1_discover` | 0 | GREEN — tdw07_p1_discover 44/44 | PASS (0) |  |
| 21 | `tdw07_p2_profile` | 1 | RED — tdw07_p2_profile 42/48 | FAIL (1) |  |
| 22 | `tdw07_p3_portfolio` | 1 | RED — tdw07_p3_portfolio 43/119 | FAIL (1) |  |
| 23 | `tdw07_p4a_ig` | 0 | GREEN — tdw07_p4a_ig 69/69 | PASS (0) |  |
| 24 | `tdw07_p4b_body` | 1 | RED  tdw07_p4b_body 129/134 | FAIL (1) |  |
| 25 | `tdw07_p4b_probe` | 0 | ok   §5.4 [NEW R-1 · acceptance ①] absent elsewhere BY CONSTRUCTION — the detection returns false wherever nav | PASS (0) |  |
| 26 | `tdw07_p4b_slice1` | 0 | ok   §3.6 the restored page re-mints when its state has aged past the threshold | PASS (0) |  |
| 27 | `tdw07_p6_fold` | 0 | GREEN — tdw07_p6_fold 68/68 | PASS (0) |  |
| 28 | `tdw08_console` | 0 | GREEN — tdw08_console 55/55 | PASS (0) | HARNESS REFUSED (stale read set) exits 1 (:48). Cure: 1→3 |
| 29 | `tdw08_p3_landing` | 1 | RED — tdw08_p3_landing 86/89 | FAIL (1) |  |
| 30 | `tdw08_p4_factory` | 0 | GREEN — tdw08_p4_factory 45/45 | PASS (0) |  |
| 31 | `tdw08_p5_invite_spent` | 0 | GREEN — tdw08_p5_invite_spent 14/14 | PASS (0) |  |
| 32 | `tdw08_p5_prospects_console` | 1 | tdw08_p5_prospects_console: 52 passed, 2 failed | FAIL (1) |  |
| 33 | `tdw09_frost_parity` | 0 | M-12 floor       restore one 7px body site                 §6.11/6.12 RED | PASS (0) |  |
| 34 | `tdw09_home` | 0 | ALL GREEN | PASS (0) |  |
| 35 | `tdw09_hotfix` | 0 | tdw09_hotfix: 38 passed, 0 failed (total 38) | PASS (0) |  |
| 36 | `tdw09_landing` | 0 | GREEN — tdw09_landing 103/103 | PASS (0) |  |
| 37 | `tdw09_money` | 0 | GREEN — 18 passed, 0 failed | PASS (0) |  |
| 38 | `tdw09_p1_canon` | 1 | Error: ENOENT: no such file or directory, open 'scripts/tdw09_vendor_census.mjs' | FAIL (1) |  |
| 39 | `tdw09_p2_doors` | 1 | tdw09_p2_doors: 68 passed, 17 failed  (total 85) | FAIL (1) |  |
| 40 | `tdw09_p2b` | 0 | tdw09_p2b: 29 passed, 0 failed (total 29) | PASS (0) |  |
| 41 | `tdw09_p2b_vocab` | 0 | tdw09_p2b_vocab: 16 passed, 0 failed (total 16) | PASS (0) | header says sibling-absent cells 'REFUSE … and exit RED' by design (:6-7) — chair: refusal-as-RED doctrine vs F-39.47 |
| 42 | `tdw09_p2c` | 1 | AssertionError [ERR_ASSERTION]: 8 cell(s) failed | FAIL (1) — assert.strictEqual(fail,0) design, no exit call | a real fail and a load error are both node's 1 — WIDER (report) |
| 43 | `tdw09_p2r1` | 0 | tdw09_p2r1: 13 passed, 0 failed (total 13) | PASS (0) |  |
| 44 | `tdw09_palette` | 1 | RED — 14 passed, 4 failed | FAIL (1) |  |
| 45 | `tdw09_roles` | 1 | RED — 122 passed, 13 failed | FAIL (1) |  |
| 46 | `tdw09_surface` | 1 | tdw09_surface: 46 passed, 5 failed | FAIL (1) | REFUSED (not a clone / stale read set) exits 1 (:34,:39). Cure: 1→3 ×2 |
| 47 | `tdw09_surface_census` | 0 | .css sites the roster regexes could not see           : 0 | PASS (0) | REFUSED (not a clone) exits 1 (:42,:49). Cure: 1→3 ×2 |
| 48 | `tdw09_theme_retire` | 1 | RED — 14 passed, 2 failed | FAIL (1) |  |
| 49 | `tdw09_type` | 1 | tdw09_type: 13 passed, 3 failed | FAIL (1) | REFUSED (census instrument absent) exits 1 (:37); no catch on async main. Cure: 1→3; .catch(...exit(2)) |
| 50 | `tdw09_type_census` | 0 | distinct declared sizes    10   -> 9 named rungs | PASS (0) | REFUSED exits 1 (:42 not a clone; :177/:180/:198 are --apply usage errors). Cure: :42 1→3; usage sites → 2 |
| 51 | `tdw09_uivendor` | 1 | tdw09_uivendor: 62 passed, 14 failed  (total 76) | FAIL (1) |  |
| 52 | `tdw09_walkrider` | 0 | ok   §5.2 THE PER-SITE GUARD — the leads page carries ZERO pinned-cream inks while the Discover hero keeps its | PASS (0) |  |
| 53 | `tdw10_billing_tab` | 1 | tdw10_billing_tab: 22 passed, 17 failed (total 39) | FAIL (1) |  |
| 54 | `tdw10_p1_shell` | 0 | ok   the stale invite-requests pointer in the shell comment is cured | PASS (0) |  |
| 55 | `tdw10_p2_bridge` | 0 | tdw10_p2_bridge: 44 passed, 0 failed  (total 44) | PASS (0) |  |
| 56 | `tdw10_p2_retint` | 1 | tdw10_p2_retint: 55 passed, 21 failed  (total 76) | FAIL (1) |  |
| 57 | `tdw10_p3_deck` | 1 | tdw10_p3_deck: 191 passed, 2 failed  (total 193) | FAIL (1) |  |
| 58 | `tdw10_tier` | 0 | tdw10_tier: 107 passed, 0 failed  (total 107) | PASS (0) |  |
| 59 | `tdw13_d1_dead_tree` | 0 | VERDICT: GREEN | PASS (0) |  |
| 60 | `tdw13_d2_beta_gate` | 0 | VERDICT: GREEN | PASS (0) |  |
| 61 | `tdw13_d3_choreography` | 0 | VERDICT: GREEN | PASS (0) |  |
| 62 | `tdw13_d4_extraction` | 1 | VERDICT: RED | FAIL (1) |  |
| 63 | `tdw13_d6_parity_matrix` | 0 | VERDICT: GREEN | PASS (0) | sibling-absent ABORT exits 1 (:49) — preflight names it. Cure: 1→3 |
| 64 | `tdw13_d7_dream_design` | 0 | VERDICT: GREEN | PASS (0) |  |
| 65 | `tdw14_d3b_polls` | 0 | tdw14_d3b_polls: 131 passed, 0 failed  (total 131) | PASS (0) |  |
| 66 | `tdw14_d4b_delegation` | 0 | VERDICT: GREEN | PASS (0) |  |
| 67 | `tdw14_d5_welcome` | 0 | 66/66 cells green | PASS (0) |  |
| 68 | `tdw14_d5c_step9` | 0 | 39/39 cells green | PASS (0) |  |
| 69 | `tdw14_f1410_fab_clamp` | 0 | tdw14_f1410_fab_clamp: 18 passed, 0 failed  (total 18) | PASS (0) |  |
| 70 | `tdw15_p1_events` | 0 | tdw15_p1_events: 38 passed, 0 failed  (total 38) | PASS (0) | sibling-absent ABORT exits 1 (:175). Cure: 1→3 |
| 71 | `tdw15_p2_envelopes` | 0 | tdw15_p2_envelopes: 57 passed, 0 failed  (total 57) | PASS (0) |  |
| 72 | `tdw15_p3_moments` | 0 | PASS 6   FAIL 0 | PASS (0) |  |
| 73 | `tdw15_p3_pulse` | 0 | PASS 5   FAIL 0 | PASS (0) |  |
| 74 | `tdw16_r2_leads_truth` | 0 | GREEN | PASS (0) |  |
| 75 | `tdw19_p2a_profile_core` | 0 | 14 PASS · 0 FAIL | PASS (0) | tsc-absent STOP exits 2 (:86) — precondition, not throw. Cure: 2→3 |
| 76 | `tdw37_hygiene_false_success` | 0 | §3 · THE CENSUS TRIPWIRE — read-first (ii), pinned not cured | PASS (0) |  |
| 77 | `tdw37_leadgate_b_slot` | 0 | ok   a redacted wire STILL carries the name, so the tripwire has teeth | PASS (0) |  |
| 78 | `tdw_auth_crossover` | 1 | RED — tdw_auth_crossover 40/46 | FAIL (1) |  |
| 79 | `tdw_f0770_authority` | 1 | RED — tdw_f0770_authority 39/104 | FAIL (1) |  |
| 80 | `tdw_f0774_readers` | 1 | comes out of it the day BOTH cure sittings land. A red with a name is not noise. | FAIL (1) | zero-file derivation REFUSED exits 1 (:367). Cure: 1→3 |
| 81 | `tdw_f0774_stripper` | 1 | RED — tdw_f0774_stripper 28/37 | FAIL (1) |  |
| 82 | `tdw_f0774_vacuity_probe` | 0 | GREEN — the cure sees what the disease hid. 21 reds at the sitting that minted them. | PASS (0) | dirty-tree STOP exits 1 (:157) and git-unavailable STOP exits 1 (:131) — refusals on the fail code. Cure: 1→3 ×2 |
| 83 | `tdw_f3942_census_guard` | 0 | GREEN — tdw_f3942_census_guard 10/10 | PASS (0) |  |
| 84 | `tdw_f3944_preflight_verdict` | 0 | GREEN — tdw_f3944_preflight_verdict 8/8 | PASS (0) |  |
| 85 | `tdw_f3957_shot_arm` | 0 | GREEN — f3957 shot arm 17/17 | PASS (0) |  |
| 86 | `tdw_m_bridename_gate` | 0 | GREEN — tdw_m_bridename_gate 22/22 | PASS (0) |  |
| 87 | `tdw_p01_sw_nonget` | 0 | tdw_p01_sw_nonget: 4 passed, 0 failed  (total 4) | PASS (0) |  |
| 88 | `tdw_stripper_census` | 0 | the retired naive rule disagrees with the compiler on 220 file(s). | PASS (0) |  |
| 89 | `waDial` | 0 | GREEN — waDial 48/48 | PASS (0) |  |
| 90 | `run-assign-words-proof` | 1 | 23 passed, 1 failed | FAIL (1) | wrapper: set -e; a tsc compile error surfaces as tsc's own 2, a missing binary as 127 — floor reads both as RED. REPORT (wrapper class ×9) |
| 91 | `run-bands-proof` | 0 | bands.proof: 11 passed, 0 failed | PASS (0) |  |
| 92 | `run-city-proof` | 0 | 17 passed, 0 failed | PASS (0) |  |
| 93 | `run-crew-proof` | 0 | 11 passed, 0 failed | PASS (0) |  |
| 94 | `run-mode-bridge-proof` | 0 | GREEN — modeBridge 11/11 | PASS (0) |  |
| 95 | `run-post-access-proof` | 0 | postAccess.proof: 25 passed, 0 failed | PASS (0) |  |
| 96 | `run-roster-mint-proof` | 0 | 22 passed, 0 failed | PASS (0) |  |
| 97 | `run-settle-proof` | 0 | settleWords.proof: 41 passed, 0 failed | PASS (0) |  |
| 98 | `run-tdw15-p3-daystogo-proof` | 0 | PASS 20   FAIL 0 | PASS (0) |  |

**98 benches · PASS (0): 74 · REFUSED (3): 1 · FAIL (1): 22 · FAIL (1) — assert.strictEqual(fail,0) design, no exit call: 1**
