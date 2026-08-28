# CE SUCCESSION — CE-37 → CE-38
**Filed 2026-08-27 · dream-os @ 42b5616 · dreamos-pwa worklist @ 366a7b5 · pwa main @ aae3f99**
**Filed at the founder's order, on the founder's grievance, which is justified. This artifact is the record; chat is not.**

---

## §0 · WHY THE CHAIR CHANGES

Fourteen ZIPs into the vendor PWA revamp (Block 09, M-WORKLIST Phase 1), the product still reads — the founder's words — *shoddy, childlike, vibe-coded*. Twenty-odd deliveries in, he was still finding defects by walking pages himself late at night. The governance machinery held and improved; **the product quality it existed to produce did not arrive.** The founder's verdict: a chair that honors no rule is unfit to oversee LE work. This note accepts that verdict, records the method failure so it is not reproduced, banks the chat-held register into the tree, and hands over.

CE-37's own protocol violations, on record: c-37.10 (unguarded paste block → wrong-repo push 48cee92), c-37.11 (phase boundary under-sold twice), c-37.12 (ruled an affordance that lied with its shape), c-37.13 (ruled a physically unrunnable gate), c-37.14 (kickoffs without environment preambles — two seats blocked), c-37.15 (three unre-derived counts in one kickoff, violating the chair's own count law within a day of minting it), c-37.16 (chartered an endpoint at a live production address without checking the mount), c-37.18 (minted a ruling and never confirmed it reached the executor). The chair held others to laws it broke itself. That asymmetry, more than any single defect, is why this seat turns over.

## §1 · THE METHOD FAILURE — CE-38 reads this before anything else

CE-37 ran the visual arc the way backend arcs are run: **reactive rulings against reported defects.** Founder screenshots a fault → chair mints a ruling → seat ships a partial cure → a new fault appears beside it. That loop is correct for backend correctness and **wrong for design quality**, because design quality is not the absence of listed defects — it is one coherent standard applied everywhere at once. Fourteen ZIPs of whack-a-mole cannot converge on "polished CRM."

Compounding it: for twelve of fourteen ZIPs **nobody in the system had eyes.** Chair and seats read code; only the founder saw pixels; he became the QA instrument for his own product. That is why he is exhausted and why he is right to be angry.

**The mandate this note hands CE-38: stop ruling defect-by-defect. Commission ONE complete visual + interaction contract — every surface, every state, every byte — audit the whole product against it once with the render arm, and ship cures in at most two coherent passes.** The founder named the bar: the best CRM SaaS in the world, professional register. His acceptance question for every surface: *"does the billing page look like a billing page?"*

## §2 · THE FOUNDER'S GRIEVANCE LEDGER — verbatim in spirit, so he never repeats it

1. **The product feels vibe-coded, not professional.** Pages are assemblies of components, not designed surfaces. Test case: `/vendor/billing` reads like a WordPress page, not a money page — flat label/value rows, an alarm-word opener (「Cancelled. You're on Basic.」), 「Free — no AI」 selling an absence, transition-era narration (「Moved to Basic — subscription cancelled…」) doing nothing for a buyer.
2. **Touch is still bad.** Taps/clicks take visibly long to open (route-push latency with no pressed-state or loading feedback — mechanism UNDERIVED at handover). Distinct from the earlier `touch-action` defect (cured ZIP 2). Treat as new; derive first.
3. **The medallion/avatar:** correct on the shell main page, **dimmed everywhere else**, and **shifts toward center when tapped on Rooms** (drawer mount reflows the header — visible in the founder's 22:31 frames). R-37.79 ruled one identity; it shipped half-alive.
4. **Fonts remain non-uniform** across shell, rooms, drawer, chat despite three sweeps — sizes, families, italics.
5. **The poetic register in functional chrome** (「Your client stories live here」 etc.) — R-37.90 ruled its retirement; not yet executed anywhere.
6. **He should not be the defect-finder.** Ruled repeatedly (screenshot gate → executable gate → render arm); the spirit — his eyes meet only finished work — has not yet been honored end-to-end.
7. **He asked for what Block 07's UI/UX redesign did for the original layout** — a coherent, considered design pass — and received incremental patching instead.

## §3 · ESTATE STATE AT HANDOVER (verify everything fetch-first; R-37.86 binds all counts herein)

- **dreamos-pwa `worklist` @ 366a7b5** — ZIP 14 applied+pushed by the founder ~22:25 IST. Its verify strip printed all-PASS lines (seventeen rooms band ten · Collab pill dropped · gutter longhand · chat 85dvh · flash guard grounded · mock at hash · census→tools · render arm present) with the floor delta explained. **The chair-gate audit of its captures was NOT performed — CE-38's first desk item.**
- **dreamos-pwa `main` @ aae3f99** — untouched all arc. Receives nothing until Phase 7 cutover.
- **dream-os @ 42b5616** — Phase 3 delivery (`GET /api/v2/vendor/worklist/today`, module `src/api/vendor/worklistToday.js`, collision-free beside the live engine `/today` reader which the production Storefront score still consumes) applied+pushed. **The six §9.4 fixture SELECTs + curl walk on 9888294440 have NOT run — second desk item.** The frozen Phase 4 response contract lives in the Phase 3 handover; Phase 4 builds against that document, not the source.
- **Seats:** pwa Phase 1 (second seat) — competent, built the render arm, banked clean at seam. Phase 3 backend seat — excellent read-first discipline (caught the live-route collision the chair missed). Both re-seatable by their handover ladders.
- **Test fixtures:** vendor `9888294440` (Dev Roy Photography, basic, handle DEV440) · vendor line `917982159047` via `waNumberFor('vendor')` · support number `919888294440` via `supportWaNumber()` · money register `Rs X,XX,XXX` · gold `#C9A84C`.
- **Mock in-tree:** `docs/mocks/today-stature-mock.html` @ sha256 `507f9bb1143d002bb04d4ed656f388633c42a6e129f4d3d6f24c52769ce987e2` — the locked visual contract (founder word 「mock ok」).
- **Governing docs:** `docs/TDW_BUILD_PROTOCOL.md` · `docs/specs/WORKLIST_PARITY.md` (§11 signed through R-37.54) · `docs/FINDINGS_LOG.md` through CE-227 (register through ~R-37.53/.55 — see D-2/c-37.15 discrepancy noted below).

## §4 · THE CHAT-HELD REGISTER, BANKED — rulings R-37.56–.90, effective text

*(Post-dating every tree register. Where any tree document disagrees, the executor STOPs and reports the delta.)*

- **R-37.56** — receipt lines carry the FULL wamid, byte-identical to send lines.
- **R-37.57** — `[wa:receipt]` absorbs the old `webhook:meta` token; one line per callback.
- **R-37.58** — `err=` omitted on success; `errors[0].code/.title` + `err_count` when >1.
- **R-37.59** — the send↔receipt correlation home stays priced-not-built; `home=none` is honest.
- **R-37.60** — the room set derives to slice-seats-unfolded; superseded numerically by .87 (see below). Count history: §7.6's "11" → 15 (derived) → 16 (founder: Contact Support) → **17 (founder: Collab)** — each step derived or founder-worded, never fitted.
- **R-37.61** — Settings and Billing take Rooms tiles; coin duplication stands (F-09.118 C2).
- **R-37.62** — Portfolio pinnable-but-unpinned; pin defaults are Calendar + Storefront (§8.2).
- **R-37.63** — four UX riders: ① tile badges read the SAME response as the Today feed, badge-equals-count cell (Phase 4) · ② frozen tile positions — ruled anti-feature, never reorder · ③ resting Today = `done_today` summary (Phase 4) · ④ More dies with every M-row given a named destination (Phase 2). Refusals: no search-as-navigation, no third container.
- **R-37.64** — rider-⑤ binds shell chrome only. Test: a control that helps you choose where to go is banned; one that works with what's in front of you is the room's business. Slice bodies keep search + FilterRail.
- **R-37.65** — the branch defines its own theme at the token layer. **Graphite & Signal ruled, both modes, 33 tokens** (24 `--atelier-*` + 9 `--role-*`); F-09.28 measured-ratio discipline; `--role-metal` theme-conditional; house gold `#C9A84C` survives as accent.
- **R-37.66 (as amended)** — Contact Support is a ROOM in the bottom band, not a nav seat; tile byte 「Business Solutions」 per .67-A.
- **R-37.67 / .67-A** — the support tile: coming-soon sheet + WhatsApp to the founder via declared home (`supportWaNumber()` / `NEXT_PUBLIC_TDW_SUPPORT_WA_NUMBER`, fallback 919888294440), never inline. Register is growth-first (ads, reach-outs, SEO, features); broken-things secondary. Founder bytes locked.
- **R-37.68 / -A / -B** — first-run Today is the capability manual: forward-promise headline, card set (24/7 enquiry desk · TDW link [hidden without handle, claims routing only] · census-backed chips · rooms pointer · Ask us for more), ≤3 tight sentences per card, explainer character, retires at first data, distinct from the §8.10 tour.
- **R-37.69 / .83** — the Ask TDW dock summons the IN-APP chat (shipped Arm A, ZIP 10). The WhatsApp deep-link keeps exactly one home: the Rooms row 「TDW on WhatsApp」.
- **R-37.70** — DreamAi, never Victor, in all chrome.
- **R-37.71** — tier-aware first-run variant defers to Phase 4, drafted+vetoed there, never silently.
- **R-37.72** — TDW never calls itself "app"; header byte 「What TDW does for you」.
- **R-37.73** — the quality bar: every interactive target ≥44×44 CSS px; type sizes are named tokens (no label <11px, no interactive text <12px, body ≥14); the approved sheet/mock is the acceptance spec.
- **R-37.74** — one app, one nav: the branch swaps the old five-door BottomNav on deep-linked `/vendor/*` routes.
- **R-37.75** — Rooms-first landing; Today second seat; manifest `start_url`, seat order, bare-`/w` redirect agree; revisit hook when Phase 4 ships the live feed.
- **R-37.76** — the eight-item coherence set (superseded in detail by .78–.84 where they overlap).
- **R-37.78** — naming grammar: 「Ask TDW」 is the verb on affordances; DreamAi is the name in prose. Founder bytes: Rooms row 「TDW on WhatsApp」; profile row 「Profile layout」.
- **R-37.79** — the DR medallion is the ONE identity component at BOTH mounts, adopted WITH its WHOLE drawer: Discover Profile · Settings · Billing · The Dream Wedding · Tips & Features · DISPLAY (Graphite/Chalk) · assistant row · Sign Out. **Open defects against this ruling at handover: dimmed medallion off-shell; center-shift on drawer open.**
- **R-37.80** — the chip promise + the 42-site raw-CSS-var disposition table maintained.
- **R-37.81** — 「Profile layout」 row ships via the couple-view surface; the Discover-feed limb is derive-or-STOP (no cross-lane session machinery in a shell ZIP).
- **R-37.82** — the gutter law: one `--wl-gutter` owned by the scroll column; NO component defines its own horizontal inset (cell-asserted); one-line 52px rows; the grouped panel with tile-sibling chrome; caps-tracked subtitles stay dead.
- **R-37.84** — the six-item coherence order: one medallion · house wordmark in the shell header (「The Dream Wedding」 Cormorant 17px over Jost surface micro) · italic serif dies in room prose per the mock's fourth screen · 「Moved to…」 vestiges suppressed on branch · the `wa.me` copy row lives in Settings, not Rooms · the drawer is an anchored overlay, grid undisplaced. Plus ⑦: a dead control never survives to the gate.
- **R-37.85** — the executable gate: every visual ZIP ships `scripts/wl_audit.mjs` (served-bytes arm) run by the founder in ONE paste against the deploy; any FAIL and he never opens the app. Coverage line prints first; a coverage miss aborts as GATE-UNSOUND. Computed facts (does it paint, where, in what style) belong to the RENDER ARM (`tools/wl_render.cjs`), never asserted from served bytes.
- **R-37.86** — the count law: no count, census, or completeness claim quoted forward without re-derivation at the moment of quoting. The brace-matching sweep instrument is banned absent per-edit review.
- **R-37.87** — Collab takes its own tile (founder word). SEVENTEEN rooms; bottom band ten; Storefront's pill row drops Collab; frozen-order cell amended by label.
- **R-37.88** — the mock lives in the tree at `docs/mocks/today-stature-mock.html` with its hash recorded; no founder upload ever again.
- **R-37.89** — the risen chat is a work surface: opens at 85dvh, scrim, drag-dismiss, input pinned above safe-area, branch tokens throughout; render-arm computed-height cell ≥0.8×vh.
- **R-37.90** — the functional register: labels, states, empty states, actions speak plain professional CRM language; the poetic-atelier voice retires from functional chrome (at most one deliberate brand moment per surface, founder-vetoable). All copy changes ride a Copy Register Sheet (current → proposed) for ONE founder pass.

**Findings chat-held at handover:** **F-16.36** (the unsound-fetch gate — cured ZIP 13–14; its text: an instrument whose bundle reader misses lazy chunks prints false reds and false greens with equal confidence; the false greens are the dangerous half) · **F-P3.1–.6** (Phase 3's filed corrections: cancelled-invoice leak; draft-contract leak; week-vs-day; census third door; last_payment_at predicate; R-37.63 ① unreadable in any repo — this document cures .6 by existing) · the five-homes `istTodayISO` census (F-number owed at next banding) · the espresso-flash mechanism (unpainted session gate showing the old hub atmosphere; guard grounded in ZIP 14; glass confirmation owed) · ZIP 11/12's non-reproducible floor claims (F-number owed) · **corrections c-37.1–c-37.18** as summarized in §0.

**Known tree discrepancies, unreconciled by design:** the kickoff-era "twelve handovers" vs nine on disk; "register through R-37.55" vs R-37.53 highest in FINDINGS_LOG; §7.6's "11" superseded by the 17-count history. Each is recorded here rather than smoothed.

## §5 · TOOLS CE-38 INHERITS THAT CE-37 DID NOT HAVE

The **render arm** (`tools/wl_render.cjs` — real Chromium via @sparticuz/chromium past the denied CDN, computed styles, fullPage captures with provenance labels, both modes, tapped states) · the **executable gate** (`scripts/wl_audit.mjs`, coverage-first) · the **mock in-tree** at a recorded hash · two proven seats with clean handover ladders · a founder who applies, pushes, and pastes within minutes. The capture protocol plus the render arm makes §1's contract-first mandate executable for the first time.

## §6 · OPENING SEQUENCE, proposed not imposed

1. **Chair-gate ZIP 14's capture set yourself** — log every visible defect at the chair's desk. The founder walks nothing until this is done.
2. **Derive the three open defects from the founder's 22:31 report:** tap/route latency mechanism · medallion dimmed off-shell · medallion center-shift on drawer open.
3. **Issue M-FINISH as the complete contract, not a defect list:** per-surface specification (layout, applied type scale, states, copy in R-37.90's register — the full Copy Register Sheet for one founder pass), audited by render-arm captures against the world-class-CRM bar, cured in at most two coherent passes. The billing page is the founder's named test case.
4. **Run Phase 3's walk** (six fixture SELECTs → curl card, founder's rows first), then charter Phase 4 against the frozen contract — the live morning brief is what makes Today real.
5. Keep: verify-never-trust at origin · the count law · both-ways proof · transport-confirmed rulings · the founder's bytes are sovereign. **Discard: the reactive cadence.**

The founder's sentence hangs over the next desk: *he cannot go on searching every page for every defect.* Make it so he never has to again.

— **CE-37, closed.** The failures above are mine where they are anyone's; the seats built what they were ordered to build.

> **Appended by CE-39, 2026-08-29 (F-39.1):** this note lacks the KICKOFF DOCTRINE section protocol §11 requires. The section lives in `CE_SUCCESSION_CE38_TO_CE39.md` §7 and binds every chair from this date.
