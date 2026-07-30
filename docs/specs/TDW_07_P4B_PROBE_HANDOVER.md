# TDW_07 P4b — THE ?igprobe LADDER · EXECUTOR HANDOVER

**Seat:** Opus-LE · **Sitting:** 2026-07-30 (post-walk)
**Base:** `dream-os faadd53` · `dreamos-pwa 54ea9e3` — re-derived fetch-first at origin at build.
**Charter:** the CE ruling on the two-findings packet, §§1–6.

---

## 1 · WHAT SHIPPED

| Repo | File | Movement |
|---|---|---|
| dream-os | `src/lib/vendor/igOAuth.js` | **comment only** — the NO DEVICE IN THE LOOP standing header + the third physics amendment |
| dreamos-pwa | `app/vendor/portfolio/page.tsx` | the `?igprobe=1` ladder (4 shapes) + H19 built dark + the probe's mint exception |
| dream-os | `scripts/b07_p4b_probe_bench.js` | NEW, 22 cells |
| dreamos-pwa | `scripts/tdw07_p4b_probe.proof.mjs` | NEW, 27 cells |
| — | three benches re-aimed | labeled amendments, §3 below |

### The standing header (§2 of the ruling, verbatim as ruled)

`igOAuth.js` now opens with: *every navigation-physics claim in this file cites a founder-witnessed screenshot by date, or carries the word CONJECTURE.* The paragraph beneath states two facts and nothing else — plain anchor tap CLAIMED, long-press→new-tab ESCAPES, both citing the 2026-07-30 screenshots by date. Every other form is named CONJECTURE explicitly. The surviving F-07.23 sentence is relabelled CONJECTURE rather than left bare. Correction №21 is recorded as jointly the executor's and the chair's.

### The ladder (§3)

Behind `?igprobe=1`, four shapes over **one** pre-minted URL:

| | Shape | Why it is in the ladder |
|---|---|---|
| A | plain `<a href>` | the control — known claimed, so the walk carries its own baseline instead of relying on memory of last night |
| B | `<a target="_blank" rel="noopener noreferrer">` | the closest mechanical relative of the path already proven to escape |
| C | `window.open(url, '_blank')` | a script-opened new context from inside the tap |
| D | `window.location.href = url` | never cleanly tested — its only prior instance ran against the wrong host, so that failure is unattributable between host and form |

**Three properties make the walk mean something, and each is benched:**

1. **The comparison is controlled.** All four share ONE `PROBE_BTN` style object, so they differ in nothing a finger can perceive except navigation form. If they differed in size or position, a difference in outcome could be argued away.
2. **No shape builds its own URL.** §3.5 asserts every shape references the same pre-minted `igAuthUrl` and that no host literal appears in the panel.
3. **A false negative is impossible.** The state is single-use. If one shape reaches consent and the founder taps Allow or Cancel, that nonce is spent — and the next shape would fail on a dead state while looking exactly like interception. **Probe mode therefore re-mints unconditionally on every return**, and the last 8 characters of the state render beside the buttons so the founder can *see* it changed rather than take my word for it. A manual "Refresh the link" control sits beneath the four.

### The submitted surface does not move (§3's binding constraint)

Proven mechanically, not asserted: comment-stripping both trees and diffing shows **four changed code lines**, all the mint gate's rename (`igNeedsConnect` → `igWantsUrl`). **Zero rendered elements were added, removed or altered on the default path.** The probe panel is gated on `igProbe`, false unless the query says otherwise; H19 is gated on `IOS_FALLBACK_ARMED`, false. Probe-bench §1.7 proves the new gate *reduces to the old predicate* whenever the probe is off, so a vendor who never asked for the ladder gets byte-identical behaviour.

The probe's one lawful exception: it mints even for a CONNECTED vendor. It has to — the founder's account connected on tonight's long-press walk, so `igNeedsConnect` is false for exactly the person who must run the ladder. Re-authorising is idempotent.

### H19 — the iOS fallback, dark (§4)

Built, not rendered. `IOS_FALLBACK_ARMED = false` at one named constant; arming is that one byte **plus** the founder's veto of the bytes — deliberately two acts, because a line that blames the vendor's phone should cost a decision. Draft bytes, veto owed:

> *On iPhone: press and hold the button above, then choose "Open in New Tab". A normal tap gets caught by the Instagram app.*

Benched (§5.2) to name the **working gesture before the explanation**, per the H3 ordering doctrine — the vendor gets an action before they get an account of somebody else's bug.

---

## 2 · PROOF

### Both-ways, non-vacuous

| Bench | Cured | At origin (uncured) |
|---|---|---|
| `tdw07_p4b_probe` (pwa) | **27/27** | **4/27** |
| `b07_p4b_probe` (dream-os) | **22/22** | **10/22** |

The stable greens on the dream-os side are §3's byte-stability cells, which exist precisely to prove the comment amendment took no mechanism with it. Disclosed, not counted as strength.

### Floor — whole, both repos, all green

**dream-os:** `b07_p1` 72/72 · `b07_p2` 48/48 · `b07_p3` 50/50 · `b07_p4a_ig` 107/107 · `b07_p4b_slice1` 19/19 · `b07_p4b_probe` 22/22
**pwa:** `tdw07_p1_discover` 35/35 · `tdw07_p2_profile` 41/41 · `tdw07_p3_portfolio` 110/110 · `tdw07_p4a_ig` **63/63** · `tdw07_p4b_slice1` 24/24 · `tdw07_p4b_probe` 27/27

**Known-red:** `f0555` 22/23, unchanged. **`b06_meter` 28/29 — now chair-verified at `faadd53` on a built engine (ruling §6γ); I no longer carry it as unread.**

### Gates

`node --check` clean · **pwa tsc `--noEmit` whole-tree, cleared `.next`: ZERO** · **W-1 clean**, zero soul/prompt/lens/engine bytes · the `igOAuth.js` delta is comment-only.

---

## 3 · EXECUTOR DISCLOSURES — one of these is a miss I shipped

**(1) I SHIPPED A FLOOR REGRESSION AT SLICE 1, AND IT WAS LIVE AT ORIGIN.**

`tdw07_p4a_ig` was **62/62 at `70f6f82`** and **58/62 at `54ea9e3`**. Derived by command at both tips, not inferred.

Cause: slice 1's floor ran the four dream-os `b07_*` benches and my new pwa bench — **it did not run the pwa's existing P-series.** My handover presented that as "the floor," and it was a partial floor labelled a whole one. The four reddened cells asserted H15–H18 were marked DRAFT, which stopped being true the moment the founder's veto landed in the same delivery.

Substance is harmless: the bench was asserting a retired law, and no product byte was wrong. The process failure is not harmless — a floor that omits half an estate is exactly the shape that lets a real regression through, and it did so on my watch. **Cured here** by re-aiming the four cells to assert the executed veto, with the regression disclosed *in-cell* so a later reader meets it in the bench rather than only in a handover.

**Count moved 62 → 63, disclosed:** §7.4 split into the veto assertion plus a new §7.4b asserting H18's presence-mandatory constraint — the half that actually protects the filing. A future sitting rewording H18 stays lawful; one deleting it now reddens.

**(2) THREE BENCHES RE-AIMED AS LABELED AMENDMENTS.** Each follows a law the chair moved, none was softened to buy a green:

- `b07_p4b_slice1` §1 (7→7, **preserved**) — pinned slice 1's wording of the physics paragraph, which the founder's walk convicted as inverted. A bench defending a sentence the estate has proven false is the worst kind of green.
- `tdw07_p4b_slice1` §1.4 (1→1, **preserved**) — said "no script navigation anywhere in the file"; shape D deliberately ships one. Re-scoped to **the vendor-facing path**, excising the probe panel before the test, so a script navigation *leaking out of the probe into the submitted surface* still reddens.
- `tdw07_p4b_slice1` §2.2/§2.3 (2→2, **preserved**) and §4.5 (1→1, **preserved**) — the gate rename, and H19's lawful draft marker.

**(3) THE AMENDMENT'S OWN BENCH CAUGHT ME.** My first draft of the third physics amendment silently dropped the F-07.7 citation and the pointer to the pwa cure site. `b07_p4b_slice1` §1.5/§1.6 reddened. **I restored both to the file rather than delete the cells** — and used the restoration to correct F-07.7's status in the same breath: it is a neighbouring datum, not a lemma, and slice 1 read it as supporting the inverted model.

**(4) §0.2 REPORT — TWO FOUNDER-FACING SECTIONS DID NOT REACH ME.** The ruling says H19's string "goes to the founder below" (§4) and the F-07.25 dashboard steps are "his steps below, with a STOP-on-warning gate" (§5). **Neither section was in the paste I received** — it ends at §6. I have therefore drafted H19 myself and routed it for veto, and I have **not** authored the dashboard steps: the under-review hazard is settled self-provingly per the ruling, and inventing a STOP gate I was not given would be worse than naming the gap. If the chair authored them, they need re-sending.

---

## 4 · THE WALK

Four taps, one screenshot each. The card is in the delivery message; it is deliberately short because the founder has run three walks today.

**One property he should know:** if a shape SUCCEEDS, the callback returns him to `/vendor/portfolio?ig=connected` and the `igprobe` parameter is lost — the return URL is built server-side and carries only `ig=`. That is not a defect; **landing on the connected toast IS the success signal.** He re-adds `?igprobe=1` to continue the ladder.

---

## 5 · NEXT

The ladder's answer rules the doorway's final shape. Then P4b's body: the widened F4 (one `rateMet` predicate, three sites, the pwa field trimmed) · `VendorProfileView` the one renderer · the shaper · the preview · F-07.15's death · the five money sites + the register cell · filing α's one-line fix at `igImport.js:27` · the reconstructed P4a handover.

**HELD:** the five P4b strings · the walk card (query-B paste, fixture law) · the schema dump refresh · F-07.25's dashboard act · CE-116's ink.
