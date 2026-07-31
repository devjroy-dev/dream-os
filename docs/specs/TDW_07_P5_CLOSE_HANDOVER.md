# TDW_07 P5 — THE CLOSING SITTING · EXECUTOR HANDOVER
**Base:** `dream-os @ ffada00` · `dreamos-pwa @ 5c16261` · **Executor:** Opus-LE · **Date:** 2026-07-31
**Rides:** the CE rulings of 2026-07-31 (F1(b) Option 3 · Fork B · F-07.55 shape · F-07.56 · the .52/.53 re-aims · the F-07.57 rider · the ① / ② mid-build rulings).
**Rides:** ZIP 1 of 2 (`dream-os`) and ZIP 2 of 2 (`dreamos-pwa`). Apply in either order; the cross-repo cells skip cleanly on `PWA_VISIBLE` until both land.

---

## 1 · WHAT SHIPPED

### dream-os
| # | File | What |
|---|---|---|
| 1 | `src/api/couple/discover.js` | F-07.54 mint 1 — demo branch: `routing_handle` **and** `enquire_link` both null. `instagram_handle` untouched. |
| 2 | `src/api/demo/vendor.js` | F-07.54 mint 2 — the demodiscover feed's `routing_handle` null. `:235`'s direct-phone link left ALIVE by ruling. |
| 3 | `src/lib/sendWa.js` | F-07.55 — ONE log line at the template dispatch seam. |
| 4 | `src/api/couple/enquire.js` | F-07.56 — real-leg identity hydration + **seven** consumers re-pointed. |
| 5 | `src/lib/vendorInbound.js` | F-07.57 — the returning-bride notification keyed on the branch's own vendor. |
| 6 | `scripts/b07_p5_bench.js` | §13–§18: 27 cells + 12 both-ways mutation proofs. |

### dreamos-pwa
| # | File | What |
|---|---|---|
| 1 | `components/frost/EnquirySheet.tsx` | F1(b) auto-fire dead · Fork B done-state · P2's loud-log. |
| 2 | `app/(frost)/frost/canvas/sanctuary/page.tsx` | success toast stands down; failure arm byte-untouched. |
| 3 | `app/(frost)/frost/canvas/discover/page.tsx` | same, second mount. |
| 4 | `scripts/tdw07_p1_discover.proof.mjs` | F-07.52 labeled re-aim. |
| 5 | `scripts/tdw07_p4b_body.proof.mjs` | F-07.53 labeled re-aim. |

**Zero DDL.** `0105` unspent. **W-1 clean** — no file under `src/engine/`, chair-verifiable by `git diff --name-only`.

## 2 · PROOF

```
b07_p5_bench       126 passed, 0 failed  (total 126)
  83 at charter  +29 cells  +14 both-ways mutation proofs  = 126   (derived by
  counting the run's own output, after the chair caught a broken prose sum;
  the last cell+mutation pair is §18.8, born of the founder's walk below)
node --check       5/5 OK
tsc (pwa)          ZERO on cleared .next, deps pinned via npm ci
tdw07_p1_discover  37/37   (was 36/37 — F-07.52)
tdw07_p4b_body     122/122 (was 121/122 — F-07.53)
```

**THE FLOOR** — 90 bench files, strictly sequential under the F-07.46 interim protocol, porcelain carrying only the candidate delta before and unchanged after:

```
KNOWN-REDS EXACTLY TWO, named:
  b05_f0555_media_dedupe   22 passed, 1 failed   (F-07.11)
  b06_meter_bench          FAILURES 28/29        (F-06.41)
NOT FLOOR — excluded by name, per the floor-method law:
  b06_gauntlet.js       gauntlet harness, needs live model credit
  b5_wa_door_smoke.js   smoke script, needs the live wire
  test-shape.js         recorded diagnostic-not-floor at CE-114
```

## 3 · STANDING LAWS PROMOTED BY THIS SITTING

1. **`mutateSrc()` — a mutation helper must bust whatever caching the CELL's own read path uses.** `require.cache` for required modules; re-read-inside-the-closure for const-loaded sources. §13–§16 read their sources into consts at module load, so the existing `mutate()` would have passed over broken code and shipped **nine hollow greens**. The §18 twin (`mutatePwa`) is the same law across the repo boundary.
2. **Vetoed copy is frozen at the BYTE, not at the glyph's runtime value.** A JS escape that renders identically is still not the founder's bytes. §18.2 caught `'\u2726'` standing where the vetoed original carries the literal `✦`.
3. **`npm ci` before any floor claim, BOTH repos.** NOTE_15 §1 warned this for the pwa; it binds the backend identically. *A floor line is a claim about the tree, and mine would have been a claim about my container.*
4. **The F-07.55 log line's privacy exclusion is the line's stated law** (F-07.41's family): template vars carry customer data — her name, her wedding month. §14.3 reddens if payload or vars enter the log. A later sitting "improving" the line by rendering them fails the bench.
5. **Identity vs utterance precedence** (CE standing law, carried in-comment at the seam under F-06.85): identity fields (name, phone) hydrate-first with the body as fallback; utterance fields (date, city) stay POSTED-over-HYDRATED. Her account is the truer witness of WHO she is; her keystrokes of WHAT she asked.

## 4 · NAMED GUARD CELLS (§11.4 — pass both ways, never cure proofs)

- **§13.5** — the demodiscover direct-phone link is left ALIVE by ruling. The cell exists so a later sitting cannot "finish the job": that link is tokenless and carries none of F-07.54's disease.
- **§15.4** — the demo leg keeps POSTED-over-HYDRATED for date and city. The cell holds the deliberate asymmetry against harmonisation.

## 5 · DISCLOSURES — MY OWN MISSES, FILED NOT PAPERED

1. **§14.1 counted RAW `console.` occurrences** — commenting the log line out still satisfied it. That is F-07.52's exact geometry reproduced in the same sitting that cured it elsewhere. Caught by my own §17 mutation. Hardened to judge code.
2. **Then the mutation's mirror assertion asked a different question than its cell** — it still read raw text after the cell was hardened. A mutation that does not ask the cell's own question proves nothing about the cell. Both aligned, reason in-comment at both sites.
3. **§18.2 convicted my own production source** of byte-drift in vetoed copy (see law 2 above).
4. **§18.5 was my own bad slice boundary** — `indexOf('return (')` searched from 0 and matched an effect-cleanup return above `submit`, slicing backwards to nothing. The cell was wrong, not the code.
5. **I created residue: an unnecessary `../dreamos-pwa` symlink that landed INSIDE the pwa tree** and showed as `?? dreamos-pwa`. It would have ridden the ZIP. Removed, and 122/122 re-verified AFTER removal rather than assuming removal was harmless — the repos are already siblings and `PWA_VISIBLE` resolves natively.
6. **The 39-red first floor** (law 3 above).
7. **THE FOUNDER'S WALK CAUGHT A DEFECT THE BENCH COULD NOT.** My done-state
   re-rendered the expectation line that the sheet header already renders
   unconditionally (`:298`), so "Replies on WhatsApp, usually within a day."
   appeared **twice** — once under the vendor name, once under "Enquiry sent".
   §18.1 asserted the frozen confirmation was PRESENT, and it was: beneath a
   duplicate. **A presence-cell is structurally blind to duplication.** Cured,
   and §18.8 now COUNTS the line, proven both ways. Standing lesson: wherever a
   surface can repeat a string, a presence-cell must be paired with a count-cell.
   **SECOND WALK CATCH, same family:** Fork B leaves the sheet mounted, and the
   card panel behind it was only ever hidden by the sheet's HEIGHT. The done-state
   is far shorter than the form, so the panel re-emerged below it and the surface
   read as TWO stacked cards with two drag handles. Cured by `visible={panelOpen
   && !sheetOpen}` — the panel slides away while the sheet is up and returns on
   close; `panelOpen` itself is untouched. §18.9 pins it, proven both ways.
   **THE STANDING LESSON:** changing a surface's HEIGHT changes what it occludes.
   Every element a surface used to cover by size must be re-accounted when that
   size changes — the control-inventory law's blind spot, and neither §18's cells
   nor tsc can see it. Only a device can.
8. **The F-07.56 cite list was short by four.** The finding named three consumers; the real leg had seven — the lead row's name/phone, the binder's `raw_message`, the prospect's name/phone/note. Curing three would have left the cabinet, binder and prospect saying "a couple" while the ping said her name.

## 6 · PATH-NOTES (bare filenames were ambiguous; each derived by command)

- The handle mint is `src/api/vendor/onboarding.js:28` — **three** `onboarding.js` exist and `src/agent/onboarding.js:28` is unrelated code.
- The category alias files are `src/agent/categories.js:53` (`'outfit'` ∈ the `designer` alias list) and `src/lib/vendor/categoryFraming.js:114`.

## 7 · DEFERRED BY RULING — NOT CURED HERE

- **F-07.58** — `sanctuary:581` builds `'TDW-'+(e.routing_handle||e.vendor_id)` against a hardcoded `917982159047`: a raw UUID as a routing token. Deferred to P6's sanctuary fold.
- **F-07.59** — LATENT. No vendor holds any of the six demo handles today; `SWATI` remains a legal mintable handle and `onboarding.js:28` mints by stripping `instagram_handle` to `[A-Z0-9]`. The demo-null cure closes it permanently.
- **F-07.62** — the enquiry door accepts a caller-supplied `couple_id` with **no auth** (`router.js:59`) and hydrates a real user's identity from it. Pre-existing (the demo leg carries the same trust since P5). Deferred **by name** to the AUTH SITTING, whose charter also carries the (C) token-lane crossover and the 47-byte specimen.
- **F-07.61** — the Swati demo-row lifecycle, founder-drained, deferred to Block 08.

## 8 · THE SMOKE CARD

Re-derived against the founder's five-card fixture paste of 2026-07-31 ~23:05 IST. **The founder performs and pastes; the executor reads the evidence.**

**Fixture state of record:** five demo cards live (`swati` deactivated). **Legacy Jewellers** (`bafc94f9`, `918700521064`, category now `jewellery`) is the **sole alert-capable card by construction** — Neha's `918595986978` resolves to users row `962c5148` and is a permanent F-07.49 refusal.

| # | Step | Evidence to capture |
|---|---|---|
| ① | Enquire on a **real** vendor as `+919625759924`. | The sheet **stays open** and shows `Enquiry sent` (or `✦ saved in Vendors`). **NO second channel opens.** `Continue on WhatsApp` is present and **inert until tapped**. No toast over it. |
| ② | Tap `Continue on WhatsApp`. | WhatsApp opens on the vendor's TDW link — *now, and only now*. |
| ③ | Enquire on the **Legacy Jewellers** demo card. | Sheet confirms; **NO affordance renders** (demo cards carry no lawful address — the F-07.54 cure, visible). No WhatsApp handoff. |
| ④ | **Before 2026-08-02 20:09:44 IST** — enquire on Legacy a second time. | **No message** on `918700521064`. Railway: `[demo-lead-alert] BATCHED … no second template`. `prospects.last_template_at` **unchanged** at `2026-07-31 14:39:44.693+00`. A **second** `demo_leads` row, `notified_vendor = false`. |
| ⑤ | An out-of-window real vendor receives `enquiry_alert_vendor`. | The ping carries **her actual name** ("Dev Test 23"), not "a couple" — F-07.56. Railway carries the new `[sendWa:template] … <- enquiry_alert_vendor (…) [line=vendor]` line — F-07.55. |
| ⑥ | Browser console during ①. | On a prefill failure, the new `[enquiry] prefill unavailable for couple …` warning names the cause instead of swallowing it. |

**Truths only the founder's device can witness** (PROVABLE-EQUIVALENT DOCTRINE): that the done-state is legible; that no second app takes the screen on ①; that the affordance is tappable and lands correctly on ②. The benches prove the wiring, never the usability.

**NAMED SKIPS, per the floor-method law:** the opted-out and no-lane refusal paths are not walked (producing them means opting a real vendor out or breaking a live env var); they are benched since Block 05. Step ⑤ requires a real vendor genuinely outside his 24h window — if none exists at walk time, the step is **deferred, not faked**.

## 9 · NEXT

The chair verifies at origin after the founder's push, then CE-117 inks the band F-07.35→.62. The founder has sequenced the **AUTH SITTING** first after the seal; F-07.62, the (C) crossover, and the 47-byte specimen travel to it together.
