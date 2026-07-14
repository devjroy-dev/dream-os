# TDW_13_FROST_FOUNDATION_FINAL — The Extraction, Two Bride Themes, and the Splash System
**Block:** 13 (first of the bride family) · **Repos:** dreamos-pwa (primary), dream-os (slides column, splash reads) · **Depends on:** TDW_03 (AppSplash component), TDW_07 (image discipline; discover canvas already owned there), TDW_09 (semantic token architecture)
**Gates:** TDW_12_NATIVE_BRIDE (the sanctuary extraction is its explicit gate) and TDW_15 (consumes the parity matrix)
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| Source | Verifying |
|---|---|
| `app/(frost)/frost/canvas/sanctuary/page.tsx` (4,136 ln) | The twelve blooms, the conductor logic tangled within, and above all the open/close CHOREOGRAPHY (timings, easings, gesture handoffs) — record it before touching it |
| `app/(frost)/frost/canvas/{muse,dream,journey,surprise,onboarding}/page.tsx` | Adjacent canvas pages sharing primitives; discover is 07's — untouched here |
| The bride theme mechanism (globals.css frost sections + whatever hook/context drives blue-white vs red — MAP IT, it is not in sanctuary) | What P1 formalizes into token sets |
| `lib/frost-api/*` | The typed clients; which blooms write vs read (P6 matrix raw material) |
| `src/agent/brideTools.js` (25 tools) + brideEngine surfaces | The parity matrix's other axis |
| `src/api/landing-slides.js` + the admin slides section | The audience-column extension target |
| `components/AppSplash.tsx` (03 P6) | The component both new mounts reuse |
| `lib/design/tokens.ts` (09 + Addendum A) | The semantic architecture the bride sets join |
| `src/api/vendor/portfolio.js` reads | The vendor own-portfolio splash source (F-3) |
| `couples` table in SCHEMA | Whether theme persists server-side today (P5 adds it if not) |

## 1. LOCKED FOUNDER DECISIONS
| # | Ruling |
|---|---|
| F-1 | Extraction is PURE MECHANICAL SURGERY — no feature work smuggled; the bloom open/close choreography is sacred and survives byte-identical |
| F-2 | Bride cold-open splash = a bride-specific, admin-curated collection via the audience-tagged slides system |
| F-3 | Vendor splash amended: **their own portfolio first** (the app opens like the door to their own studio); `vendor_fallback` admin collection when portfolio is thin (<3 usable images). Amends TDW_03 P6 + TDW_11 N-2 — dated addenda applied to both specs |
| F-4 | Bride theme sets named **`frost`** (blue-and-white) and **`dark`** (the red-based curated dark — NOT a generic inversion; architected as potentially cross-audience since the app trends universal) |
| F-5 | Parity matrix (brideEngine capabilities × bloom write-parity) is a Block-13 document deliverable feeding TDW_15 |
| F-6 | **Two store listings, one codebase:** `native/vendor/` and `native/bride/` as thin app targets over the shared foundation (TDW_11 §3 amended); a future merge into one universal listing remains a routing change by design |
| F-7 | Foundation hygiene rides this block: LQIP/variants on every bloom, skeletons over spinners, shared money/date formatters, safe-areas, reduced-motion, and a 60fps canvas budget |

## 2. PROPOSED — AWAITING FOUNDER RULING
(none at spec time)

## 3. MIGRATION RESERVATIONS (ladder after 0085 = next 0086; LD-8)
| # | File | Adds |
|---|---|---|
| 0086 | `0086_splash_and_bride_theme.sql` | `landing_slides.audience text not null default 'landing' check (audience in ('landing','bride','vendor_fallback'))` (existing rows keep serving the landing page unchanged) · `couples.theme text check (theme in ('frost','dark'))` nullable → app default `frost` (added only if verification finds no server persistence today) |

---

## PHASE TABLE (one phase per sitting)

### P1 — The bride token sets (F-4)
1. Map the live theme mechanism (read-first) and transcribe both palettes faithfully into `lib/design/tokens.ts` as semantic sets `frost` and `dark` beside the vendor sets — same semantic keys (`surface/ink/accent/hairline/dim/…`), bride values. `dark` is authored FROM the red palette (its accents, its warmth), documented as curated-dark in the token file header.
2. Shared frost primitives (globals-level styles, any shared canvas components) converted to semantics NOW; blooms convert during their own extraction commits (P2/P3) — no big-bang restyle.
3. The accent law binds both sets (≤3 per screen, one dominant), enforced by the 09 grep gate extended to frost paths.
**Proof:** both themes render pixel-faithful to today on the un-extracted app (screenshot pass ×2) — tokens changed the plumbing, not the water.

### P2 — The conductor + blooms one through six
1. Build the thin conductor first: sanctuary becomes bloom registry + open/close choreography + shared canvas state; the choreography code moves ONCE, verbatim, and is then frozen (a `// CHOREOGRAPHY — FROZEN (F-1)` header; any diff inside it in later commits is a failed session).
2. Extract six blooms → `components/frost/blooms/<room>.tsx`, each in TWO commits: (a) verbatim relocation, imports only; (b) token conversion + nothing else. Zero-behavior gate per bloom: manual pass + screenshot ×2 themes + a screen-recorded open/close compared side-by-side with the pre-extraction recording (the choreography proof).
3. Suggested first six (executor may reorder by tangle-depth, recorded): settings, people, reminders/meridian, moments, events, expenses.

### P3 — Blooms seven through twelve + conductor closeout
Remaining blooms (vendors, circle, and the rest) under the same two-commit law. Circle bloom moves AS-IS — its invite bug is TDW_14's surgery, not this block's (F-1). Closeout: `sanctuary/page.tsx` lands under ~400 lines (conductor only); a map in `docs/FROST_BLOOMS.md` names every bloom file, its data sources, and its write doors — the room-by-room index 14/15 build on.

### P4 — The splash system (F-2, F-3)
1. Apply 0086. Admin slides section gains collection tabs (`Landing · Bride · Vendor fallback`) — a scoped rider on the admin content page (10's domain, one tab control; recorded in 10's handover notes).
2. **Bride mount:** AppSplash (03) mounted at the frost root — bride collection slides, same Ken Burns choreography, same min/max/tap-skip, module-scope cold-start flag, silent offline skip. Both bride themes get the same splash (imagery is theme-agnostic; the scrim adapts to the active set).
3. **Vendor amendment (F-3):** the vendor splash source becomes portfolio-first — fetch own portfolio covers (card variants, first 3 by order); <3 usable → `vendor_fallback` collection; the dated addenda land in TDW_03 and TDW_11 files this sitting. PWA and native share the selection logic (a small pure function in shared lib).
**Proof:** admin uploads a bride slide → next bride cold-open shows it; a 20-photo vendor sees their own work; a 2-photo vendor sees the fallback collection.

### P5 — Foundation hygiene (F-7) + theme persistence
LQIP + Cloudinary variants across every bloom's imagery (the 07 helper reused) · skeleton shimmer replacing all frost spinners · shared money/date formatters swept through blooms (grep gate on stragglers) · safe-area audit · reduced-motion collapses the canvas to opacity fades (choreography exempted from REMOVAL — it collapses gracefully, never half-animates) · **the 60fps budget:** Chrome tracing on mid-range Android across three bloom open/close cycles per bloom — sustained jank is a failed gate, fixed before the block closes · theme switcher lands in the settings bloom (two swatch cards, `couples.theme` server-persisted, no storage APIs).

### P6 — The parity matrix (F-5) + sweep
`docs/BRIDE_PARITY_MATRIX.md`: rows = the 25 brideTools capabilities (+ WhatsApp-only behaviors like receipt OCR, nudges); columns = read-in-bloom / write-in-bloom / gap; every gap annotated with the owning bloom and the backend door that exists or is missing. This document IS TDW_15's contract — precision here buys that whole block its map. Full acceptance sweep, both themes, recordings archived.

---

## 4. GUARDRAILS
F-1 absolute: any behavior or choreography change during extraction is a failed session; the FROZEN header is inviolable · discover canvas untouched (07 owns it) · circle's bug untouched (14 owns it) · no feature additions anywhere in P2/P3 · tokens only — hex literals in moved code get converted in commit (b), never invented · both themes on every proof · no localStorage (theme is server truth) · WhatsApp engines and souls untouched · bloom files stay presentational: data access remains in lib/frost-api (a fetch inside a bloom is a failed session).

## 5. ACCEPTANCE CRITERIA
1. Sanctuary ≤~400 lines, conductor-only; twelve bloom files exist; FROST_BLOOMS.md complete.
2. Side-by-side recordings: pre- vs post-extraction open/close indistinguishable, both themes, every bloom.
3. Token gate: zero hex literals in frost components; both sets swap live via the settings switcher; theme survives re-login + second device.
4. Splash: bride collection cold-open with Ken Burns; portfolio-rich vendor sees own work, thin vendor sees fallback; admin tabs curate all three collections; offline skips silently.
5. 60fps traces archived per bloom on mid-range Android; formatter + LQIP grep gates green.
6. Parity matrix reviewed by the founder — every brideEngine capability accounted for.
7. `tsc --noEmit` clean; 0086 proven; TDW_03/TDW_11 addenda applied; MASTERPLAN gains F-1…F-7 and re-opens the TDW_12 gate as SATISFIED.

## 6. FOUNDER SMOKE (phone)
Cold-open the bride app — your curated album Ken-Burns in → walk all twelve blooms in `frost`, feel that nothing moved → switch to `dark` in settings, walk them again → kill the app, reopen: theme held → open the vendor app: your test vendor's own portfolio breathes in → thin-vendor account: the fallback collection → upload a new bride slide in admin, cold-open again.

## 7. NATIVE-IMPLICATIONS CLAUSE
This block IS TDW_12's gate: extracted blooms map to RN screens; the `frost`/`dark` sets ride the same token architecture the vendor app already consumes; F-6's two-target workspace (`native/vendor/`, `native/bride/`) is recorded in TDW_11 §3 by addendum. The splash selection logic is a shared pure function both platforms import.

## 8. SESSION BOUNDARIES
Six sittings P1→P6 strictly (P1 before any extraction; P4 may run after P2). Handover per protocol; FROST_BLOOMS.md + the parity matrix handed forward; MASTERPLAN updated. TDW_14 (Circle + Coplanner) opens with the invite-chain surgery at the location this block's read confirmed.


---

## ADDENDUM (2026-07-14, from TDW_01 Phase B ruling Q3): P5 additionally owns the frost mock excision — remove the mock import/branches from `lib/frost-api/couple.ts`, then delete `lib/mocks/bride.ts`. tsc gate applies; blooms untouched beyond the import line. Closes the declared gap from the 01 handover. NOTE from ruling Q4: `lib/types/` is the frost-side tree (not a duplicate of `lib/vendor/types/`) — the corrected topology is recorded in the 01 handover.
