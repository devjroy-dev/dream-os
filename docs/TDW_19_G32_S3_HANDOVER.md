# TDW_19 · G3.2 SITTING 3 — DREAM-OS PACKET 1 · HANDOVER

**Seat:** designer-LE · Fable · 2026-09-07
**Base:** `dream-os 3b6ded3` (re-derived at open by `git fetch -q origin`; the kickoff named `09b7f2e+`)
**Governed by:** R-40.120 (the founder's yes on the prototype; C1–C9 ruled) · R-40.121 (the lawyer's yes on clause 5) · R-40.118 · R-40.101 (the prototype is the ratified mock) · R-40.88 · R-40.73 · R-40.114 · R-40.27 · R-40.31 · R-40.44 · R-40.65
**Ratified mock:** `G32_S3_PROTOTYPE.html` (delivered 2026-09-07, R-40.120); lands in `dreamos-pwa/docs/mocks/` with the pwa packet.

---

## 1 · WHAT LANDED

| Ruling | Home | Bytes |
|---|---|---|
| **C1** functions on the record for a client with no lead | `contractSource.js manualFunctions` + `functionsForContract` (events first, manual when none) · `contractPdf.js placeOf(e)` (one lookup for both readers: clause 3's table, clause 5's gate) | `terms.functions_manual` gains its writer's shape and both readers |
| **C2** clause 5 as the Vendor's own words | `contractPdf.js` 5.2 one sentence through `ownWords()` (the clause supplies the full stop) · `contractAnnex.js TRADE_BASE.travel_and_stay_terms` seeded with R-40.73's sentence · `TDW_19_CONTRACT_GENERIC_v4.md` clause 5 amended in place, dated, R-40.121 cited · **`TDW_19_CONTRACT_FIELD_REGISTER_v3.md`** (a delta over v2; v2 untouched) · `0146` renames the stored key | 168 → 166 tokens, census by command |
| **C4** this couple only | `contractSource.js effectiveProfile(fields, terms)` — `{...profile, ...terms.policy_overrides}` computed once, handed to both the renderer's `P` and `deriveMoney`'s `P` | `''` wins and omits |
| **C5** the standard agreement before anything exists | `contractSource.js standardAgreementArgs / renderStandardAgreement / STANDARD_PLACEHOLDERS` · `contractPdf.js isPlaceholder` pass-through in `rs()`/`pct()` · **`GET /api/v2/vendor/contracts/standard`** (declared above `/:contractId/…`; writes only the draft PDF, never a row) | `[your fee]` `[the couple's names]` … are the founder's bytes |
| one call site kept | `contractSource.js render(args)` — both renders hand their args to one expression; b56 §5 and a new §15d cell count it | |
| `0146` | data only: rename `travel_terms` → `travel_and_stay_terms`, drop `same_venue`/`rooms` on stored profiles; two COMMENTs naming the new `terms` keys | no DDL |
| **b56 §15** | 36 cells; 272/272 green; five mutation proofs run RED→GREEN at the seat (§4) | |

C3, C6, C7, C8, C9 are pwa bytes and ride the next packet.

---

## 2 · THE ONE THING THIS PACKET FOUND THAT THE KICKOFF DID NOT NAME — candidate finding, chair to allocate

The standard-agreement render was the first render whose source did **not** load the profile into `terms`, and its first page had no Vendor line at 1.1. The census (`grep -o 'T\.[a-z_0-9]*' contractPdf.js` against the register's PROFILE rows) then showed a class, not a specimen:

| Token | Register home | Was read as |
|---|---|---|
| `vendor_signatory_name` | PROFILE v2 :90 | `T.` at **five** sites — 1.1 and the seal (×4) |
| `vendor_category_words` | seeded PROFILE (v2 :87) | `T.` |
| `exclusions` | PROFILE :106 | `T.` |
| `gst_treatment` · `gst_pct` | PROFILE :130–131 | `T.` |
| `gst_amount` · `fee_payable_with_gst` | DERIVED :132–133, `deriveMoney`'s | `T.` |

Nothing writes any of these to `terms`; the profile sheet writes them to `contract_profiles.fields`. **On every composed agreement rendered before this packet: no Vendor line, no vendor name on the seal, no "in particular, the following are not included", no tax block.** b56's fixture carried all seven in `terms`, so 236 cells were green for the wrong reason. Cured at every site to the register's home; the fixture moved to match; §15e holds the reverse proof (a name in `terms` alone is *not* read). Recorded in register v3 §0-bis. Outside the kickoff's named radius, inside its acceptance card — an agreement whose seal names nobody does not pass "sends a real contract".

---

## 3 · WHAT THE FOUNDER RUNS (each block in the packet, zero placeholders)

1. `0146` — four statements, one per paste, **census SELECT first**, verify SELECT after.
2. `node scripts/b56_contract_bench.js` at the applied tree → `272/272 cells green.`
3. The `/standard` door's glass walk lands with the pwa packet (the room's *See the standard agreement* card is the only caller). Its by-command witness here is §15d.

---

## 4 · MUTATION PROOFS, RUN AT THE SEAT (RED then reverted by reversing the edit — R-40.65)

| # | Mutation | FAIL count |
|---|---|---|
| 15a | `${P.rooms} room(s) at ${P.same_venue}.` back into 5.2 | 5 |
| 15b | `functionsForContract` returns `[]` on no lead | 1 |
| 15c | `effectiveProfile` drops the override spread | 2 |
| 15d | `rs()` loses its `isPlaceholder` branch | 1 |
| 15e | 1.1 reads `T.vendor_signatory_name` again | 3 |
| restored | | 0 · 272/272 |

Ten other benches are red at this tree **and identically red at `3b6ded3`** in a second clone (`b05_f0555` 1 · `b06_m0` 2 · `b07_f0772` 1 · `b07_p4b` 1 · `b10_p2` 9 · `b10_p3` 2 · `b51` 5 · `bOB_taxonomy` RED · `b55` no verdict line · `tdw10_combined_cap` crashes). Not this packet's; named, not cured.

`tsc -p src/engine/tsconfig.json --noEmit` clean. `node --check` clean on every touched file.

---

## 5 · OWED — stated, not closed quietly

- **The pwa packet**: the room replaced to the prototype (`screen.tsx` whole), `lib/vendor/api/vendor.ts` gains `fetchStandardAgreement`, `screen.tsx:192`'s `travel_terms` key → `travel_and_stay_terms`, the meaning lines, the *Someone new* door, the progress line, autosave, `next build` at apply (R-40.66).
- **F-40.245** (composed `sent` contracts route to the record, post-send states unreachable) — pwa.
- **The register's census line** in v2 :13/:31/:324 still says 168; v3 §0 supersedes it and says so. v2 is not edited.
- **`PUBLIC_SCHEMA.md`** is stale for 0139–0146; the two comments in `0146` are the regen's input, not a substitute for it.
- **`functions_manual` at Send**: the room's `requiredRows` "Functions and dates" row must count manual rows — pwa. The door refuses on nothing yet (sitting 2's note stands).

---

## 6 · THE CHAIN

`git fetch` → tips re-derived (`3b6ded3` / `82612b38`) → read: room, annex, source, renderer, doors, register, bench → census of every reader of `travel_terms`/`same_venue`/`rooms`/`T.functions` → edits → standard render found the §2 class → census of `T.*` against the register → cure at every site → fixture moved → §15 authored → five mutations RED, restored GREEN → ten pre-existing reds re-run at a clean clone of the tip → `0146` → register v3 → this note.

`git status --short` at the cut: six modified, three new (`0146`, register v3, this file). Nothing pushed — the founder pushes.
