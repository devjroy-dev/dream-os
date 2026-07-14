# TDW_17_EXPERIENCE_FINAL — The Beloved Layer: Chapters, Theatre, Sound, and One Beautiful Unlock
**Block:** 17 · **Repos:** dreamos-pwa (primary), dream-os (chapter reads, boards, Full Table, salon data) · **Depends on:** TDW_13 (blooms, tokens, choreography law), TDW_14 (circle + polls + C-2 amended here), TDW_15 (masthead, inbox, envelopes), TDW_16 (proposals tray, signals)
**Author:** Chief Engineer session, 2026-07-14 · **Doctrine:** TDW_BUILD_PROTOCOL.md governs

---

## 0. READ FIRST (verify before any edit)
| Source | Verifying |
|---|---|
| `couples` (days_until derivation), today.js, brideNudge/briefing | The chapter engine's inputs + cadence hooks |
| Dream masthead (15 P3), AppSplash, milestone data | Chapter voice mount points |
| `discover_heroes` admin machinery + discover feed taste-overlap ranking | Salon covers + the Chosen-for rail (BOTH already exist server-side — surfacing work only) |
| Frost discover gestures + the 13 FROZEN choreography header | The additive-gesture boundary |
| muse.js + muse_saves + the 14 contribution columns | Boards extension base |
| 16 proposals tray + signal consent flow | Envelope theatre + onboarding consent mounts |
| 14's 0087 RPC (tier caps) + couple tier fields/checks across code (`grep -rn "gold\|platinum" couple paths`) | The Full Table amendment + the gating retirement sweep |
| 09 Razorpay one-time path | The unlock purchase |
| occupancy engine (04) | Availability whispers |

## 1. LOCKED FOUNDER DECISIONS
| # | Ruling |
|---|---|
| E-1 | **Marriage Day Mode** (never "Shaadi Mode") — and the STANDING LAW, appended to MASTERPLAN + BUILD_PROTOCOL: **TDW product language never uses generic Hindi words.** One register, everywhere |
| E-2 | The time-aware app: chapters (Just Engaged >180d · Building 180–60 · The Rush 60–14 · The Week · Marriage Day · After) + once-only shareable milestone cards (100/50/10/1) + the graceful After |
| E-3 | Signature gesture: double-tap → Muse (heart-bloom + soft haptic) + long-press quick-look; the sound identity (chime on muse-save, paper whisper on bloom open, **silence everywhere else**) + haptics on double-tap, poll votes, proposal reveals — all toggleable |
| E-4 | Compare tray (pin 2–3 per category → side-by-side sheet) with the **ask-the-circle** shortcut spawning a 14 poll from the compared cards |
| E-5 | Muse boards (auto-collections + manual) + **share-a-board** read-only link to vendors + muse→signal ("find artists who match this board") |
| E-6 | Proposals arrive as **sealed envelopes** — tap breaks the seal, one haptic tick, 300ms unfold |
| E-7 | Onboarding restructured as the first gift: name+date → taste quiz as full-bleed this-or-this → signal consent framed beautifully → her masthead number revealed |
| E-8 | **Category salons** — Discover staged as editorial wings (hero cover, curated-first rail, then the feed). Free, always; pure presentation |
| E-9 | **Pricing doctrine:** the bride is FREE — every feature, forever. ONE gate: **The Full Table**, ₹999 one-time, unlimited circle seats (3 free). Amends 14 C-2 (the 5-seat rung dies; RPC cap = full_table ? unlimited : 3). Old couple Gold/Platinum feature-gating RETIRED product-wide. WhatsApp DreamAi token packs unchanged (usage metering, not gating) |

## 2. PROPOSED — AWAITING FOUNDER RULING
(none — TDW_18 The Trousseau + The Stylist by callmeZ is discussed, ruled, and awaits its own explicit write-go)

## 3. MIGRATION RESERVATIONS (ladder after 0091 = next 0092; LD-8)
| # | File | Adds |
|---|---|---|
| 0092 | `0092_muse_boards.sql` | `muse_boards (id uuid pk, couple_id uuid fk on delete cascade, name text not null, cover_save_id uuid null, share_token uuid null unique, created_at)` · `muse_saves.board_id uuid null` (soft; auto-collections are computed views by tag, never rows) |
| 0093 | `0093_full_table.sql` | `couples.full_table boolean not null default false` · `couples.milestones_shown jsonb not null default '[]'` (once-only cards) · 0087's `invite_circle_member` RPC RE-REPLACED: cap = `full_table ? NULL : 3` (the tier ladder logic removed; dated note referencing E-9) |

---

## PHASE TABLE (one phase per sitting)

### P1 — The chapter engine (E-2)
`src/lib/chapter.js` — ONE pure function `chapter(days_until, wedding_date)` → `{key, voice}`; consumed by: the Dream masthead line (per-chapter copy table authored in this spec's appendix, house register, E-1 law), DreamAi's greeting warmth (one woven line per the 06 soul law — she feels the season, never announces it), nudge cadence (brideNudge reads chapter: gentle-weekly in Just Engaged → daily in The Rush → silent on Marriage Day), and splash scrim copy. **Milestone cards:** at 100/50/10/1 days, a once-only full-bleed card (Cormorant number, her names, the date; designed to be screenshotted — export-quality rendering, a save-image affordance) — `milestones_shown` guards once-only across devices.

### P2 — Marriage Day Mode + the After (E-2)
**Marriage Day:** `days_until === 0` transforms the app: a single-screen mode — their names, one line, the day's functions as a live timeline (events for the date), every nudge and inbox chime silenced (notify() respects the day), a quiet "we're here after" footer. No features removed — the canvas waits behind a "her day" veil, dismissible.
**The After:** from day +1, the masthead turns to the gallery (moments-first), thank-you prompts per booked vendor (a pre-drafted warm note she can send via the thread's WA handoff — no review system invented), and **the Story**: her moments + pages compiled into a read-only shareable page (the share-token pattern; assembled server-side from existing reads). The app closes gracefully instead of going stale — and holds the doorway TDW_18's Stylist will stand in (mount point named, nothing built).

### P3 — Discover theatre (E-8, E-3, chosen + whispers)
1. **Salons:** category entry becomes a wing — full-bleed hero (discover_heroes machinery; admin curates per category), an editorial curated-first rail (admin-pinned, marked honestly if Featured), then the feed. Wing transitions on the canon motion language.
2. **Chosen for {name}:** the personal rail surfacing the EXISTING taste-overlap ranking as a personal-shopper moment ("chosen for Aanya") — presentation of server truth, zero new ranking code.
3. **Availability whispers:** "Available on your date" on cards/detail from the occupancy read — truth only; absence of the whisper says nothing (never "unavailable" — we don't shame his calendar).
4. **Gestures (additive — the FROZEN law untouched):** double-tap anywhere on a card → Muse save with the heart-bloom (a 500ms token-colored bloom + soft haptic); long-press → quick-look peek gallery (sheet, swipe-through, release to close). Both coexist with existing stack gestures — conflict-tested explicitly.
5. **The sound identity:** `lib/experience/sound.ts` — two bundled assets only (muse chime ≤40KB, bloom paper-whisper ≤40KB), Web Audio, honoring device silent switch where detectable + a Settings toggle (sound, haptics separately); **silence everywhere else is the law** — a third sound anywhere is a failed session. Haptics via the Vibration API where available (native twins in 12).

### P4 — The compare tray (E-4)
Pin (from card overflow or quick-look) up to 3 vendors of one category → a floating tray chip → the compare sheet: covers, name, starting rate (respecting rate_display), availability whisper, spotlight-order-neutral layout (we compare, we don't rank for her). **Ask the circle:** one tap spawns a 14 poll pre-filled with the compared cards as image options into her threads — the family votes on real candidates. Tray is per-session, in-memory (no storage APIs).

### P5 — Boards + the shared vision (E-5)
1. Apply 0092. Muse gains **boards**: auto-collections (computed by category/tag — "Decor", "Attire", live counts) + manual boards (create, name, drag saves in, cover pick). The 14 circle-status semantics untouched (approved contributions land boards like her own saves).
2. **Share a board:** generate share_token → a read-only, auth-free page (the crew-page pattern: capability URL, no bride identity beyond her first name + board name, revocable by regenerating) — sent to a vendor via the thread's WA handoff ("show him the vision"). Board edits reflect live; revoke kills the link.
3. **Muse → signal:** on a board (or thick auto-collection), "find artists who match this" → opens signal consent for that category pre-framed with the board's dominant tags feeding the 16 matcher. The moodboard becomes demand.

### P6 — Envelopes, the first gift, the one unlock (E-6, E-7, E-9)
1. **The sealed envelope:** 16's proposal cards render sealed — vendor category + city on the seal, nothing else; tap = the haptic tick + 300ms unfold to the intro card. Sovereignty made theatrical.
2. **Onboarding restructured:** names + date (the only form-like beat) → the taste quiz AS the experience (full-bleed pairs, this-or-this, ≤8 beats) → signal consent framed in the house voice ("shall we let the right artists find you?" — per-category, honest) → the reveal: her masthead and the number, for the first time. Existing onboarding data writes preserved exactly (quiz/done, functions, consent → 16 signals).
3. **The Full Table:** apply 0093 (RPC re-replacement per E-9); the circle bloom's 4th-seat moment becomes the unlock card ("The Full Table — every chair, ₹999, once") → Razorpay one-time via the 09 path → webhook flips `full_table` → seats open. **The retirement sweep:** every couple-side Gold/Platinum gate found by the read-first grep is REMOVED (features become free); the tier fields stay in schema (dormant, documented) — no data destroyed, no gate left behind (grep-gate acceptance). Token packs untouched.
4. Full sweep: both themes, chapter fixtures (a test couple time-traveled through six chapters), recordings archived.

---

## 4. GUARDRAILS
E-1's language law binds every string authored in this block (review pass against it) · the 13 FROZEN choreography header untouched — new gestures are additive and conflict-tested · once-only means once-only (milestones_shown is truth) · sounds: two assets, toggleable, silence elsewhere is law · share links are capability URLs — revocable, minimal identity, payload-audited · the compare sheet never ranks (layout-neutral) · no review system invented · `record_payment`/RPC discipline per prior blocks · Full Table is the ONLY bride gate after the sweep (grep proof) · no storage APIs (tray in-memory, sound prefs server-side) · tokens, both themes, everywhere.

## 5. ACCEPTANCE CRITERIA
1. Chapter fixtures: the masthead line, DreamAi's warmth, and nudge cadence all shift correctly across six time-traveled states; Marriage Day silences everything and shows the veil; day +1 turns the masthead to the gallery.
2. Milestone card at 50 days renders export-quality, saves to photos, and never re-shows (cross-device via milestones_shown).
3. Salons: hero wing per category from admin curation; Chosen-for rail matches the taste-overlap order (hand-checked); whispers appear only for date-free vendors.
4. Double-tap saves to Muse with bloom + haptic without disturbing any existing stack gesture (regression recording); long-press quick-look works; sound toggle silences both assets; no third sound exists (asset audit).
5. Compare: 3 pinned → sheet → ask-the-circle spawns the poll with the three covers as options; both phones vote.
6. Board share link renders read-only on a logged-out device, reflects a live edit, dies on revoke; muse→signal opens consent pre-tagged and the 16 matcher receives the tags.
7. The envelope unfolds with the tick; nothing about the vendor leaks on the seal (payload audit).
8. Onboarding: a fresh bride reaches her number in ≤8 quiz beats with all writes landing (quiz, functions, signals); the register audit passes E-1.
9. Full Table: 4th invite blocked with the unlock card → sandbox purchase → webhook → seat 4 and 8 both admit; the Gold/Platinum grep-gate returns zero live gates; token packs verified untouched.
10. `node --check` + tsc clean; 0092/0093 proven; MASTERPLAN gains E-1…E-9 + the standing language law; UNIT_ECONOMICS gains the Full Table line.

## 6. FOUNDER SMOKE (phone, two where noted)
Time-travel a test bride to day 51 → wake to the milestone card, save it → enter the Photographers salon, meet your hero cover, double-tap a card and feel the bloom → long-press to peek → pin three, compare, ask the circle and vote from the second phone → share an Attire board to your test vendor's WA, open it logged-out, revoke it → break a sealed envelope's seal → hit the 4th chair, buy The Full Table on sandbox, seat the whole family → set the date to today and watch her day go quiet.

## 7. NATIVE-IMPLICATIONS CLAUSE
Chapters, salons, boards, envelopes, compare are contracts + presentation — TDW_12 renders them with Reanimated/Haptics twins (the sound identity maps to expo-av; haptics to expo-haptics). Share/board pages stay constitutionally web (capability URLs). The Full Table follows the 11 dual-rail law when bride-native ships.

## Appendix A — chapter voice table (house register, E-1-audited)
just_engaged: "All the time in the world." · building: "It's taking shape." · rush: "Here's what matters today." · week: "Almost. Breathe." · marriage_day: "Today." · after: "It was beautiful."

## 8. SESSION BOUNDARIES
Six sittings P1→P6 (P1 first — everything reads chapter(); P5 before P4's poll-from-board variant if sequenced tight). Handover per protocol; the After's Stylist mount point + the 18 sketch remain reserved awaiting the founder's explicit write-go; MASTERPLAN updated.


---

## ADDENDUM (2026-07-14): Onboarding's first screen gains the social doors (Google + Apple, no Meta) per the TDW_11/12 social addenda — social → the mandatory phone-verify beat → then the gift begins (names prefilled from the verified identity where available). The E-1 register audit covers the doors' copy.
