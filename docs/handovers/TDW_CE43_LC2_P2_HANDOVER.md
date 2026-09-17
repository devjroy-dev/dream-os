# repo: dream-os @ 2d3be4eda5ac6a15f0585b948f30c41c115173e2
# TDW · CE-43 · SEAT LC-2 · PACKET 2 · HANDOVER (the dream-os packet) · 2026-09-17

Cut on dream-os `2d3be4eda5ac6a15f0585b948f30c41c115173e2` (packet 1, r3), re-derived at origin by `git ls-remote` at the moment of cutting. No migration: 0168 carries every column this packet writes. The dreamos-pwa packet cuts after this one is final and at origin (R-38.16). Findings used this packet: F-43.76 (filed to LC-3, below).

## §1 · What shipped

| File | What |
|---|---|
| `src/lib/vendor/packageSchedule.js` | NEW. The one home for a package's money and dates: `computeSchedule` (a lead's schedule) and `splitShares` (the room's bar). Pure; the caller passes the IST day. |
| `src/api/vendor/packages.js` | The room's door gains `POST /`, `PATCH /:id` (edit and rename), `DELETE /:id` (soft), `POST /:id/default`; every listed package carries `split`. `validatePackage` refuses 0168's CHECKs by name (422 with the field). |
| `src/api/vendor/leadPackages.js` | NEW. `GET` and `POST /api/v2/vendor/leads/:leadId/package`: the package on a lead, a snapshot with the couple's edits, the computed schedule and the delivery day. |
| `src/api/vendor/core.js` | One mount line: `leadPackages` immediately above `leads`. |
| `scripts/b82_lc2_p2_packages_bench.js` | NEW, rung b82. |
| `scripts/floor-manifest-lc2-p2.txt` | The declared dirt. No new directory (F-43.71 checked). |

## §2 · Rulings carried

- **F19 (a):** the deposit row on a quote carries the attach day in IST (`istTodayStr`, `src/lib/istDay.js`); promotion (packet 3) re-dates it to `advance_received_on`.
- **F20:** round half up on deposit and middle (`Math.floor((total × pct + 50) / 100)`); the remainder is the fee minus both (C-43.2).
- **F21:** the room's split carries shares while the fee is unset and whole rupees once set; it never carries a date.
- **F22 (a):** the lead's package has its own router, mounted above `leads` (the F-40.181 pattern). The leads detail envelope is untouched and the lead gate (b36) never sees these keys.
- **F23:** the per-couple edits are name, description, line items, fee and handover date; any other body key is refused. The vendor's package row is read and never written (R-43.3), proven byte-identical after an edited attach.
- **F24 (a):** only a day-precision wedding date schedules; `month` or `year` refuses `no_wedding_date` (A9 "Add the wedding date first."); a null precision on a dated legacy row reads as `day`.
- **F25 (a):** a handover package without `delivery_on` refuses `no_handover_date`. The PWA maps it to **A9's fourth line, "Add the handover date first."**, approved by the chair under the founder's "go with your lean" delegation (recorded here and in the pwa handover). DEV440 is photography, so the walk cannot reach it; b82 §1.10 and §4.8 cover it.
- **F26 (a):** each schedule row carries the package's own share; the PWA puts it into the vetoed label (P9, A5, V5, Q1). The door carries no words.
- **C-43.3, C-43.4:** the middle payment is due one calendar month before the wedding (day clamped to the shorter month); due today or earlier folds it into the final with the `middle_folded` tell; `middle_enabled` false gives two rows.
- **F10:** a `days` delivery counts from the wedding date, with the `counted_from_wedding` tell.
- **Set default (ratified):** clear the live default, then set the target; a unique-index refusal is `409 default_race`, logged and never retried.

## §3 · Order and half-failures named

- **Re-attach:** the live `lead_packages` row is soft-deleted first, then the new row inserted (`uq_lead_packages_live` allows one live row). If the insert fails after the delete, the lead has no live package; the door answers 500 and logs `[lead-package] … insert failed after the live row was cleared`. The vendor attaches again; nothing reads a deleted row. Proven by b82 §4.12.
- **Set default:** a failure between the clear and the set leaves the vendor with no default, which the partial index permits (as performer's seed does); she sets it again. A second writer landing between the two writes is the reported race (§3.11).
- **Add:** seeds first (`ensureSeeded`), so a vendor who adds before her first read still receives her category's options exactly once.

## §4 · What is proven

**`b82_lc2_p2_packages_bench`: 64/64 on the cured tree**, run from `/tmp`.
- §1 computeSchedule and splitShares driven: the 80,000 walk-shaped case to the day, C-43.2's 1,00,001, half up, the month-end clamp, the fold on either side of today, middle off, on the day, handover, the three refusals, F24's precisions, F26's own shares, the split, and an arithmetic sweep (whole rupees, shares summing to 100, amounts summing to the fee, both helpers).
- §2 validatePackage against 0168's CHECKs.
- §3 the four writes and the list, through the real handlers over a database double that enforces 0168's three unique indexes on insert and update, including the set-default race.
- §4 the attach: edits, the untouched package, re-attach, read, both F24 and F25 refusals, the edit allowlist, deleted package, vendor scope, and the named half-failure.
- §5 the mount order. §6 column existence against `docs/db/PUBLIC_SCHEMA.md` (ladder 0168).
- §7 fourteen mutations of production code, each turning its named cell RED.

**Both ways.** On a clean worktree at `2d3be4e` with the bench copied in: 2 passed, 62 failed. The two greens are §6.1 and §6.2 (the columns were already witnessed by packet 1's regen): true facts at base.

**Readers of the touched files, base and cured identical by exit code and by failing-line count:** b07_p1, b07_p2, b07_p4a_ig, b07_p4b_body, b10_p2_bridge, b20_a2_assistance, b39_worklist_today, b43_solutions_doors, b46_money_books, b47_money_crossing, b48_engine_mounts, b59_g31_s2_google, b59_g34_reminders, b59_mutations, b68_introductions, b6_s2, b73_post_cards, b78_exchange, b81_lc2_p1_seed, tdw15_p1_receipt_image, tdw15_p3_daystogo.

**Not run in the seat's container, declared before the cut (the chair's standing order):** the full dream-os floor (the container's 300 s limit); anything against the real database (the double is not the database; the walk and the founder's SELECTs are); the environment-refused benches (`b06_gauntlet`, `b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`, `test-shape`). **The founder's provisional floor on the applied tree is their witness, taken before this ZIP was called final.**

## §5 · Filed

- **F-43.76 → LC-3.** A lead whose wedding date is month-only (Victor stores `wedding_date_precision = 'month'`, `src/agent/engine.js:500`, `:523`) cannot be scheduled (F24). The vendor needs a way to make that date exact on the lead without re-typing it.

## §6 · What the pwa packet picks up

The C-43.16 room redesign (folded cards, the fee affordance and its handler, the payment bar with the split, quiet actions, the dashed Add tile, tokens only, `lucide-react` `ChevronDown`); the edit sheet (P7 to P10, P12); the attach sheet (A3, A4) and the lead's package card showing the schedule (A5 to A9 with A9's fourth line); rung b81; the both-theme screenshots on the walk card.

Sequencing beyond this sitting is the founder's.
