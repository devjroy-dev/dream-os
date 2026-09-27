# TDW · CE-46 · ASK-2 · CUT 2a HANDOVER · the scrub comma (F-44.210), the text-only last round, the record home, bank v3. Both lanes OFF.

Base da9c7ef (r2), derived by command at the cut (`git fetch -q origin && git rev-parse --short origin/main`); 2a was cut on dc1dfd1 and carried onto 6034c10 and da9c7ef by command, the diff byte-identical each time (cmp of the patches). Line numbers below are as at dc1dfd1 where cited; none of the eight paths moved between the tips. r2 exists for e-200: block F now runs under `env -u ANTHROPIC_API_KEY -u DEEPSEEK_API_KEY` (A-46.4); the package is otherwise 2a byte for byte. Nothing a vendor reads changes with this cut:
both keys stay OFF (laneFlags.js :135, :136). Production: `src/lib/vendor/scrub.js` (one pattern), `src/lib/vendor/askAgent.js` (the last round).
Scripts: `scripts/b130a_ask1_floor_bench.js` (§18, M14, 13.4 re-pinned by label), `scripts/b130m_ask1_measure.js` (the record home), new rung
`scripts/b138_scrub_comma_bench.js`, `scripts/lib/ask1_bank.json` (v3). The chair's rulings of 27 September on the read-first, applied as ruled.

## What changed

- **F-44.210, cured.** `scrub.js` REGISTER_RE (:174 at the base, not :141 as the read-first cited; e-199 below) took `[\d,]+` as a figure, so the
  comma AFTER a rupee amount was swallowed and re-dressed away: "Rs 76,000, due 30 September 2026" reached the vendor as "Rs 76,000 due 30
  September 2026". Now `\d+(?:,\d+)*`: a comma is part of the figure only when a digit follows it. The lift is that one pattern; the persona arms,
  the register's scale words (₹4 lakh → Rs 4,00,000) and the id floor are byte-untouched. Unchanged and disclosed: "Rs 1,2" still reads Rs 12 as
  it did before (a comma between digits joins them). The Donna, Harvey and ev-N residuals are the firewall's design, named only.
- **F2 (b), the last round is text-only** (`askAgent.js` requestParams takes `{ final }`; the loop passes `final: round === MAX_ROUNDS`). On round 4 the
  request carries no tools, so a model that would have called a fifth-round tool answers from what it holds instead of the glitch line
  (q335's `too_many_rounds`, the one error of the run of record). Rounds 1 to 3 are byte-identical to before: same cached prefix (15.1, 15.2, 18.4).
  The tool-less final round is its own prefix (the system block alone, about 5,200 tokens, above Haiku's minimum), cached on its own after its
  first use. No re-measure, as ruled.
- **A-46.3, the record home** (`b130m --live`): `scripts/records/b130m/b130m_<model>_<tip>_<YYYYMMDD-HHMM>.jsonl` under the root, `--record=<path>`
  to name it; an existing path REFUSES with exit 2 before any call unless `--resume`, which reads the kept results and appends; the `/tmp` home and the
  `.old` rename are deleted. Proven in the container: `--live --model=haiku --record=<existing> --budget=1` printed REFUSED and exited 2 with no key.
- **Bank v3, three labels by label:** q222 tools `["team", "events"]`; q272 a fact carrying `5 March 2027` (the store's la-isha); q290 a fact carrying
  `24 October 2026` read by `day` (the store blocks 24 October, ea-block-oct2, so no booking is due and no hand-back). 362 questions, no wording moved.

## Proven
- b130a 126/0 (119 carried; §18 six cells: the final round carries no tools, a tool-every-round model is answered on round 4, a two-round control,
  the cached prefix unchanged, bank v3 by label, the store's two facts; M14 reddening 18.1 and 18.2); 14.8 dirt gate intact.
- b138 11/0: nine comma forms both ways, the 34 worked replies byte-identical through scrubText, the door's B73 and B80 lines byte-identical,
  b06_m4 §2.5's control, M1 (the old pattern restored) reddening §1 and §2, scrub.js restored by sha256.
- b130m bare = --readers 34/0/0, exit 0 (A-46.1); --dry 342/342 through the real loop over bank v3, zero writes.
- The radius, derived by command (`grep -l "scrub\|askAgent\|ask1_bank" scripts/*.js`; 20 files at dc1dfd1, 22 at da9c7ef with IGD-2's b136 and the new b138), run at the base and at the cut on each tip: every rung's cells
  identical by name and count except b130a (119 → 126); b05_p4_crons RED on both sides (floor-base), b06_gauntlet REFUSED on both (no key). b90 227
  lines identical, b05 57 identical. The engine was built once at the base; no engine source moved.
- Readers re-scored on the run of record: NOT run here. The record (haiku_record4.jsonl, ~/b130m_keep/) is on the founder's machine; the rescore is
  his block 4 below and its counts go to the chair from his paste.

## Departures, for the chair
- **d1** The chair ruled a root `.gitignore` line for `scripts/records/`. A dotfile may not travel inside `deploy/` (§9's belt-and-braces law), so the
  ZIP carries none. Two things stand in for it: b130m writes `scripts/records/.gitignore` (`*`) when it first creates the directory, so a record can
  never be staged even on a fresh clone; and block 3's git line names nothing under `scripts/records/`. If the chair still wants the root line, it is
  one founder-run `printf ... >> .gitignore` command in a later block, named in that block's git line.
- **e-199 (mine):** the read-first cited the register pattern at scrub.js :141; it is :174. The read-first's line came off a filtered `sed` window
  (comment lines dropped), the independent-method law's exact specimen. The cure in this cut is at :174.

## Next (the seat's package after the chair's confirm)
The founder's no-change walk is recorded at ten of twelve; M4's two rows close it. Then the ARM card (C2-1 with RETURNING, C2-2 the read-back, the
DISARM beside them marked for the chair's word) and the app walk (his five questions, then Part B). Cut 3 (WhatsApp ON) and the WhatsApp reply's
unscrubbed path are ASK-3's; search-first (q016, q026, q317) goes to ASK-3 with the DeepSeek measure, as ruled.
