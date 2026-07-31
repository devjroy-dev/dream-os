# TDW_07 P4b BODY — EXECUTOR HANDOVER

**Seat:** Opus-LE, fresh clone, §11 whole · **Sitting:** 2026-07-30/31
**Base:** `dream-os e195cf6` · `dreamos-pwa abeba7f` — both re-derived fetch-first at origin at sitting open. Charter tips matched exactly; no drift, no predecessor dirt.
**Charter:** the fifteenth chair's P4b BODY kickoff + the CE rulings on the three §0.2 reports.

---

## 1 · WHAT SHIPPED

### dream-os

| File | Movement |
|---|---|
| `src/lib/discover/shapeVendor.js` | **NEW** — F1b's one shaper · `DISPLAY_PHOTO_LIMIT` · `normalizeIgHandle` (moved) · `ENQUIRE_BASE` |
| `src/lib/vendor/rateMet.js` | **NEW** — F4's one rate predicate, sited as a leaf |
| `src/api/couple/discover.js` | the real leg routed through the shaper; the five-photo cap moved out of the loop; demo leg on the shared constant |
| `src/lib/vendor/discover.js` | `getDiscoverPreview` + min-only gate + `rate_max` dropped from the write |
| `src/api/vendor/discover.js` | `GET /preview` — auth + ownership, **no eligibility guard** |
| `src/lib/vendor/profileScore.js` | `:154` and `:183` both consume the one predicate |
| `src/api/vendor/me.js` | the guard + its dead bindings retired · `rate_max` dormant in ALLOWED_FIELDS · F-07.17 |
| `src/lib/vendor/igImport.js` | α — the stale U-1 host corrected, F-07.23 cited |
| `docs/specs/TDW_07_P4A_HANDOVER.md` | **NEW** — verbatim, ruled provenance header |
| `scripts/b07_p4b_body_bench.js` | **NEW**, 66 cells |
| `scripts/b07_p1_bench.js` · `b07_p3_bench.js` | labeled amendments (§3 below) |

### dreamos-pwa

| File | Movement |
|---|---|
| `components/shared/VendorProfileView.tsx` | **NEW** — the one renderer; `IgChip` + `FeaturedEyebrow` moved into it |
| `app/vendor/discover/preview/page.tsx` | **NEW** — route-based full-screen preview |
| `app/(frost)/frost/canvas/discover/page.tsx` | content replaced by the shared mount; **chrome + gestures byte-identical** |
| `app/(frost)/frost/canvas/sanctuary/page.tsx` | the register, cured at the donor (3 formatters) |
| `app/(frost)/frost/canvas/muse/page.tsx` · `app/demodiscover/page.tsx` | the register |
| `app/(landing)/discover/VendorCard.tsx` | **F-07.27** dormant-by-comment, bytes unchanged |
| `app/vendor/discover/profile/page.tsx` | copy ① · Max field removed · score mirror realigned |
| `app/vendor/discover/submit/page.tsx` | the Max field, its state, its send and its gate all retired |
| `app/vendor/portfolio/page.tsx` | copy ① |
| `components/vendor/CommandBar.tsx` | **F-07.15** — `scoreDiscover` dead, plus its two quieter consumers |
| `lib/vendor/api/vendor.ts` · `lib/vendor/types/vendor.ts` | the preview client + type; `rate_max` out of the request contract |
| `scripts/tdw07_p4b_body.proof.mjs` | **NEW**, 76 cells |
| `scripts/tdw07_p1_discover.proof.mjs` · `tdw07_p2_profile.proof.mjs` | labeled amendments |

**Weight `TERM_WEIGHTS.rate` = 0.135, untouched. ZERO DDL. W-1: zero soul bytes, benched.**

---

## 2 · THE LOAD-BEARING PROPERTY, AND HOW IT IS PROVEN

Parity is not asserted, and it is not maintained by discipline. It is **structural**:

- **One backend function.** `b07_p4b_body §3.1` asserts the feed's shaper and the preview's shaper are the **same function object** — identity, not resemblance. There is no second implementation that could drift.
- **One frontend component.** `tdw07_p4b_body §2.5` walks every `.tsx` on the couple plane and asserts exactly one renders the profile's `<Lock size=` fingerprint.
- **The chrome did not move.** Diffed anchored on the function: **2402 bytes at origin, 2402 bytes at this tree, byte-identical.** Ten gesture tokens, counts identical both trees.

A screenshot diff can still disagree about pixels. It cannot disagree about which component ran.

---

## 3 · LABELED AMENDMENTS — five cells, every title re-authored, none relaxed

| Bench | Cell | Why |
|---|---|---|
| `b07_p1` §2.6 | "a HALF-SET rate scores 0" → **"a MIN-ONLY rate earns the term in full"** | asserted the retired law. Inverted, not weakened; **+3 new cells** pin the weight, the ignored `rate_max`, and the empty-string trap |
| `b07_p3` §10.5 | re-aimed at the rule's new home | **strengthened from a grep to an execution** — it now runs the shaper on 20 photos instead of reading a literal |
| `tdw07_p1` §4.5–§4.13 | re-aimed at `VendorProfileView` | the components moved house; not one property relaxed |
| `tdw07_p2` §3.2 | `rate_max` leaves the moved-fields list | a **retired** field is not a field that failed to arrive. §3.2b pins the retirement both ways |
| `tdw07_p2` §5.4 / §7.4 | the half-set-rate cell inverted | the "which half is missing" question has no referent once the bound is retired |

Counts moved **up** in every case: p1 72→75, p3 50→52, tdw07_p1 35→35, tdw07_p2 41→42.

---

## 4 · PROOF

### Both-ways, non-vacuous — 15 mutations of **production code**, every tree restored byte-identical

**dream-os `b07_p4b_body` (66/66 green):** empty-string guard removed → 64 · cap 5→20 → 63 · gate loses the predicate → 65 · `rate_max` re-armed → 65 · stale IG host restored → 64 · `rate_display` parity broken → 65 · preview loses the shared shaper → 64.

**dreamos-pwa `tdw07_p4b_body` (76/76 green):** renderer renamed at each mount → 75 · preview mode flipped → 75 · pause copy altered → 75 · donor swapped for a short form → 74 · Max field restored → 75 · `scoreDiscover` resurrected → 74 · gesture unwired → 75 · one F-07.27 marker blanked → 75.

**Three mutations initially survived. All three were my cells being vacuous, and all three are cured** (see §5).

### Floors at delivery, verified **from clean clones after applying the ZIPs**

**dream-os — 84 exit-0.** `b07_p4b_body` 66/66 · p1 71/71 *(unpaired; 75/75 with the pwa tree beside it — the bench declares the 4-cell skip itself)* · p2 48/48 · p3 52/52 · p4a 107/107 · slice1 19/19 · probe 22/22.

**Known-reds exactly two, named:** `b06_meter_bench` **28/29** (F-06.41) · `b05_f0555_media_dedupe_bench` **22/23** (F-07.11).

**Credential-gated, declining by design (not reds):** `b06_gauntlet` · `b5_wa_door_smoke` · `test-shape` — all three STOP on absent `ANTHROPIC_API_KEY` / service-role keys.

> **The meter's 28/29 is the BUILT-ENGINE number.** My first floor read 5/6 because I ran benches before `npm run build`; `src/engine/dist` is built, not committed. The chair's instruction closed my declination and the number reproduces exactly.

**dreamos-pwa — all seven harnesses green:** p1 35/35 · p2 42/42 · p3 110/110 · p4a 63/63 · slice1 24/24 · probe 27/27 · **body 76/76**. **`tsc --noEmit` whole-tree on a cleared `.next`: ZERO.**

### Gates
`node --check` clean on every touched `.js`. Both ZIPs applied onto **pristine clones**; both `# repo:` guards proven in **both directions** (the backend guard correctly refuses the pwa tree).

---

## 5 · WHAT I GOT WRONG — eight; seven self-caught, one caught by the founder's paste

1. **`rateMet` earned the term on an empty string.** `Number('') === 0`, which is finite, so `''` scored full credit while the comment three lines above forbade it. Found by *exercising* the predicate across its shapes, not by reading it.

2. **I closed a require cycle that would have 500'd every Discover request.** `profileScore.js:69` already requires `lib/vendor/discover.js`; importing back left one direction holding a stale exports object. Node's own warning surfaced it — the pristine tree does not warn, so it was mine.

3. **My first cure for that cycle was not a cure.** Binding the module object instead of destructuring still threw `profileScore.rateMet is not a function` under the reversed load order, because `module.exports = {...}` **replaces** the object rather than mutating it. I reasoned it would work; running both orders proved it did not. The leaf module is the structural fix.

4. **A line-range splice broke the canvas JSX.** Restored and redone against verified boundaries. **The chair's `:416–:480` cite was exactly right** — my read-first note claiming it closed at `:481` was the error, and it is corrected here on the record.

5. **`b07_p4b_body §3.4` was vacuous on its first run.** It grepped raw text for `DISPLAY_PHOTO_LIMIT`'s absence and failed — because the preview's own *comment* explains that the shaper applies it. True about the wrong thing. Cured by adding `codeOf()` with its documented order rule (line comments first).

6. **Two pwa cells passed under mutation.** `§2.1/§2.2` matched `<VendorProfileView` as a **prefix**, so renaming the element to `<VendorProfileViewX` passed green — the cell asserted a substring, not a mount. `§5.9` tested presence of `F-07.27` where the file has **two** mentions, so blanking one passed. Both cured (element-boundary match; count pinned), both now redden.

7. **I authored a SQL column that does not exist, and the founder's paste is what found it.** The walk card's Step 0 read `v.phone`. **`public.vendors` has 38 columns and none of them is `phone`** — a vendor's phone lives on `public.users`, reached through `vendors.user_id`. The founder ran the block and got `ERROR 42703: column v.phone does not exist`.

   **The process failure is more precise than "I guessed", and worth naming exactly.** I did run a command. I ran `sed -n '980,1030p' PUBLIC_SCHEMA.md | grep -i phone` and it printed `4. phone text NOT NULL`, so I recorded the identifier as derived. But I had guessed the line *range*, and the range straddled a section boundary: line 980 is inside `public.vendors`, and the `phone` hit came from a **different table further down the window**. `public.vendors`' actual column 4 is `category`. The command answered a question I had not asked. This is the same family as the vacuous cells in items 5 and 6 — **true, and true about the wrong thing** — and the SQL-provenance law's "the derivation is SHOWN, never claimed" does not protect against it, because I did show a derivation. It just was not a derivation of the thing I said.

   **The cure is mechanical, not attentional.** Every column in the corrected block is now verified by a script that parses the SQL, extracts each `alias.column`, resolves the alias to its table, and checks it against the witnessed snapshot section — bounded by the `## public.<table>` header rather than by a guessed line range — falling through to the migration files for the four post-snapshot columns. It reports the witness per column. Run against the original block, it flags `v.phone` as MISSING. That check is recorded here rather than left as a habit.

   **The shipped code is unaffected** — derived, not assumed: `phone` appears twice in the delta's files (`me.js:129`'s LOCKED_FIELDS, a comment in `igImport.js:317`) and `git diff` confirms neither line is in this sitting's diff. **The defect was confined to a document.**

8. **I missed three money sites, and my own register cell caught them.** Sanctuary carried a **third** local formatter at `:3792` plus two `L onwards` renders my enumeration had not reached. This is the argument for a repo-wide cell over a site list.

---

## 6 · FINDINGS AND OPEN ITEMS

### F-07.29 — MINTED, filed not fixed
`app/demodiscover/page.tsx` carries its **own `GlassOverlay`** — a complete second implementation of the couple-facing profile (Enquire, Lock Date, Circle, starting price) on the demo subdomain. The spec's §3 guardrail says a second implementation anywhere is a failed session.

**It predates P4b** and the charter scoped demodiscover as a **money site only** (`:211`), which is the only part I touched. I did **not** fold it in, deliberately: its Lock Date is *tappable* and toasts "coming soon" where the real one is disabled, and its Circle toasts "Sign in to add to your Circle" — folding it in means growing the shared component a demo mode, which is a design decision nobody ruled. Doing that silently, at the end of a long sitting, on a surface outside the charter, is how scope becomes damage.

The bench exemption **carries the finding number** and asserts the duplicate has not spread. Converting it must *delete* that entry, not edit it.

### F-07.28 — MINTED, copy veto owed
Sanctuary carries **seven `Amount (₹)`-class input labels**, and `BUDGET_OPTIONS` carries `Rs 1L – 3L` filter bands. These annotate a unit or name a bracket; they do not render a vendor's figure. Curing them is **couple-facing copy** and copy needs your veto, so they are filed rather than fixed. The glyph cell pins the count at 7 so they cannot grow.

### Scope I widened — reported, not buried
The ledger named the **submit form** as losing the field. The **Discover Profile** page also carried Max, saved it, and fed its score mirror. Left alone, that input would accept typing, show a dirty Save, report success, and be **silently discarded** by the now-dormant allowlist — F-07.13's dead-control class *with a write path attached*, the most expensive shape of the defect because the vendor believes he answered. I removed it and realigned the mirror.

### F-07.15's richer branch is not reachable
`GET /api/v2/vendor/discover/status` carries **no score and no hints** — derived by reading `DiscoverStatus` at the P4b tips. Publishing them is a backend movement nobody chartered, so the bar takes the ruling's **"or links only"** arm. The Discover Profile's client-side score mirror remains a surviving second authority; worth a finding at your word.

### Copy veto owed — one string
The gate's error cannot stay honest unchanged:
- **was** `rate_min and rate_max are required.`
- **now** `rate_min is required.`

### Inherited, untouched
F-07.22 (iOS connect, undiagnosed, blocks real vendors) · the P4a review clock and the `hello@thedreamwedding.in` watch · `PUBLIC_SCHEMA.md` stale by four migrations — **confirmed live this sitting**: `rate_display`, `discover_paused` (0101) and `position` (0102) are absent from it, so the walk SQL below was authored from the **migrations**, never from the doc.

---

## 7 · THE WALK CARD

Fixture-derived. **Step 0's SELECT runs FIRST and the card is read against its rows** — F-07.6's fixture-state law. Every identifier below was derived by command from `db/migrations/0101_profile_controls.sql`, `0102_vendor_portfolio_position.sql`, and `docs/db/PUBLIC_SCHEMA.md`; none is authored from memory.

**Only your device can settle steps 4, 5 and 8** — pixel parity and the back gesture are affordance truths, and no cell in either harness can witness them.

---

**STEP 0 — run this first, paste the rows back. The card is read against them.**

```sql
-- TDW_07 P4b BODY · fixture state. READ-ONLY: no INSERT, UPDATE or DELETE.
--
-- CORRECTED 2026-07-31 after the founder's paste returned
--   ERROR 42703: column v.phone does not exist
-- The first version of this block read `v.phone`. THERE IS NO phone COLUMN ON
-- public.vendors. Correction owned in §5(8); the identifier is derived below.
--
-- PROVENANCE (SQL-provenance law — the witness, not the claim):
--   users.phone            ← docs/db/PUBLIC_SCHEMA.md "public.users · 9 columns", col 2.
--                            vendors is 38 columns and NONE of them is phone; the vendor's
--                            phone is reached through users, joined on vendors.user_id.
--   vendors.user_id        ← same doc, public.vendors col 2
--   vendors.rate_min/max   ← same doc, cols 27/28
--   vendors.discover_eligible ← same doc, col 30
--   vendors.rate_display   ← db/migrations/0101_profile_controls.sql:65
--   vendors.discover_paused← db/migrations/0101_profile_controls.sql:75
--                            (both post-date the PUBLIC_SCHEMA snapshot, so they are
--                            witnessed at the migration AND by the live feed query at
--                            src/api/couple/discover.js:67, which selects them in production)
--   vendor_portfolio.vendor_id / is_hero / approval_state
--                          ← docs/db/PUBLIC_SCHEMA.md "public.vendor_portfolio · 13 columns",
--                            cols 2 / 5 / 8
--
-- THE MATCH IS DIGITS-ONLY AND RIGHT-ANCHORED. The fixture ledger carries one number
-- as +918595356978 and the other as 9888294440 — two formats for the same kind of thing.
-- Matching the last ten digits of the stripped string finds both regardless of how the
-- country code or spacing was stored, instead of guessing a storage convention.
select
  u.phone,
  v.business_name,
  v.rate_min,
  v.rate_max,
  v.rate_display,
  v.discover_paused,
  v.discover_eligible,
  count(p.id) filter (where p.approval_state = 'approved') as approved_photos,
  count(p.id) filter (where p.approval_state = 'pending')  as pending_photos,
  count(p.id) filter (where p.is_hero)                     as hero_rows
from public.vendors v
join public.users u on u.id = v.user_id
left join public.vendor_portfolio p on p.vendor_id = v.id
where right(regexp_replace(u.phone, '[^0-9]', '', 'g'), 10) in ('8595356978', '9888294440')
group by u.phone, v.id, v.business_name, v.rate_min, v.rate_max,
         v.rate_display, v.discover_paused, v.discover_eligible
order by u.phone;
```

```sql
-- The retirement moves no live score.
-- FOUNDER-RUN 2026-07-31: this returned 0. WITNESSED, not predicted — no vendor in the
-- estate holds a min without a max, so F4 changes nobody's ranking on the day it ships.
-- The charter's `min_only=0` claim is now a measurement rather than an inherited number.
select count(*) as min_only_vendors
from public.vendors
where rate_min is not null and rate_max is null;
```

---

**STEP 1 — apply and deploy.** dream-os first (the pwa's preview calls its route). Wait for Railway green, then Vercel.

**STEP 2 — the empty witness.** Log in as **9888294440** (zero portfolio rows, null name/rate). Open **Discover Profile**. Under the meter you should see **See your profile as couples do**. → *the button reaches a vendor who is nowhere near approval — F5's whole argument.*

**STEP 3 — tap it.** The preview opens full-screen with a **PREVIEW** ribbon. Because this account is not approved, you should read: **"This is your profile as couples will see it — approval unlocks it on Discover."** → *the pre-approval reach, live.*

**STEP 4 — ★ YOUR DEVICE ONLY: the back gesture.** Swipe back (or tap ‹). The preview should dismiss and return you to Discover Profile. → *no cell can witness a phone's back gesture.*

**STEP 5 — ★ YOUR DEVICE ONLY: parity.** Log in as **+918595356978** (Swati — 10 photos, 9 approved, hero set, `rate_display=false`). Open the preview, then open her card on the **Frost feed** and compare side by side. Look for: same photo order, same about, same tags, **no price on either** (she has hidden her rate), same Enquire/Lock Date/Circle row. → *the benches prove one component ran; only your eyes prove it looks right.*

**STEP 6 — the suppressed price, both directions.** On Swati's Discover Profile turn **Show starting price on Discover** ON, Save, reopen the preview. The price should now read **`Starting at Rs 1,50,000`** — grouped digits, the word Rs, **no ₹ glyph and no "1.5L"**. Turn it back OFF and confirm it vanishes again. → *F-07.16 and D-1 in one motion.*

**STEP 7 — the pause round-trip.** Pause the profile. Reopen the preview: **"Paused — hidden from Discover right now."** Unpause and confirm the line goes. → *the preview refuses to render a paused vendor as live.*

**STEP 8 — ★ YOUR DEVICE ONLY: the deck still works.** On the Frost feed, drag the vendor overlay down to dismiss it, and swipe the deck. → *the extraction moved content only; this is the affordance witness that the gestures survived it.*

**STEP 9 — the retirement, live.** On Discover Profile, the rate section should show **Min (Rs) only — no Max field**. Set a min, Save, and confirm the meter's rate hint no longer says "Add the top of your rate range". → *F4 end to end.*

**STEP 10 — the second score is gone.** Open the Command Bar. The **Discover Profile** row should read **"open"** with no percentage, and the collapsed strip should carry no "Discover NN%". Tap it — it must still route you to Discover Profile. → *F-07.15: the number died, the control did not.*

**NAMED SKIP:** the twenty-photo edge is not re-walked — P3 named it a skip for tapping cost and this sitting moved the cap's *home*, not its value, proven by `b07_p3 §10.5` running the shaper on 20 photos.

---

## 8 · NEXT SITTING PICKS UP

F-07.29's ruling (fold demodiscover in, or retire it) · F-07.28's copy veto · the register bench's two exemptions if either surface is re-wired · F-07.15's first arm once the server publishes score+hints · the Discover Profile's surviving score mirror · F-07.22 · `PUBLIC_SCHEMA.md`'s refresh before any P4b-successor DDL.
