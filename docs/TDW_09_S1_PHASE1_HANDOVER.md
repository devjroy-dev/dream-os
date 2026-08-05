# TDW_09 · SITTING 1 · PHASE 1 — EXECUTOR HANDOVER (ZIP 1, docs + instrument)

**Base:** dream-os `b0d7822` · dreamos-pwa `e3210b5`, both re-derived at origin fetch-first at session open.
**Under:** TDW_09 Sitting 1 kickoff, as amended by CE ruling R-U1 – R-U9 (2026-08-05).
**This ZIP moves dream-os bytes only. Zero pwa bytes moved. Zero soul/lens/prompt/engine bytes — W-1 held absolute.**

---

## 1 · WHAT SHIPPED

| Path | What |
|---|---|
| `docs/FINDINGS_LOG.md` | **APPEND ONLY** — the chair-authored CE-192 band, carried verbatim under R-U3 |
| `docs/specs/TDW_09_S1_CENSUS_AND_AUDIT.md` | Paper 1 — the screens census, the contrast audit, the type audit |
| `docs/specs/TDW_09_S1_LANDING_AND_FIRST_OPEN.md` | Paper 2 — the landing simplification forks, the first-open-destination forks |
| `docs/specs/TDW_09_S1_TOKEN_CANON.md` | Paper 3 — the token canon proposal, the money home |
| `docs/specs/TDW_09_S1_SPOTLIGHT_CONSOLIDATION.md` | Paper 4 — the consolidation plan + the founder-run provenance SELECT |
| `docs/specs/TDW_09_S1_POLISH_CENSUS.md` | Paper 5 — the polish debts, F-08.100's constraints, the LCP walk card |
| `docs/TDW_09_S1_PHASE1_HANDOVER.md` | this file |
| `tools/tdw09_census.py` | the census instrument, runnable from any cwd via `TDW_PWA` |

**The FINDINGS_LOG edit is proven append-only:** the first 3,973 lines are byte-identical to origin's (`cmp` clean); 10 lines appended. Per R-U3 this is the only file in the estate's ledger this sitting touches, and only for the chair's own bytes.

---

## 2 · FINDINGS MINTED — F-09.1 … F-09.14, RANGE HELD

Filed in the papers, **not** entered in `FINDINGS_LOG` — the chair enters them. R-U3's amendment covers the chair's band bytes and no others.

| # | Finding | Paper |
|---|---|---|
| F-09.1 | five palette homes, no authority; 226 hexes / 2,125 occurrences | 3 |
| F-09.2 | `SESSION_BOUNDARIES_2026_05_12.md` ghost pointer guarding the palette | 3 |
| F-09.3 | gold as body text at 12 sites; spec P5.3's own rule unenforced | 1 |
| F-09.4 | `#888580` fails AA on both house backgrounds (3.68 / 3.43), 42+ sites | 1 |
| F-09.5 | no type scale — 35 sizes, 79% sub-16px, 83% no line-height | 1 |
| F-09.6 | money register breached: 53 glyph + 8 shorthand sites, 12 formatters | 3 |
| F-09.7 | three themes against Addendum A's ruled two, plus an `!important` block | 3 |
| F-09.8 | the CE-123 site arithmetic corrected in both directions | 4 |
| F-09.9 | "Contact Swati" at 8 sites, 2 repos, 2 of them API error bodies | 5 |
| F-09.10 | Team Hub has three entry points — CE-58's pin question, answer set derived | 5 |
| F-09.11 | no date voice: 56 `toLocaleDateString`, 8+ local helpers, timezone trap | 5 |
| F-09.12 | three witnesses disagree on `discover_heroes`; the live reader may be dead | 4 |
| F-09.13 | the landing's role fork lands both arms on the identical screen | 2 |
| F-09.14 | two positioning lines for one product in one file | 2 |

**F-09.15 remains free.** Nothing allocated outside the range.

---

## 3 · WHAT THE FOUNDER RULES BEFORE ANY CURE BYTE

| # | Fork | Where |
|---|---|---|
| 1 | **Landing simplification** — L-A one door · L-B two doors · L-C show first | Paper 2 §2 |
| 2 | **First-open destination** — O-A chat · O-B one-page home · O-C state-dependent. *No recommendation offered; it is his chartered question and it depends on the north-star sentence, still owed.* | Paper 2 §4 |
| 3 | **T-1 body floor** — raise DM Sans body to 16px, or keep the spec's 15/13 and accept the breach | Paper 3 §3.4 |
| 4 | **Maker/Dreamer scope** — customer-facing copy only (few sites), or admin chrome and routes too (94 sites, breaks bookmarked URLs) | Paper 5 §1 |
| 5 | **Team Hub pin** — which of three surfaces he meant | Paper 5 §2 |
| 6 | **Copy veto, current-vs-proposed** — the eight "Contact Swati" bytes; the two positioning lines; `budgetBands.ts:10–11`'s band names | Papers 5 §5, 2 §1.2, 3 §4 |

And one act that is not a fork: **the provenance SELECT in Paper 4 §5 must be run and pasted back before a single byte of the spotlight consolidation is authored.**

---

## 4 · FLOOR — TRIPLE-RUN, PAIRED, PLUS A COLD CLONE

dream-os bytes moved, so the floor runs paired.

| Run | dream-os `npm run build` | pwa `npx tsc --noEmit` |
|---|---|---|
| 1 (working tree, patch applied) | exit 0 | exit 0, zero output |
| 2 (repeat) | exit 0 | exit 0, zero output |
| 3 (repeat) | exit 0 | exit 0, zero output |
| **cold clone** (fresh clone at `b0d7822` + patch, fresh `npm ci`) | exit 0 | exit 0, zero output |

Zero pwa bytes moved this sitting, so the pwa side is a no-regression witness, not a change proof — stated that way rather than claimed as more.

**Instrument reproducibility, proven both directions:** re-run from a different working directory against `TDW_PWA` yields the identical line — `surfaces=124 resolved_pairs=435 FAIL=141 UNRESOLVED=1693`. Pointed at a directory that is not a pwa clone it **exits 1 with a named reason**, not a silent zero. The independent-method law's clause 1 applied to the instrument itself.

---

## 5 · DISCLOSURES, BY NAME — MINE, NOT INHERITED

**D-1 · The instrument was wrong twice and I found it by hand, not by output.**
Draft 1 assumed a house-cream root background and reported **996 failures of 1,517 pairs**. Draft 2 tracked ancestry by a stack indexed on its own length rather than DOM depth, so a `position:fixed` toast's background leaked onto every later element; it reported `#555250 on #111111` at `app/admin/collab/page.tsx:67` where the source has a `<div style={{marginBottom:28}}>` with no background at all. Both were caught by opening the file and reading it, after the instrument had already produced a confident table. Both were **rewritten, not tuned**: no assumed root, and ancestry rebuilt as true `[start,end]` span containment. The final figure is **141**, not 996 and not 325. Had I shipped either draft, the founder would have received a legibility audit whose headline number was wrong by a factor of seven and whose sites were fiction. Named first because it is the worst thing in this ZIP.

**D-2 · My read-first packet asserted F-08.99 was unminted. It was wrong.**
I derived high-water from `docs/FINDINGS_LOG.md` and saw F-08.99 named only as "next free". The chair's R-U1 corrects it: F-08.99 was minted and cured at the P6 rider handover, and minted-ness is derived across the **whole docs tree**, not one file. My method had exactly the failure mode my own B2 described, one paragraph after I described it. The conclusion (B1: F-08.100 absent) survived; the supporting sub-claim did not. Owned in-band with a number rather than absorbed into a corrected sentence.

**D-3 · The UNRESOLVED column is four times the resolved column.**
1,693 unresolved against 435 resolved. That is not a defect of the instrument so much as an honest measurement of a tree with five palette homes, but it means **the contrast audit's 141 is a floor, not a total.** The true failure population is larger and I do not know by how much. Declared as a gap. It shrinks as the canon lands — which is itself an argument for the canon's sequencing in Paper 3 §5.

**D-4 · The `:root` pass only.**
All contrast figures are the `:root` theme. `html.theme-light` and `html.theme-flair` are not measured. F-09.7 has to close before measuring them means anything, since one of them carries an `!important` block that overrides whatever it is measured against.

**D-5 · Paper 2's decision count is the entry screen's, not the funnel's.**
Five decisions to first action. I did not census the full eleven-screen machine's decision count, because the charter asked what a first-time visitor faces "before anything happens" and that is the entry panel. Named so nobody reads five as the whole funnel.

**D-7 · My first verify line would have littered the founder's repo.**
The paste-test used `python3 -m py_compile tools/tdw09_census.py`, which ran green — and left a `tools/__pycache__/` directory in the tree, which `git status` then reported as untracked alongside the real delivery. A verify command that mutates the tree it verifies is not a verify. Swapped to `ast.parse` before shipping; re-tested green with **zero** side effects. Caught only because I ran `git status` after the paste-test rather than trusting the exit code.

**D-6 · I did not verify F-08.100's specimen.**
The chair's entry records five unpurgeable photos and a `makeupbyswatiroy` row with assets founder-deleted 2026-08-05. I have no database access and did not re-derive it. The *site* (`demoAdmin.js`, symbol `_photoGate`, both create paths) I verified by command; the *history* I carry from the chair. Stated rather than implied.

---

## 6 · WHAT IS NOT DONE

- **Every cure.** Phase 1 is papers. No cure byte ships until the founder rules §3.
- **The provenance SELECT is unrun.** Paper 4's plan is authored against a starting witness that is thirteen migrations stale, and says so at every step.
- **The LCP measurement.** Card handed, walk owed, number never claimed.
- **Screen 2's contrast figures** and the two unmeasured themes (D-4).
- **`F-09.15`** — unallocated, deliberately.
- **The north-star sentence** — still owed by the founder, and Paper 2's fork O cannot be ruled well without it.

---

## 7 · SEQUENCING NOTE

Cures follow the founder's order, smallest first. The estate's highest-yield single byte is **F-09.4's `ink-muted` correction** — one token value, 42+ sites, the defect closest to the complaint that opened this arc. It is blocked behind F-09.7's theme reconciliation, which is a founder ruling and not a build.

Sequencing beyond this sitting is the founder's.
