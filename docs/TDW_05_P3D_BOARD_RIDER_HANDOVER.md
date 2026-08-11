# TDW_05.P3-D RIDER — THE BOARD CURE (F-05.70) · EXECUTOR HANDOVER

**Sitting:** one rider on the sealed P3-D seat · **role:** LE · **chair:** CE-30
**Rulings:** R-30.22 (arm c) · R-30.23 · R-30.24
**Base:** dream-os `31eaa68` · dreamos-pwa `c0faa4e`

## 1 · TIP DRIFT, NAMED
The rider stated dream-os `2a9253d`; origin was **`31eaa68`**. Proven docs-only before a byte was written: `git diff --stat 2a9253d..31eaa68` → one file, `docs/reports/TDW_FROST_AUDIT_13.md`, +180, zero code. Built at the derived tip.

## 2 · WHAT SHIPPED
| path | change |
|---|---|
| `src/api/admin/prospects.js` | `openers_sent_total` served (limb 1) · the counts seed now takes observed rows as well as the vocabulary (limb 2, R-30.23) · the `select` fetches `last_template_at` |
| `scripts/b05_p3d_board_counts_bench.js` | **NEW.** 10 cells, 4 mutations |
| `app/admin/prospects/page.tsx` | tile row GENERATED from the counts object · curated label map + humanising fallback · cumulative tile · R-30.24's sub-line replacement |
| `scripts/tdw05_p3d_board_tiles.proof.mjs` | **NEW.** 24 cells, 6 mutations |

Five hardcoded `StatCard`s retired; exactly two call sites remain — the generated one and the cumulative one.

## 3 · PROVEN
- `b05_p3d_board_counts_bench` **10/10** · total 10 · run 10 · skipped 0 · in-process, no network, no DB. All 4 mutations red.
- `tdw05_p3d_board_tiles` **24/24** · total 24 · run 24 · skipped 0. All 6 mutations red.
- Gates: `npm run build` exit 0 · pwa `rm -rf .next && tsc --noEmit` exit 0, **zero** `error TS`.
- Floor sibling-full, byte-stable: exit bench 36/36 · intake 13/13 · combined_cap 37/37 · b07_p5 136/136 · relay_hand 126/126 · selfserve 30/30 · pwa exit proof 28/28 · eight more exit 0. Pre-declared reds unmoved: f0555 22/23 · f0772 158/159 · elders meter 28/29.

## 4 · THE NAMED TEST
The founder's own SQL is the fixture, not an invention: 4 `expired` (all templated) + 2 `replied` (never templated). The bench asserts `openers_sent_total === 4` **while** `counts.templated === 0` in the same payload. The two `replied` rows are counted as prospects and not as openers — they messaged us first.

## 5 · SELF-CAUGHT, disclosed at discovery
1. **A vacuous cell**, caught by the mutation matrix: `column_unfetched` went green because the fake plane's `select()` ignored its argument and returned whole rows. A fake more generous than PostgREST cannot catch a query asking for too little. The plane now projects; the mutation bites.
2. **A gate run without dependencies.** The first `tsc` ran on a fresh clone with no `node_modules` and emitted hundreds of TS2307s. That is not a gate result; it was re-run after `npm ci` and reported only then.

## 6 · OPEN, CARRIED
- **`.69`** — the repeat-outbound defect (three outbounds answering one question, two byte-identical), from the deleted thread's export. Unchartered.
- F-05.68's deeper limb; the `sendWa` wire gate; the demo-leads no-exit mirror — all unchanged from the P3-D handover.
- **`Bridge.tsx:446`** renders the prospect funnel via `StageBar` off a *different* endpoint (`bridge.js` `PROSPECT_STATES`). Not this rider's radius; named so nobody assumes it moved twice.
