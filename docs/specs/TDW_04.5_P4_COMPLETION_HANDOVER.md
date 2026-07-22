# TDW_04.5 · P4 — COMPLETION HANDOVER (the wiring, the roster door, the pwa half)

**Base:** `b21f1fa` (dream-os) · `3d38d33` (dreamos-pwa) · **Role:** executor (CE-59)
**Migration:** `0096_collab_planner.sql` **STILL WITHHELD.** It does not ship here. My SQL authoring scope was ZERO and stayed ZERO.

---

## §1 — WHAT SHIPPED

### dream-os — 3 new, 5 modified

| File | What |
|---|---|
| `src/lib/phone.js` | **NEW.** F-04.109's one home for `toE164`. |
| `src/api/vendor/roster.js` | **NEW.** The roster plane: list · manual add · the bridge-mint door. |
| `scripts/b0453_collab_wiring_bench.js` | **NEW.** 46 asserts over the REAL routers. |
| `src/api/vendor/collab.js` | Rewired whole: feed · my-posts · create · respond · connect. |
| `src/lib/vendor/roster.js` | The third `toE164` copy DIES; imports the one home. |
| `src/api/circle/join.js` | Importer 2 of 3. |
| `src/api/circle/verifyPin.js` | Importer 3 of 3. |
| `src/api/vendor/core.js` | One mount line. |

### dreamos-pwa — 3 new, 5 modified

| File | What |
|---|---|
| `lib/vendor/studioShared.tsx` | **NEW.** F11(c)'s one home: `Row` · `SectionLabel` · `STUDIO_ITEMS` · `isPrestige`. |
| `lib/vendor/api/roster.ts` | **NEW.** Roster client + Appendix A's map, mirroring `collabItems.js`. |
| `app/vendor/team-hub/page.tsx` | **NEW.** The second entry point — Team Hub section ONLY. |
| `app/vendor/collab/page.tsx` | Roster tab + add sheet · multi-item composer · first-look states · auto-close line · F10(b) prefill intake. |
| `components/vendor/CalendarCrewSheet.tsx` | F10(b): the foot's `Post to Collab` row + both in-sheet refusals. |
| `app/vendor/calendar/page.tsx` | `crewDate` handed down from both entry points. |
| `app/vendor/studio/page.tsx` | Imports the one home; rendered output unchanged. |
| `app/vendor/more/page.tsx` | Veto cure + the new destination. |

---

## §2 — THE RULINGS, AS BUILT

- **(ii)A / the wrap is the gate.** Every 0096-dependent read runs through `tolerate`, which turns "relation does not exist" into an ABSENCE. `itemsForPost` turns absence into the post's own `requirement_type`. Pre-0096 behaviour is byte-equivalent to today. **No feature flag exists and none is owed.**
- **(ii)B / first look rides its own query.** The feed's primary `select()` is **byte-identical to `b21f1fa`** — I did not add `first_look_until` to it, because PostgREST fails the WHOLE query on an unknown column and that would have 500'd the Collab tab for every vendor between deploy and the founder's 0096 run. `first_look_until` and `vendor_id` ride a second tolerated query in `firstLookFilter`.
- **1(a) / the category leg.** `.eq('requirement_type', me.category)` is GONE from the feed query; `postMatchesCategory` runs in JS over the bounded open-post window. With zero item rows it reads the post column — byte-identical to the `.eq` it replaces, which is also what closes the leak: a missing items table degrades to the OLD predicate, never to NO predicate. Proven in bench §1.
- **Fork 2 / the bridge door.** Lives on the ROSTER plane. It mints the identity and returns the `team_members` id; the client then assigns through the EXISTING events PATCH. **`public.events` gained no second writer — the bench asserts the bridge door writes nothing to events at all.**
- **Fork 5 / direction.** `owner_vendor_id = poster AND member_vendor_id = viewer`. The bench proves the INVERSE edge does not open the gate.
- **Auto-close** flips to the EXISTING terminal `'filled'`. No CHECK widening, no `'accepted'` post state (spec drift, re-confirmed by command).
- **F8** holds: nothing in the roster plane deletes; the bridge row and its `page_token` survive an unassign.
- **F-04.106 discipline** carried forward: every select in the new door is an explicit column list. No `select('*')`.
- **W-1**: zero soul/prompt/voice changes. The two `connect` WhatsApp bodies are byte-unchanged; only the founder-vetoed `respond` line moved.

---

## §3 — PROOF

**`b0453_collab_wiring_bench` — 46/46 GREEN.** Real routers, real express app, real http listener. The only doubles are the supabase client and the auth middlewares, both transport-only.

**Non-vacuous by PRODUCTION mutation** (real edits to `collab.js` / `src/lib/vendor/roster.js`, each reverted):

| Mutation | Result |
|---|---|
| restore the post-column `.eq` in the feed query | **43/3 RED** |
| `firstLookFilter` always permits | **44/2 RED** |
| drop `items` from the feed serializer | **43/3 RED** |
| connect skips `addEdgesOnAccept` | **44/2 RED** |
| `ensureBridgeMember` always INSERTs | **43/3 RED** |
| auto-close without the `allItemsFilled` guard | **45/1 RED** |
| remove the multi-item rollback refusal | **45/1 RED** |
| revert | **46/46 restored** |

**THE FLOOR — my own run, byte-stable, with the b0498 mapping disclosed:**

```
b0452 52/52 · b0453 46/46 (new) · b0451 111/111 · b0450 46/46
b0498_fresh_crew_rider 66/66 + b0498_wa_assign_punct 17/17   ← the charter's "66+17"
b05_m2 4/4 · b0457_assign 30/30 · b0457_crew 21/21 · b0457_gap 10/10
b0457_crud_crew 19/19 · b0496 11/11 · b0497 ALL GREEN
b5_wa_door 32/32 · b6_referent 36/36 · checker 101/101 (exit 0)
b6_sitting2 20/22 — EXACTLY, per F-04.91
```

`b0452` re-run after every edit: **byte-stable at 52.** The floor stayed a floor.

**Engine build green** (`npm run build:engine`, `tsc -p src/engine/tsconfig.json`). **`node --check` clean** on all eight touched dream-os files. **pwa `tsc --noEmit`: 0 errors.** **`bands.proof` 11/11 · `crewCommit.proof` 11/11.**

---

## §4 — EXECUTOR DISCLOSURES (each vetoable on its own)

1. **`respond`'s `item_id` is a TOLERATED write — a declared gap, not an assumption.** Spec §P4.1 says respond gains `item_id`; WHICH column carries it lives in the withheld 0096, which I have not read. Under the SQL-provenance law a column with no witness is an assumption, so both the write and the read-back are tolerated. If 0096 names it, the responder's choice persists and connect prefers it. If it does not, this is a no-op and the poster names the item at connect time — which is the path auto-close actually depends on. **The feature stands either way; only the convenience varies.** Please confirm against 0096 before the smoke.
2. **Multi-item create REFUSES pre-0096 rather than silently dropping items 2..n.** A post whose item rows cannot land would otherwise wrap back to ONE requirement and quietly discard the rest. The post is rolled back and the caller gets a 503. **This is a string I did not have vetoed** — `'Multi-item posts are not available yet. Post one requirement at a time.'` It is an API error message, not chrome, and it can only be seen in the window between this deploy and 0096. Flagged per the return-for-veto ruling; **ratify-or-replace.**
3. **`/vendor/studio`'s FILE changed; its RENDERED OUTPUT did not.** The charter said byte-unchanged. I read that as the screen, not the file, because "one shared module" and "the file never changes" cannot both hold. The local `Row`, `SectionLabel`, `Chevron` and `STUDIO_ITEMS` were deleted and imported instead; the JSX is untouched. **If the chair meant the file literally, this is a two-line revert to a duplicated module and I'll take the bounce.**
4. **F10(b) needed a prop the DayEvent contract does not carry.** `DayEvent` has no date. Rather than have the sheet guess, `eventDate` is passed down — `fn.date` from the band pip, `daySel` from the day sheet. Absent date ⇒ the past-date refusal fires, which is the honest failure.
5. **The sheet reads `/me` for the city.** No session field carries it. One fetch on open, alongside the existing `fetchTeam`. A null city fires `'Add a city to your profile before posting.'` in-sheet, as ruled.
6. **The two-chip ASK prefills NOTHING.** `fitting`/`trial` map to `['makeup','attire']`; `requirementForKind` returns null for arrays so the composer opens with both chips available. Guessing "makeup" for a fitting that was about attire is exactly the guess Appendix A refuses.

---

## §5 — WHAT I DID NOT DO

- **0096 has not run and I did not author it.** My code is dormant-safe, not gated; it deploys clean and comes alive when the founder runs the migration.
- **No live witness is claimed.** No roster row, no bridge row, no multi-item post exists anywhere. The live witness is the FOUNDER's, declared-not-claimed.
- **P5's settlement stub is not here** — it is P5's, not this charter's.
- **The whisper sitting and Block 05's auto-send-on-insert stayed SCOPE WALLS.** Named, never built.
- **Nothing was pushed.** LE never pushes.

**Sequencing beyond this sitting is the founder's.**
