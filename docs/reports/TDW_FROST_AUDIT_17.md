# repo: dream-os @ f28cc6e
# TDW_FROST_AUDIT_17 — Block 17 (EXPERIENCE) Dependency Map
**Authored by:** FC-1, the First Frost Chair (parallel audit line, R-30.17) · **Date:** 2026-08-12
**Derivation tips:** dream-os **`f28cc6e`** · dreamos-pwa **`60b4317`** — movement above Report C's tips accounted by diff: FC-1's banked Reports B/C + the P3-D board rider (prospect admin tiles, both repos). Zero files in 17's subject radius.
**Scope per charter:** DEPENDENCY MAPPING ONLY. 17 stands on everything and builds last of the four; this report grades each edge 17 stands on, adds only the derivations no earlier report carried, and cites Reports A/B/C for the rest. Witness grades as before. Defects PROPOSED un-numbered; forks are QUESTIONS.

---

## §0 — EXECUTIVE SHAPE

17's edges land in three conditions:

1. **Edges onto upstream blocks 13/14/15/16 — all open, several onto items those blocks cannot currently deliver as specced** (the parity matrix, polls, envelopes, the inbox/proposals tray) — expected for a build-last block, enumerated in §1 so the eventual charter inherits states, not assumptions.
2. **Edges onto machinery with a committed death sentence:** P3's salons name `discover_heroes` as the hero source; that machinery is LIVE at these tips (table 8 cols on witness :397; `src/api/admin/discoverHeroes.js`; `couple/discover.js` reads) **and is chartered for retirement WHOLE at Block 09 Package 3** (CE-123 「 merge 」 — table drop, both endpoints, admin screen; spotlight becomes the slot's renderer; Package 3 gated-unlost at CE-208 on the founder's §5 provenance SELECT). 17-P3 written today would build on a floor 09 is chartered to remove. §2, Q-1.
3. **Edges the estate already crossed without 17:** the signature gesture (E-3) is PARTIALLY LIVE — double-tap-to-Muse with the heart bloom ships in sanctuary's Discover room since the 07 fold (`sanctuary:1740–:1745` double-tap within `DOUBLE_TAP_MS` → `spawnDiscHeart` + `saveVendorToMuse`; the tuned constants at `photoPager.ts:109` `DOUBLE_TAP_MS=270` with the derivation table at :74; long-press quick-look UNDERIVED — not found by this pass's greps, marked). E-9's one-time ₹999 unlock has NO rail: the billing lib is `razorpaySubscriptions.js` (Subscription Links) + webhook verify + tierFlip + ledger — **no order/one-time path exists** (dir listing + grep). §3.

Two of 17's inputs verified clean and ready: E-1's language law is ALREADY STANDING LAW (masterplan §2 row E-1 — banked, not owed), and the occupancy read for availability whispers exists at `src/lib/vendor/occupancy.js` with the checker family sealed since 04.

---

## §1 — THE DEPENDENCY TABLE (every §0-read-first / phase edge, graded)

| 17 needs | From | State at tips | Cite |
|---|---|---|---|
| Extracted blooms + FROZEN header (gestures "additive" against it) | 13 P2/P3 | **UNBUILT**; choreography byte-mapped, un-fenced; Discover-inside-sanctuary fork open (Q-1 of Report A) | A §2 |
| `frost`/`dark` both-theme proofs (every 17 acceptance says "both themes") | 13 P1/P5 | **SINGLE-THEME by founder ruling**; second theme retired-not-deleted | A §3; same amendment class as A Q-4 |
| 14 polls (E-4 ask-the-circle; P5 close-nudge) | 14 P5 | **ABSENT** — no tables on witness | B §6 C-4 |
| 14's 0087→0098 RPC (E-9 re-replaces it via 0093) | 14 P3 | live RPC = hard 3 at `0099`; 0098 stale-as-reserved — **E-9's re-replacement is the second write to a function whose first rewrite is itself forked** | B §7 14.A, Q-1 |
| 15 masthead (P1 chapter line mounts there) + envelopes (budget pulse) + inbox (P2 silencing "notify() respects the day"; E-6 renders 16's proposals) | 15 P2/P3/P5 | masthead UNBUILT (+ 13-sequencing fork); envelopes UNBUILT WHOLE; **inbox premise-broken — notify() does not exist**, so P2's "notify() respects the day" and E-6's tray both inherit 15's from-zero re-founding | C §2–§4, C 15.A |
| 16 proposals tray + signal consent + matcher (E-6 seal; P5 muse→signal; P6 consent writes) | 16 | **BLOCK 16 UNOPENED**; two live staging candidates already exist for any tray (`pending_event_proposals`, `pending_couple_drafts`) — the fork Report C named | C §5 |
| `discover_heroes` machinery (P3 salon covers) | 07-era, retiring at 09-P3 | **LIVE + DEATH-SENTENCED** (§0.2) | this report |
| taste-overlap ranking (Chosen-for rail) | 07 | **EXISTS as machinery**: `discover.js:87` `.overlaps('aesthetic_tags', vibeList)` + the D-5 ranking; a *personal rail presentation* of it is unbuilt, as the spec expects ("surfacing work only") — with Report C's F-10.52 caveat inherited: the vibe vocabulary currently yields ZERO exact matches (CE-202), its fold rides Rehaul Package 2 | + C context |
| occupancy read (availability whispers) | 04 | **EXISTS**: `src/lib/vendor/occupancy.js`, checker sealed | this report |
| chapter engine inputs (`days_until`, today.js, brideNudge cadence) | base | inputs EXIST (`couples.wedding_date`; `today.js` 105 ln; `src/agent/brideNudge.js` present as the cadence hook target); **`src/lib/chapter.js` ABSENT** (P1's own build, correctly) | C §3 + this report |
| muse contribution columns (boards inherit 14's `circle_status` semantics) | 14 P4 | **ABSENT** (no `contributed_by_member_id`/`circle_status`) | B §1 |
| 0092/0093 reservations | ladder | **HOLES** (`ls db/migrations | grep -E '009[0-5]'` = empty; 0090–0095 all unspent) — same register question as C Q-1: no ink names them the way 0099:10 names 0097/0098 | this report |
| `muse_boards` · `milestones_shown` · `couples.full_table` | 17's own DDL | **ABSENT on witness** (grep = 0) — clean floor | this report |
| Razorpay ONE-TIME path (E-9 ₹999 once) | 09/10 billing | **ABSENT**: `src/lib/billing/` = razorpay.js (webhook/signature) · razorpaySubscriptions.js (Subscription Links, `short_url` on create :172) · tierFlip · ledger — subscriptions only; no Orders/one-time API surface; and the whole rail is **DARK-ARMED-PAUSED on the 2FA gate** with acceptances ①②③ open | this report + memory-state; B/C context |
| sound/haptics home (`lib/experience/sound.ts`) | 17's own | **ABSENT** (find = empty); `haptic` helper already exists in `photoPager.ts` — a second haptics home would fork it; named for the charter | this report |
| E-3 gesture set | 17's own | **PARTIAL-LIVE in one room** (§0.3): Discover's double-tap+heart shipped; estate-wide cards, quick-look, sound assets, settings toggles unbuilt; the shipped constants (270ms etc.) are TUNED PRODUCTION VALUES the spec's "500ms bloom" prose must reconcile with, not overwrite | this report |
| E-1 language law | standing | **BANKED** — masterplan §2; the spec's "appended to MASTERPLAN + BUILD_PROTOCOL" is DONE for the masterplan half | masterplan read |

## §2 — THE TWO CROSS-BLOCK COLLISIONS WORTH THEIR OWN INK

**The salon×spotlight collision.** 17-P3 as written curates heroes through machinery 09-Package-3 retires by founder word. If Package 3 lands first (the current founder-ruled sequence: vendor rehaul → bride), the salon's source is SPOTLIGHT and 17's P3 text needs its amend-once rewrite to say so; if 17 somehow ran first, it would deepen dependence on a dying table days before its drop-SQL. Either way the two charters must name each other. (Also inherited whole: the spotlight ranking-boost coupling CE-123 left revisitable "at this block's veto" — 09's block, but the salon presentation is where a couple would feel it.)

**The RPC's three-writer future.** `invite_circle_member` currently at 0099 (hard 3); 14's 0098 reserved to rewrite it (stale ladder shape — B 14.A); 17's 0093 reserved to re-rewrite it (`full_table ? NULL : 3`). Three committed intentions on one function across two unopened blocks. B's Q-1 already carries the fork; this report adds only: **whichever arm wins, the copy set differs** (the tier whisper "Gold opens two more chairs" vs the unlock card "every chair, ₹999, once") and E-9's card copy is a founder-veto item no earlier block can pre-clear.

## §3 — PROPOSED DEFECTS (dependency-class only; CE-30 banks)

**PROPOSED-17.A — P3's hero-source sentence points at death-sentenced machinery** (evidence §0.2/§2). Amend-once target: salon covers source from SPOTLIGHT post-Package-3, or an explicit founder word to the contrary.

**PROPOSED-17.B — E-9's purchase leg has no rail:** no one-time/Orders path in the billing lib, and the subscription rail itself is paused on 2FA with live-mint acceptance open. The spec's "Razorpay one-time via the 09 path" cites a path that does not exist; the unlock cannot be built until a one-time rail is chartered (its natural home is the billing desk, F-10-adjacent — CE-30's ground; named, not designed).

**PROPOSED-17.C — E-3's spec prose vs shipped tuning:** the gesture family already lives in Discover with founder-walked constants (`photoPager.ts:74`'s derivation table, `DOUBLE_TAP_MS 270`); the spec's independent timings (500ms bloom, its own thresholds) predate them. Estate-wide rollout must ADOPT the shipped constants' home (one more reader of photoPager) or rule a divergence — silently re-implementing would mint the second-implementation disease on a founder-tuned surface. Ditto `haptic`'s existing home vs a new `sound.ts`.

**PROPOSED-17.D — the both-themes acceptance language across ALL of 17's criteria** inherits Report A's Q-4 amendment (single-theme ruling) — flagged here only so 17's amend-once pass sweeps its own table too.

## §4 — QUESTIONS FOR CE-30

**Q-1 — Sequencing word (feeds the dependency graph, Report E):** does 17 charter strictly after 16, and does 09-Package-3 (spotlight) precede all bride-track P3-touching work? FC-1's read of the edges says yes on both, but sequencing is the founder's; Report E will propose the full order AS A QUESTION.

**Q-2 — 0092/0093's register status** (same class as C Q-1 for 0088/0089): reserved in ink somewhere FC-1 lacks, or free above 0119?

**Q-3 — The one-time-rail charter's home:** billing desk (10's world) vs inside 17-P6? Pure homing; evidence at 17.B.

## §5 — WHAT A 17 CHARTER MUST INHERIT WITHOUT REDISCOVERY
1. E-1 is banked; stop re-legislating it.
2. The gesture family is half-shipped with tuned constants; adopt, don't re-implement.
3. The hero machinery is dying by ruling; salons source from its successor.
4. The RPC has three committed futures; one function, one winner, chosen before either block builds.
5. The unlock has no rail and the rail-family is paused; ₹999-once is a chartered build, not a wire.
6. Every "both themes" cell is single-theme until a ruling returns.
7. 16's tray will meet two live staging stores; the envelope theatre renders whichever wins C's Q-2 fork.

— END TDW_FROST_AUDIT_17 · FC-1 @ dream-os `f28cc6e` / dreamos-pwa `60b4317` —
