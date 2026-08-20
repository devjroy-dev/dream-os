# TDW_15 · P3 · ZIP 1 (dream-os) — THE DAY BOUNDARY, ONE SEMANTIC, ONE HOME

**Executor seat under CE-35, 2026-08-20.**
**CE-56 attestation — fresh `git fetch -q origin` at the seat's own full clones before any claim below:**
`dream-os` **3e6c839** · `dreamos-pwa` **94dd738**. Both match the charter's tips-at-charter. Sibling-full throughout.

**Serves:** R-35.23 (days-to-go, one semantic, one home per repo, both repos, two ZIPs, dream-os first). This is ZIP 1 of 2. **ZIP 2 (dreamos-pwa) is HELD** behind the founder's veto of the pulse line — see §8.

---

## 1 · WHAT SHIPPED

| path | state | what |
|---|---|---|
| `src/lib/istDay.js` | NEW | the one day-boundary home, dream-os side: `IST_OFFSET_MS`, `dateKey`, `istTodayStr`, `daysUntilIst` |
| `src/api/couple/today.js` | MODIFIED | `days_until_wedding` cured to the ruled IST semantic; the adjacent unruled fault declared in-comment |
| `scripts/tdw15_p3_daystogo_bench.js` | NEW | the both-ways bench, fixture clocks throughout |
| `scripts/floor-manifest-tdw15-p3.txt` | NEW | this delivery's declared-dirt table for `--delivery` [F-14.16] |
| `docs/handovers/TDW_15_P3_ZIP1_HANDOVER.md` | NEW | this document |

**Not touched, and each for a stated reason:** `src/agent/brideNudge.js` (READ-ONLY by R-35.23; W-1's) · `src/brideCron.js` (same lane, unruled) · `docs/FINDINGS_LOG.md` (a chair's band, not an executor's) · `scripts/floor-base.txt` (see §5) · every pwa byte (ZIP 2's).

---

## 2 · F-15.17 — THE BODY (committed home; the next band adopts by reference)

**F-15.17 · OPEN → CURED SERVER-SIDE BY THIS ZIP, pwa limb open until ZIP 2.**

Three derivations of the same fact disagreed at the tip:

| site | day basis | rounding | wedding past |
|---|---|---|---|
| `lib/frost/tokens.ts` · `daysUntil` (pwa) | device-local midnight | `Math.round` | clamps 0 |
| `src/api/couple/today.js` (dream-os) | **host-local midnight — UTC on Railway** | `Math.ceil` | clamps 0 |
| `src/agent/brideNudge.js` · `buildNudge` | **IST midnight** | `Math.round` | `null` |

The door's ink subtracted a **host-local** midnight from `new Date(couple.wedding_date)`, which ECMAScript parses as a **UTC** midnight. Railway runs UTC, so from 00:00 to 05:30 IST the two bases diverged by a day and the door returned **one high for five and a half hours out of every twenty-four**. TDW_15 acceptance 4 — *days-to-go correct across IST midnight* — **failed at the tip**, silently, on the number the bride wakes to.

**The ruled semantic (R-35.23):** the estate serves the wedding's timezone, which is IST. `couples.wedding_date` is a bare `date` — witnessed at its column LINE, `docs/db/PUBLIC_SCHEMA.md` block `## public.couples · 23 columns`, line `4. wedding_date date` (F-SW.9 standing: headers untrusted, column lines are the witness) — and a bare date carries no other timezone to serve.

**The mechanism, written into `src/lib/istDay.js`'s header so nobody simplifies it back:** the cure is **not** to avoid the UTC parse. It is to put **both operands through the same parse** — `new Date(<wedding YYYY-MM-DD>)` and `new Date(istTodayStr(now))` are both UTC midnights of date strings, the shared basis cancels in the subtraction, and what survives is a pure count of calendar days between two IST dates. The header names the two "simplifications" that reinstate the bug (swapping the origin for `new Date()` + `setHours(0,0,0,0)`; appending `T00:00:00` to the wedding string) and carries an F-06.85 conditional naming its mechanical premise — that the column is a `date` and not a `timestamptz`.

`buildNudge` is cited in-comment **by path and by symbol** as the reference implementation and is byte-untouched. **One deliberate divergence is named in the file** so no reader reports it as a mirroring error: `buildNudge` returns `null` for a past wedding, `daysUntilIst` clamps 0, because R-35.23 preserved the door's existing clamp.

---

## 3 · F-15.18 — DECLARED GAP, carried forward

**F-15.18 · OPEN.** The morning line has no honest source. `brideCron.js` sends `buildNudge`'s string over WhatsApp and `console.log`s it truncated at 60 characters; the only DB write is `couples.nudge_sent_at`, a **timestamp, not the text**. `buildNudge` is additionally gated on the WA 24h window *before* it composes (`no_conversation` / `no_inbound_ever` / `window_closed`), so a bride who has not messaged in a day has no line at all — and its content (days-to-go + today's events + dues) duplicates the masthead's own facts. A persisted output plane is its own future charter, Mira-adjacent, queued near Row 9. **No morning line ships this sitting and no gap is hidden.**

---

## 4 · ADJACENT, UNRULED, REPORTED — needs a chair number

`src/api/couple/today.js`'s `todayStr` is a **server-UTC** day key and the `events today` / `upcoming` queries ride it. Between 00:00 and 05:30 IST the door therefore reads **yesterday's IST date** for "today". Same fault class as F-15.17, different value.

**It is left byte-untouched and declared in-comment.** R-35.23 chartered days-to-go; this seat does not widen a ruling to reach an adjacent defect (§0.2, §8). **No bench cell pins it** — a cell asserting today's defect would be a tripwire against tomorrow's cure (F-15.12). Reported here for a chair number and a ruling.

---

## 5 · BENCHES — BOTH WAYS, REDS FROM THE RUN'S OWN OUTPUT (R-33.10)

`scripts/tdw15_p3_daystogo_bench.js`, 13 cells. **Every clock in it is a fixture clock**; not one cell reads the wall, so the run gives the same verdict at 03:00 IST as at noon. A bench for a midnight bug that can only fail at midnight is not a bench.

Fixture figures **derived by command, not drafted**: wedding `2027-02-14` is 178 days from `2026-08-20` and 177 from `2026-08-21`; `2026-08-20T20:00:00Z` is `01:30 IST` on the 21st — inside the disagreement window.

**CURED TREE — 13 PASS / 0 FAIL.**

**UNCURED TREE (origin `3e6c839`, bench copied in alone) — 3 PASS / 10 FAIL.** The named red, verbatim from the run:

```
FAIL  §4.1 THE RED SITE — at 01:30 IST the door returns 177, not 178
      —  door returned 178, expected 177
```

§4.2, §4.3 and §1.2 **PASS on the uncured tree**, which is what proves the no-regression cells are no-regression cells rather than passengers.

**THREE PRODUCTION-CODE MUTATIONS on the cured tree, each reddening exactly its own cells:**

| mutation (production source, never test setup) | result |
|---|---|
| **M1** `istDay.js` origin reverted to host-local midnight (the header's own simplification #1) | 10 PASS / 3 FAIL — §3.1 `before 178, after 178 — delta 0`, §3.2 `IST basis gave 178, expected 177`, §4.1 |
| **M2** `today.js` reverted to its inline UTC-ceil derivation | 12 PASS / 1 FAIL — §4.1 only |
| **M3** `brideNudge.js` folded onto the mirror (READ-ONLY breached) | 12 PASS / 1 FAIL — §1.2 `the reference now depends on the mirror — READ-ONLY breached` |

**Non-vacuity is structural, not asserted:** §3.2 requires *both* that the IST basis gives 177 *and* that the UTC basis still gives 178. If the disagreement ever vanishes the cell fails with `this cell is no longer measuring the mechanism` rather than passing against a hard-coded constant.

**One honest qualification on M1:** this container's host TZ is UTC, so "host-local midnight" and "UTC midnight" coincide here — which is precisely Railway's condition, i.e. the production condition the finding describes. On an IST host M1 would redden differently; the mutation is stated with its ground rather than as a bare tick.

**§1.3 is labelled `[DOCUMENTARY, not mechanism]` in the cell name itself** — it asserts that the ruling's required citation is present, and it is not to be read as a mechanism proof.

---

## 6 · FLOORS — WARM, SIBLING-FULL, BOTH REPOS

**`dream-os`** — warm-up discarded (R-33.8), measured pass under `--delivery scripts/floor-manifest-tdw15-p3.txt --check`:
**`FLOOR = NAMED BASE, no delta`** · rc 0 · **21 reds by name**, unchanged: `b05_arc_m4` · `b05_arc_m6` · `b05_f0555_media_dedupe` · `b05_p4_crons` · `b06_gauntlet` · `b06_meter` · `b07_f0772_circle_auth` · `b07_f0791_guard_stack` · `b07_p4b_body` · `b07_p5` · `b08_p1_lifecycle` · `b08_p5_oow_relay` · `b08_p5_unblock` · `b10_p1_search` · `b10_p2_bridge` · `b10_p3_mint_deck` · `b5_wa_door_smoke` · `b5b_movementb` · `bf1_bride_tool_fidelity` · `tdw10_combined_cap` · `test-shape`.
The `[F-14.16]` guard printed all four dirty paths as declared and reported **`declared files unmoved — set and contents both verified`**.

**CONTROL ACCOUNTING — `scripts/floor-base.txt` is NOT amended, and that is the correct accounting, not an omission.** The runner enumerates `ls scripts/*.js`, so `tdw15_p3_daystogo_bench` **joined the floor set** on this delivery and ran **GREEN inside it** — it is absent from the red list above. The base names REDS; a new green bench does not move the red set. No labelled re-baseline is owed here. (R-34.53's labelled pattern is owed at ZIP 2 if the pulse moves the Dream census — see §8.)

**`dreamos-pwa`** — warm-up discarded, measured `--check`: **`FLOOR = NAMED BASE, no delta`** · rc 0 · **6 reds by name**: `run-assign-words-proof` · `tdw08_p5_prospects_console` · `tdw10_p3_deck` · `tdw_auth_crossover` · `tdw_f0770_authority` · `tdw_f0774_stripper`. The pwa tree is byte-clean for this ZIP, so no `--delivery` was needed and **F-14.26 does not bite at ZIP 1**. It bites at ZIP 2, and is declared there.

**ONE FLOOR ARTIFACT WORTH RECORDING, because it was nearly filed as a delta.** The pwa's first measured pass showed **six extra reds** — `run-bands` · `run-city` · `run-crew` · `run-post-access` · `run-roster-mint` · `run-settle`. All six are `.proof.ts` benches behind `run-*-proof.sh` wrappers that **compile TypeScript**, and the seat's clone had no pwa `node_modules`. **Clone layout, not tree** — the exact class the runner's own header warns about. Deps installed, re-run, all six green. Recorded rather than quietly dropped: a floor artifact nobody accounts for is how a real regression gets absorbed.

---

## 7 · GATES

- `node --check` clean on all three touched `.js` files.
- No migration in this ZIP. Ladder tip derived at **0125** (`db/migrations/0125_event_delegation.sql`); next free is **0126**, and per R-35.24 the pages photo-attach sitting takes it — **noted, not reserved**.
- No SQL for the founder to run. No env changes. No new fetch literals (F-15.16 untouched; this ZIP adds no client bytes at all).
- W-1 SHUT and honoured: zero soul/lens/engine/composer/prompt bytes. `brideNudge.js` was READ, cited, and mirrored — never edited, and §1.2 reddens if any hand folds it.

---

## 8 · WHAT ZIP 2 PICKS UP, AND WHAT GATES IT

**ZIP 2 (dreamos-pwa) is HELD until the founder vetoes the pulse line.** Its contents when it cuts:

1. `daysUntil` cured to the IST semantic with the UTC-parse trap commented in M-ROWFIX's pattern — the pwa's one home.
2. The budget pulse on the approved masthead — **R-1 arm (a), narrowed by the founder to the pulse alone**. Client-sum over the existing `GET /couple/envelopes/:coupleId` response, which already carries per-envelope `spent`. **No new door, no new fetch, no new literal.**
3. P3.3 moments grid polish on the 07 image discipline.
4. Matrix ticks in `docs/BRIDE_PARITY_MATRIX.md`: acceptance 5.4's briefing limb **waived by name with the founder's word recorded**; P3.2 **mood half shipped prior / photo half split by R-35.24**.
5. `F-14.26` declared pwa-side (the pwa runner has no `--delivery`, and ZIP 2's tree is dirty by definition).
6. If the pulse moves the Dream census, the amendment is **LABELLED**, cites the founder's word, and the new figure is ratified against `scripts/tdw13_d7_dream_design.proof.mjs`'s own itemisation — **that instrument, not the parity bench** (c-35.13 stands corrected).

**Held out of ZIP 2 by ruling:** pages photo-attach whole (R-35.24) · any today's-items block (C-1/C-2 died as absence) · any morning line (F-15.18) · any byte of the approved masthead other than the pulse addition (the ε3 fence stands honoured).

---

## 9 · WALK CARD — after the founder's rows, ZIP 1 only

Nothing on glass moves for this ZIP: `days_until_wedding` is a server field the frost masthead does not currently read (the masthead runs `daysUntil` client-side, which ZIP 2 cures). **The honest walk for ZIP 1 is the door, not the phone**, and it is only observable between **00:00 and 05:30 IST**. Outside that window the cure is by construction a no-op and §4.2 is the proof of it.

Founder rows first, then the walk. No blind LIMIT — the SELECT anchors on the walking account.

---

*Sequencing beyond this delivery is the founder's.*
