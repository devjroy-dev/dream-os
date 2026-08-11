# TDW_05.P3-D — PROSPECT EXIT DOOR · EXECUTOR HANDOVER

**Sitting:** one · **role:** LE (never pushes) · **chair:** CE-30
**Base:** `dream-os b2e1601` · `dreamos-pwa 7bb6429` (both re-derived fetch-first at sibling clones, both clean)
**Rulings built:** R-30.9 (fork c) · R-30.10 → R-30.21

---

## 1 · WHAT SHIPPED

### dream-os
| path | shape |
|---|---|
| `db/migrations/0119_prospect_discard.sql` | **NEW.** Drops `prospects_state_check` by its live name, re-adds with `'discarded'`, adds `discarded_at timestamptz`. Founder-run only. Reverse **withheld**. |
| `src/lib/prospectExit.js` | **NEW.** Pure, dependency-free. `deleteRefusal` (four members, four keys), `discardRefusal`, `restoreRefusal`, `exitKind`. |
| `src/api/admin/prospects.js` | `DELETE /:id` · `POST /:id/discard` · `POST /:id/restore` minted. `VALID_STATES` +`discarded`. `GET /` stamps `has_conversation` + `exit_kind`. Both intake doors return `already_discarded`. `send-opener` typed-refuses `discarded`. |
| `src/lib/prospects.js` | `noop_discarded` inbound early return (R-30.15). `runConversionMatchJob` `.neq('state','discarded')` (R-30.14). Header states the eighth state. |
| `src/api/admin/bridge.js` | `PROSPECT_STATES` +`discarded`. |
| `src/lib/sendWa.js` | **Comment only.** The declared uncovered layer (R-30.14's boundary), naming all five upstream refusals. |
| `scripts/b05_p3d_prospect_exit_bench.js` | **NEW.** 36 cells, 14 mutations. |
| `scripts/tdw10_combined_cap_bench.js` | **LABELLED AMENDMENT** — §6.4 ladder tip 0118 → 0119. See §4. |

### dreamos-pwa
| path | shape |
|---|---|
| `app/admin/prospects/page.tsx` | Eligibility-aware per-row exit control, two-press confirm, six new refusal keys, three confirms, three toasts. Send opener and Converted disabled on `discarded`. |
| `scripts/tdw05_p3d_prospect_exit.proof.mjs` | **NEW.** 28 cells, 8 mutations. |

---

## 2 · THE ARCHITECTURE, IN ONE PARAGRAPH

A prospect row had no exit while the 10am sweep messaged `cold` rows on its own clock. It now has two, and **the row chooses which**: hard delete for a row that was never contacted, discard for everything else. Hard delete is gated by a four-member discriminator — `last_template_at IS NULL` · no `prospect_marketing` conversation · no `demo_vendor_ref` · not `opted_out` — each with its own typed refusal key. Because the second member is absolute, **the `on delete cascade` chain (`0085:69` → `0001:66`, conversation then every message) is unreachable through this API by construction**. Discard leaves the row visible to history and takes the human out of every reach the lane has. Restore is `discarded → cold` only and names its consequence out loud, because it is the one act here that re-arms a send.

---

## 3 · WHAT IS PROVEN, AND HOW

**`b05_p3d_prospect_exit_bench` — 36 passed, 0 failed · total 36 · run 36 · skipped 0 · in-process, no network, no DB.**
§1–§3 execute the pure module; §4–§8 drive the real admin router through a fake express and a fake supabase plane (R-29.34 reachability). Every one of 14 mutations defaces **production source** and reds:

```
route_absent 30/36 · member_contacted_off 34/36 · member_conversation_off 32/36
member_conversation_truthy 35/36 · member_demo_off 35/36 · member_optout_off 33/36
discard_optout_off 34/36 · lookup_fails_open 35/36 · restore_wildcard 33/36
vocabulary_half_moved 34/36 · sendopener_open 35/36 · inbound_open 34/36
conversion_open 35/36 · intake_key_off 35/36
```

**`tdw05_p3d_prospect_exit.proof` — 28 passed, 0 failed · total 28 · run 28 · skipped 0.** All 8 mutations red.

**Gates:** `npm run build` (→ `tsc -p src/engine/tsconfig.json`) exit 0 · `node --check` clean on all five touched `.js` · pwa `rm -rf .next && npx tsc --noEmit` exit 0, zero `error TS`.

**Floor, sibling-full, chair-run shape:** `b07_p5` 136/136 · `relay_hand` 126/126 · `selfserve` 30/30 · `prospect_intake` 13/13 · `oow_completion`, `bride_arrival`, `relay_foundations`, `f0613`, `tier`, `billing`, `micro`, `forkc` all exit 0 · **pre-declared reds unmoved**: elders meter 28/29, f0555 22/23, f0772 158/159. `combined_cap` 37/37 after the amendment in §4.

---

## 4 · THE ONE AMENDED BENCH — ratify or revert

`tdw10_combined_cap_bench` §6.4 pins the migration ladder's tip. Adding 0119 reddened it (36/37) — **the floor caught this delivery, which is the floor working.** The cell has been re-aimed twice before under the same label and states its own settled shape in-file: *it asserts the ladder's LAW — tip is the highest, no hole is filled, no new duplicate appears — and only the tip's number is a moving part.* This is the third labelled amendment: `0118` → `0119`, **count preserved at 37, teeth kept whole.**

Teeth re-proven after the amendment, not assumed:
- a probe file at `0113` (the reserved hole) → **RED**, "0113 was filled — LD-8 forbids it"
- a duplicate `0119` → **RED**, "the ladder's duplicate set moved … found: 0063, 0119"
- both probes removed; tree clean.

**RATIFY-OR-REVERT.** No other bench was touched.

---

## 5 · SELF-CAUGHT DEFECTS, disclosed at discovery

1. **Two crashing mutations.** `route_absent` and `inbound_open` first exited 2 with no summary. A mutation that kills the harness proves the harness, not the guard. Route re-homed instead of syntactically broken; the closer stubbed (the thing *beyond* the test, never the thing under it) so the escape is an observable failed cell.
2. **A vacuous cell, caught by the mutation matrix.** PATH 5 went green under `conversion_open` because the fake plane had no `vendors` table — the job threw into its own F-07.38 catch and converted nothing on *both* trees. Armed with a claimed vendor; the mutation now bites.
3. **A source-text cell contradicting its own bench's preamble.** PATH 5 was originally a regex over the file. Converted to an executing cell in the same pass.
4. **A cell greening on the wrong control.** The pwa Send-opener cell matched a substring of the *Converted* button's longer condition. Both re-anchored to their own labels; a ninth mutation now bites.
5. **Copy drift.** Three refusal sentences drifted a word from the tabled bytes ("discard **it** instead of deleting"). Corrected byte-exact before delivery.
6. **A stray non-ASCII character** in the 0119 comment block, swept and removed.

---

## 6 · WHAT REMAINS OPEN, NAMED

- **F-05.68's deeper limb** (chair-filed): the opt-out register is protected only by being the value in a mutable column. This delivery cured the two exits it minted; **any future state-writing surface can re-mint them**, because the register has structural readers and no structural guard.
- **The `sendWa` wire gate** (R-30.14's boundary): still a positive gate on `opted_out` alone. Declared in-file at `src/lib/sendWa.js`, with all five upstream refusals named so it cannot be closed silently.
- **The demo-leads no-exit mirror** (`demoAdmin.js` `GET/POST /leads`, no DELETE) — same class, bride PII on the rows. Board item, not this sitting's.
- **F-07.38** is untouched and still true: `vendors.claimed_at` does not exist, so `runConversionMatchJob` remains inert. The `.neq` added here is a guard against the day Block 08 arms it.
- **The F-06.193 rider** (one-tap yes, `ASKING_KINDS` in `relaySeat.js`) stays sequenced after these legs per R-30.4. This delivery certified **zero overlap** with `relaySeat` / `relayToCouple` / `coupleDrafts`.

---

## 7 · NEXT SITTING PICKS UP

The walk card's three legs and the F-05.68 refusal walk are the founder's; the executor reads the evidence. After the legs land, CE-216 banks with F-05.68 alongside the F-06 set.
