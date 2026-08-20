# TDW · BLOCK 05 · M-NAMEFILL — HANDOVER

**Sitting:** CE-35, 2026-08-20 · **Scope:** ONE ZIP, `dream-os` ONLY
**Base tip:** `6574193470ee05fadefdb0614c74bf5e233113b8` (M-GATEFLIP)
**Copy:** ZERO user-facing bytes. No SQL. No migration. No gate. No flag.

---

## 1 · WHAT THIS IS

The bride lane's `metaInputsFrom` hardcoded `profileName: null`, and behind it two
correctly-guarded fill-when-null writers — `brideInbound.js:470` and
`brideIndex.js:391`, both `if (profileName && !user.name)` — had **never fired once**.

The read-first found the discard was **two layers, not one**. `normalizeMetaInbound`
never read `value.contacts[]` at all: `grep -rn "contacts" src/` returned zero readers
estate-wide. The name never entered the process, so the lane file's `null` was not a
lazy hardcode — there was nothing there to pass through.

The cure adds the missing surface at the shared adapter and consumes it on one lane.

---

## 2 · THE READ-FIRST'S BLOCKING RAISE, AND WHAT IT CHANGED

**F-05.78 was not open.** `docs/FINDINGS_LOG.md:4396` and
`docs/specs/TDW_CE_31_SITTING_SEAL.md:113-116` carry it as **CLOSED-SUPERSEDED** since
CE-31 — closed by R-OB.7, whose rationale (the PWA form is the one door for real names)
is the direct negation of this charter's premise. The charter's header said "CURED".

The chair claimed two errors on that raise: **c-35.10** (charter premise was a reversal
of committed ruling dressed as a cure of an open finding) and **c-35.11** (R-35.18's
cited witness, "the onboarding form's own cap", does not exist — `dreamos-pwa` has no
name cap at all; the 80 lives server-side at `src/api/couple/onboarding.js:179`).

Both were ruled before a byte was cut. Nothing in this ZIP predates those rulings.

---

## 3 · THE RULINGS THIS DELIVERY IMPLEMENTS

| Ruling | What it says | Where it lives in bytes |
|---|---|---|
| **R-35.19** | F-05.78 **REOPENED-SCOPED** on the founder's word of 2026-08-20. R-OB.7 **AMENDED, not reversed**: whole on the member plane, reopen reaches only the bride's own row, fill-when-null. Enforced in bytes: `profileName` is **dropped from `safeName`** | `brideInbound.js` circle claim |
| **R-35.20** | The `contacts` surface lands in the **shared adapter**, paired by `wa_id`. A bride-local `rawBody` read was refused as a second home for pairing logic | `metaInbound.js profileNameFor` |
| **R-35.18** *(amended)* | Trim · reject empty-after-trim · cap **80, code-point-safe** · otherwise **verbatim**. Witness corrected to `onboarding.js:179`. The 80 is **policy, not a column constraint** — `users.name` is unbounded `text` (`PUBLIC_SCHEMA.md:995`) | `metaInbound.js sanitizeProfileName` |
| **R-35.21** | Defensive build ships ahead of the wire's witness; the walk is the witness | §6 below, verbatim |

---

## 4 · THE FILE TABLE

| Path | What moved |
|---|---|
| `src/lib/metaInbound.js` | **+** `PROFILE_NAME_CAP`, `sanitizeProfileName`, `profileNameFor`, all exported. `normalizeMetaInbound` **byte-unchanged** |
| `src/lib/brideInbound.js` | seam reads the surface; `safeName` drops `profileName`; requires `./metaInbound` |
| `scripts/b05_f0578_namefill_bench.js` | **new** — 29 cells, both-ways, 18 measured mutations |
| `scripts/bOB_d2_onboarding_gate_bench.js` | cells 4.1 amended, 4.3 re-pointed (F-OB.19). **Count preserved: 45 `cell(` before and after; 76/76 run, 0 skipped, GREEN** |
| `scripts/floor-manifest-m-namefill.txt` | **new** — this delivery's declared dirt |
| `docs/handovers/TDW_05_M_NAMEFILL_HANDOVER.md` | **new** — this file |

**Bench 4.1 was not on the chair's list and had to move anyway.** It asserted the byte
`(claim.invitee_name || profileName || '')`, which R-35.19 deletes; it would have gone
RED on delivery. Amended to assert the field is **absent** from the expression, since an
ordering stopped being a guard the moment the field went live. Declared, not slipped in.

---

## 5 · EVIDENCE

**Bench, this delivery:** `b05_f0578_namefill_bench` — **29/29 GREEN**.
`bOB_d2_onboarding_gate_bench` — **76/76 GREEN, 0 skipped**.

**Both-ways, claimed from the run's own output** (not predicted): all **29 cells redden
under at least one production-source mutation**; the full matrix M1–M18 is at the foot
of the bench file with its measured red set per mutation.

**Two vacuities the mutation run found in this bench, cured rather than reported green:**
- `1.3` tested the empty-reject arm only through `profileNameFor`, whose own `if (name)`
  re-swallows the `''` — deleting the production arm left the cell **GREEN**. It now
  drives `sanitizeProfileName` directly.
- `2.3`'s five malformed-`contacts` fixtures all survived deletion of the
  `Array.isArray` guard; only a **non-iterable** value throws. `contacts: {}` added.

**Floor:** warm, sibling-full (`dreamos-pwa` beside), `--delivery` + `--check`.
**`FLOOR = NAMED BASE, no delta`** — 21 reds by name, identical to
`scripts/floor-base.txt`. `[F-14.16] declared files unmoved — set and contents both
verified.` The two benches that carry `contacts` fixtures (`b09_d3_structural_bench`,
`b09_d4_honestmouth_bench`) were green before and are green after.

---

## 6 · THE WIRE — R-35.21, IN THE RULING'S OWN WORDS

> The charter's premise — that the name arrives on the wire — is **unverified at build
> time**; the walk is its first witness; a walk where the fill does not land is the
> **premise failing, not the build**, and the investigation then starts from the payload
> on glass rather than from belief.

The ground for shipping ahead of the witness is that **the failure mode is inert**:
`sanitizeProfileName` returns `null` for an absent, null, blank or whitespace-only wire
name, and every writer downstream is guarded on truthiness. If Meta never sends
`contacts[].profile.name` on this lane, **nothing fires and the estate behaves
byte-for-byte as it did before**. Cells `4.5` and `4.6` assert exactly that.

There is still **no captured production payload carrying a contacts block anywhere in
this tree**. Every `contacts` fixture in the estate — including this bench's — is
bench-authored. If the walk comes back empty, the next read is
`failed_turns.payload` filtered to `service = 'bride'`, or a fresh logged payload.

---

## 7 · WHAT THIS DOES **NOT** DO

- **No gate armed, no flag, no predicate change.** F-08.56 honoured trivially: fill-only.
- **F-OB.15 (Mira's `unknown`) is untouched and remains Row 9's.** This delivery fills
  `users.name`; what any agent renders for a still-null name is a different plane.
- **The vendor lane is not woken.** Its `profileName: null` stands. **F-05.81** records
  that its creation-time writers (`vendorInbound.js:260` bare insert; the
  `ensureCoupleRow` cross-lane creation path) are **unguarded and uncapped** — latent
  only while that null holds. Cell `6.1` reddens if anyone wakes it. Census before any
  vendor-lane name work; never woken casually.
- **F-OB.20 is not fixed here.** `onboarding.js:179` still carries the raw
  `.slice(0, 80)` and its surrogate-split latent. Queued, one line, out of scope.
- **No backfill of existing rows.** The 24 repair **passively**, as each bride messages
  in. Census relayed 2026-08-20: **all 24 are NULL**, so the `!user.name` guard's
  coverage is total — no row is stranded behind a literal `'unknown'`.
- **Sequencing beyond this sitting is the founder's.**

---

## AMENDMENT A (CE-35, 2026-08-20, docs-only, rides the CE-222 band push)

§6's premise sentence ("unverified at build time") was true when written and is
now DISCHARGED: the founder's walk of 2026-08-20 witnessed
`contacts[].profile.name` on the wire — arm B, the nameless row, `NULL` →
`🤍priya🤍` in one inbound, 44 seconds, `updated_at` moved; arm A, the named
row, unmoved to the microsecond. R-35.21's premise holds and the first captured
contacts payload now exists on glass. The walk's supplementary-plane emoji
(U+1F90D, a surrogate pair) exercised the R-35.18 code-point-safe cap on real
bytes. Nothing else in this handover is amended.
