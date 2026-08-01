# TDW_07 — F-07.74 THE STRIPPER AUDIT · EXECUTOR HANDOVER (dream-os half)

**Base:** dream-os `614e96270c9a8e02f91430ded22bd72aeb88540f`.
**APPLY ORDER: this ZIP is SECOND.** The dreamos-pwa ZIP applies first; this one carries the convergence, F-07.100's guard, and the cross-repo identity cell's other end.
**Scope as ruled (CE §4):** bench machinery only. **Zero `src/` bytes.** Zero migrations. Zero SQL. W-1 trivially clean.

---

## 1 · WHAT SHIPPED

| path | what |
|---|---|
| `scripts/lib/stripComments.js` | **NEW — THE definition, CommonJS twin.** Same mechanism as the pwa module, byte-for-byte in the scanned body. |
| `scripts/b07_f0774_stripper_bench.js` | **NEW — 20/20 with the sibling clone present; 19/19 + 1 named skip in a lone checkout.** Mechanism cells, this repo's half of the class, cross-repo identity, derivable coverage. |
| 6 benches | converged on the module; each gained §0.X/§0.Y/§0.Z. |

**The donor is this repo's own.** `b07_f0776_doors_bench.js:53–70` held the estate's first correct answer to F-07.74 — canaries and vacuity twin included — while sixteen other benches across two repos kept the broken rule. It is promoted **out** of that bench into the module. **Not one byte of its mechanism changed; only its address did.**

---

## 2 · THE FLOOR, run by command · every movement classified

`npm ci` was run so `b05_f056_otp_meta_bench` could actually execute rather than be declared unrunnable.

| bench | before | after | Δ | class |
|---|---|---|---|---|
| `b07_f0776_doors_bench` | 61 | **64** | +3 | (c) |
| `b07_p6_bench` | 26 | **29** | +3 | (c) |
| `b07_p4b_body_bench` | 73 | **76** | +3 | (c) |
| `b07_p3_bench` | 52 | **55** | +3 | (c) |
| `b07_p4a_ig_bench` | 107 | **110** | +3 | (c) |
| `b05_f056_otp_meta_bench` | 24 | **25** | +1 | (c) |
| `b07_f0774_stripper_bench` | — | **20/20** (sibling present) / **19/19 + 1 skip** (lone) | new | — |

**Zero (a) movements. Zero (b) re-aims. Every Δ is (c).** The intermediate state — module in, canaries not yet — held all six **byte-identical**.

---

## 3 · F-07.100 CURED — and a SECOND site nobody had censused

**The ruled site:** `b05_f056_otp_meta_bench.js:283` carried `/\/\/.*$/gm` with **no `(^|[^:])` guard** — it deleted from the `//` of every `https://` to the end of that line, inside string literals and all, then ran the naive block rule on top. Cured; `§0.7` drives the shape directly with a URL fixture.

**The site nobody had:** `§4.5` — the estate-wide guardless-line-pass cell — **convicted `b07_p4b_body_bench.js:82` on its first run.** A second unguarded `S.replace(/\/\/.*$/gm, '')`, present in neither my read-first census nor the chair's. Cured in the same delivery. **The cell caught it, not a reader** — which is the whole argument for deriving coverage instead of listing it.

`§4.3` also convicted **two live copies of the retired rule** that I had missed: `b07_f0776`'s own vacuity twin re-typed the naive regex rather than importing it. Routed through the module's exported `NAIVE_RETIRED`, so the retired rule now exists in exactly **one** place per repo. The rogue checks read **stripped** source — a bench that *describes* the retired rule in a comment is documenting it, not carrying it (F-06.85's requirement, F-07.89's lesson).

---

## 4 · THE CLASS ON THIS REPO

**No file under `src/` carries `image/*`.** `§1.census` holds that by command — a fact with an expiry date, so it is a cell rather than a sentence.

What `src/` **does** carry, live, is the other half of the class: **regex literals whose tail reads `*/`**, which close an already-open real comment early and leak prose into "code" —
`src/engine/src/core/distill.ts:160` (``/^```json\s*/i``) and `src/lib/imagePipeline.js:281`.
Neither is armed at this tip. `§1` holds both by name so the day one lands between a `/*` and its `*/`, this bench reddens instead of a cell convicting on an explanation.

---

## 5 · THE CROSS-REPO IDENTITY, PROVEN BOTH ENDS + BOTH WAYS

With both clones side by side, `dream-os §3.1` and `pwa §5.1` both **PASS**. A one-byte mutation of the pwa definition turned **both cells RED across the repo boundary**; restored byte-identical, `cmp` verified.


**LAYOUT NOTE:** the identity cell resolves `../dreamos-pwa` and `../dream-os`. In the founder's Codespace both repos sit side by side, so the cell RUNS and the counts are the sibling-present ones above. In a single-repo checkout it SKIPS, named and counted.

**In a lone checkout the cell SKIPS — named, counted, never a pass.** Clone `dreamos-pwa` beside `dream-os` and re-run to prove it locally.

---

## 6 · NAMED SKIPS

1. **`b07_f0774_stripper_bench §3.1`** — skips without the sibling clone. Proven above with both present.

---

## 7 · FOUNDER STEPS

**None beyond apply + verify + push.** No dashboard act, no env var, no SQL, no live witness.

---

## 8 · WHAT THE NEXT SITTING PICKS UP

- The two false-close fixtures are **declared and canaried, not cured**; closing them needs a real lexer in the standing path.
- The pwa half's **H1/H2** (see its handover §5) apply to this module too — same mechanism, same holes.
- Curing one repo of a two-repo class is the half-cure this block refused; **both halves are now pinned to each other by cell**, and the pin is what stops the next drift.
