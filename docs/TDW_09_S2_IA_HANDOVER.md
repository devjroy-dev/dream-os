# TDW_09 · UX BLUEPRINT · STAGE 1 (IA MAP) — EXECUTOR HANDOVER

**Base:** dream-os `e0ff7d9` · dreamos-pwa `e3210b5`, re-derived at origin fetch-first at session open; tips matched the kickoff's exactly, no drift.
**Under:** the UX Blueprint kickoff + AD-X1/AD-X2 + CE ruling R-X1–R-X5. Stage 1 of F-2(b)'s staged order.
**This ZIP moves dream-os bytes only: two docs + one instrument. Zero pwa bytes. Zero soul/lens/prompt/engine bytes — W-1 held absolute. Zero copy bytes ship (expected-zero held).**

## 1 · WHAT SHIPPED
| Path | What |
|---|---|
| `docs/specs/TDW_09_S2_IA_MAP.md` | the IA map — entry points, lane maps with one-sentence purposes (graded [D]/[C]/[N]), depth, duplicates, orphan floor 29 hand-classified, dead-end floor 10 classified, MISS class 13 classified |
| `tools/tdw09_ia_map.py` | the instrument — three passes, named failure modes, wrong-tree refusal (exits 1 with a named reason), comment-stripping, layout + imported-chrome attribution, unique-suffix resolution with ambiguity → UNRESOLVED |
| `docs/TDW_09_S2_IA_HANDOVER.md` | this file |

## 2 · FINDINGS MINTED — F-09.17 · .18 · .19 (filed in the paper; the chair enters the ledger)
**F-09.17** the public `/discover` feed's SignupNudge CTA → `/auth/signup`, a route that does not exist (`DiscoverFeed.tsx:182`) — a live, public conversion 404. **F-09.18** `/vendor/studio` link-orphaned while the nav's "Studio" is a mode landing on `/vendor/calendar` (`Header.tsx:77`) — the R-U17 audit inherits the collision half. **F-09.19** `/about` + `/privacy` zero inbound both instruments. **Next free: F-09.20.** F-07.95's 17-screen phantom population independently corroborated (recorded as corroboration, not re-minted).

## 3 · DISCLOSURES, BY NAME — MINE
**D-1 · The instrument was wrong four times and hand-reading caught every one** (literal-only extraction → 89 false orphans; wildcard-swallowing suffix match; `location.replace` as call not assignment; comment-resurrected dead tab). Each rewritten, not tuned; each published in the paper's §1 with the site that convicted it. The final orphan figure moved 89 → 45 → 30 → 29 across the convictions; had draft 1 shipped, the founder would have received a map calling two-thirds of his estate unreachable.
**D-2 · Edge attribution has two declared shallownesses:** component-borne edges spread only through layouts that import them one hop deep with literal specifiers; page-level component imports are not spread (a component used by one page attributes as chrome, not as that page's outbound). Effect: per-route *outbound* under-counts on component-heavy pages; the orphan floor (inbound) is unaffected because chrome inbound is still registered.
**D-3 · 16 computed-nav sites and 8 UNRESOLVED templates are outside the graph** — counted, never guessed. `/vendor/pin` proved the class contains real edges (hand-verified reachable); nothing else in the floors was acquitted by assumption.
**D-4 · Purpose-sentence grades are honest to their evidence:** [N] rows (route-name + lane inference) are owed a walk before any cure builds on them; I did not open all 124 pages and the paper says which I did.

## 4 · FLOOR — the delivery gates
`ast.parse` on the instrument: clean (no `py_compile` — D-7's tree-mutation lesson inherited). Instrument triple-run: identical summary line ×3 (`routes=124 edges_resolved=1401 unresolved=8 miss=13 external=35 dynamic_nav_sites=16 / orphans_FLOOR=29 deadends_FLOOR=10`); pointed at a non-pwa directory it **exits 1 with a named reason**. dream-os `npm run build` exit 0 (no-regression witness; no src bytes moved). pwa untouched; its build red remains the documented font-fetch environment limit, unchanged by this delivery.

## 5 · WHAT IS NOT DONE
Stage 2+ (heuristic/states/touch, the four fork papers, theme strategy, cure queue) — held to the staged order. The three cures (F-09.17/.18/.19) — filed, not built; .17's one-line cure carries a founder fork (couple-first vs invite path). The [N]-grade purpose walks. The `/vendor/auth/handoff` one-sentence founder question (live door or dead rail?).

Sequencing beyond this sitting is the founder's.
