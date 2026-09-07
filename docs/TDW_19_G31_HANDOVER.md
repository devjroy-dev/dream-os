# TDW_19 · G3.1 — YOUR WEBSITE & SEO · ARC HANDOVER

**Cut** 2026-09-06, ridered 2026-09-07 (F-40.207) · **dream-os** `13bbc96` (arc's last G3.1 commit; tip `8762ffc` carries G3.4 on top) · **dreamos-pwa** `b987267`
**Rulings** R-G31.1–.7, R-40.70, R-40.77, R-40.78, R-40.82, R-40.83, R-G31.2/.3's fork rulings, c-40.31, c-40.37
**Findings minted in this arc** F-40.207, F-40.157, .158, .163, .164, .166, .167, .168, .169, .170, .171, .172, .173, .175, .187, .188
**Walked green on production** by the founder, 2026-09-06.

---

## 1 · WHAT SHIPPED

**The public date check.** A guest on `/v/<code>` types a date and gets one word back. `<form method="GET">`, zero JavaScript on the public lane (R-G12.10), the answer on its own leaf at `/v/<code>/date` so the card's `revalidate = 300` is never spent (R-G31.3).

**Four answers, one home** — `lib/public/copy.ts`'s `PUBLIC_DATE_CHECK`. `Booked` · `Some of the day is held` · `Free` · `Couldn't check just now.` The door returns a shape; the leaf renders the word.

**The vendor's permission.** `public.vendors.date_check_enabled`, OFF by default (R-40.77, migration 0140), written through the existing `PATCH /api/v2/vendor/me` — no new writer. The Storefront room carries the switch, saved on toggle, reverting on refusal.

**Structured data**, the estate's first — `LocalBusiness` from the card's own keys (R-G31.5).

**Her weddings on her own page** — published and consented pages, newest first, `publicWedding`'s existing shape.

**R3 opened** — `Your website & SEO`, the fifth of the nine, onto the Storefront room at `roomHref('storefront')`.

---

## 2 · THE FOUR THINGS A SUCCESSOR SHOULD READ FIRST

**2.1 · `Booked` does not come from `blocked`, and this is the arc's most reversible mistake.**

R-G31.1's first arm is `blocked === true` **OR every slot at capacity**. Driven over the founder's own fixture — a full-day `ceremony` on 2026-12-04 — `describeDate` returns **`blocked: false`** with all three slots at `held 1 / capacity 1`, because `blocked` is true only for rows of `kind='blocked'` and a ceremony is not one. A leaf reading `blocked` alone answers *Some of the day is held* for a day that is entirely sold.

The arithmetic therefore has ONE home: `verdictOf` in `src/api/public/availability.js`, exported so `b58` drives the shipped bytes. **Do not reintroduce a second computation of `sold` anywhere.**

**2.2 · One ladder decides whether capacity applies (R-G31.6).**

`capacityFacts` and `describeDate` used to answer "does capacity apply" from two ladders and **disagreed on seven categories** — hairstylist, performer, content_creator, choreographer, mehendi, invitations, cake all read `capacity_applicable: true` while every date check on them returned `occupancy: 'off'` (F-40.172). Gating the room's switch on `capacity_applicable` would have shown a hairstylist a switch she could flip, after which every guest reading a date got the miss.

`capacityVerdict(vendor)` in `occupancy.js` is now the only ladder; `describeDate`, `capacityFacts` and `capacity_reason` all read it, and `applicable` is *defined* as `reason === null`. **The branch order is load-bearing**: `planning` normalises to `planning` but keys to `other`, so a `RULED_OFF` check placed second misfiles a planner as `unmapped`.

**Consequence taken (F-40.173):** those seven now report `capacity_applicable: false`, so B6-S1's capacity stepper is absent for trades that never had capacity to set.

**The `delivery` branch, corrected twice (F-40.207, c-40.41).** R-G31.6 first collapsed `delivery` into `unmapped` on this seat's assurance that no live category reached it. **That assurance was false.** `designer` and `jewellery` are both `timelineType: 'delivery'` and both live (`categoryProfiles.js:74`, `:86`) — and `designer` is `b5_describe_bench`'s own fixture, so the claim was contradicted by a bench in the same repo. The census had been built by filtering a hand-written list that omitted them; **a census that lists is not a census** (R-40.64).

The collapse also sent the wrong word. `unmapped` reads 「aren't set up … **yet**」 — a not-yet — and a designer is off by a **decision**: *ready by* matters, *which day* does not, and no future keying changes that. `delivery` now reports **`ruled_off`**, which needs no new string because D6a already reads 「Date checks don't apply to your kind of work.」 `b58` §5.5 derives the delivery set from the profile map and §5.7 holds the word, so neither can drift back quietly.

**2.3 · The two repos deploy on separate clocks, and the types cannot know it.**

`Card` declared `weddings: {...}[]` and TypeScript verified every use against that claim — but the claim was about *another service's deploy*. `card()` destructures by name and spreads nothing; two keys were added to `CARD_KEYS` and to the call site and never to the builder, so the door advertised thirteen keys and emitted eleven. `card.weddings.length` on `undefined` throws inside a Server Component render, and **every public storefront 500ed** until `fded352` (F-40.169).

Both halves are now guarded: `b58` §3.1b diffs **emitted against declared** by driving the real builder, and every wire key the public leaf dereferences is defended at the read. **Any type describing a cross-repo wire is a hypothesis; treat optional as the default.**

**2.4 · `null` can be a posture, and `??` cannot see it.**

The room printed *Date checks aren't set up for your kind of work yet* at a photographer while production was sending `capacity_reason: null` — correctly. `null` is the **success** value, and `v.capacity_reason ?? 'unmapped'` coalesces `null` as readily as `undefined` (F-40.175). It is `occupancy.js`'s own warning one repo over: there *`??` not `||`: 0 is a POSTURE*, here *`=== undefined` not `??`: null is a POSTURE*.

Three states, not two: `null` → the switch; a reason → D6's byte; **`undefined` → nothing at all**, because a door that has not answered is not a fact about her trade.

---

## 3 · THE CONSENT SURFACE, AND WHY IT IS SHAPED THIS WAY

`discover_paused` was the only switch touching `/v/`, and it means *don't show me publicly*. A vendor who left it off in August did not thereby agree that in September strangers could ask whether she is free on a named day. Master §2.4: **silence never means yes.** Hence R-40.77.

Three properties worth preserving:

- **The door enforces the switch itself**, not only the leaf. A consent gate living in a renderer is a gate a curl walks past.
- **`slots` never reaches the wire.** Three booleans, never the outline of somebody else's wedding.
- **The switch is immediate (R-G31.7).** `revalidate = 300` made a withdrawn permission live for up to five minutes (F-40.187) — both halves behaving as specified, the composition lying. The estate's first on-demand revalidation cures it: `POST /api/revalidate/storefront` takes **no parameters**, reads the caller's own bearer, asks `GET /me` who that is, and rebuilds only that handle.

**F-40.163 stands unamended**: the check and the weddings section together let a persistent stranger narrow a *date*, never a *name*; `crew.js`'s bucket bounds the enumeration. The founder's override remains open.

---

## 4 · OWED

| # | Item |
|---|---|
| 1 | **F-40.135** — the five wasted preloads on `/v/<code>`. Zero `preload` in the tree; the served page's console is the witness. **Unwalked.** |
| 2 | **F-40.167** — cured in this arc (`themeColor` on the G1.1 wedding leaf). The served HTML's `theme-color` was never read on production. **Unwalked.** |
| 3 | **F-40.164** — the weddings section renders honestly and thinly: DEV440's two pages are `Wedding` and `Verma Event`, both with no venue and one with no city. Not a code cure — those pages need titles and venues, which is a Wedding-pages create-sheet byte with its own veto. |
| 4 | **F-40.207** — closed in this arc's last micro: `delivery` reports `ruled_off`, `b58` §5.5 derives its set and §5.7 holds its word. Recorded because the false census, not the collapse, is the reusable part. |
| 5 | **F-40.170** — `CONTRACTS_HREF` is redundant against `rooms.ts:134` and unguarded by C31. G3.2's to delete. |
| 6 | **bs_audit is GATE-UNSOUND** at `PaymentRemindersRoom:230` (G3.4's). It prints no verdicts for anyone until cured. |

---

## 5 · THE ARC'S ONE LESSON, STATED PLAINLY

**Every real defect in this arc was found by mutating a bench, and none by reading one.**

Seven cells guarded the wrong construct and were green while doing it:

1. a SQL cell matched the word `constraint` inside the migration's own provenance comment;
2. a C38 cell matched `:root{color-scheme:light}` inside the leaf's comment *explaining* that rule;
3. a C103 cell matched the **type union** `capacity_reason: 'ruled_off' | ...` instead of an assignment;
4. a C109 window ran past the inner `catch` into the toggle's outer one;
5. a C108 window stopped at the brace inside `{ ok: false }`;
6. a C108 window could not span the `)` inside `test(auth)`;
7. a `delivery`-set derivation matched `/key:\s*\{[\s\S]*?timelineType: 'delivery'/` and returned **`makeup`** — the lazy span ran from an earlier key straight through the *next* profile's `delivery`.

The seventh is the sharpest, because it was written **into this section's own lesson an hour after the lesson was drafted**. Bounding each profile by the *next* top-level key is what fixed it.

And twice a cell drove **its own restatement** of the thing it guarded rather than the shipped bytes — `b58`'s empty-slots arithmetic, and `b58` §3.1 asking what `CARD_KEYS` *contains* rather than what the door *emits*. The second of those went green while three `b44` cells were red and every storefront was down.

Two rules fall out, and both are cheap:

- **A window measured in characters, or terminated on a delimiter that also appears inside the construct, is a window that will lie.** Bound by the statement being asked about.
- **A cell that re-implements its subject is testing its own copy.** Export the real thing and drive it.
- **A census that lists is not a census.** F-40.207: `b58` §5.5 claimed "no live category resolves `delivery`" by filtering a hand-written array, and two live trades were missing from it — one of them another bench's fixture. Derive the set from the source that defines it, or the cell is asserting the author's memory.

A green from a cell nobody has made red on purpose is not evidence. This arc paid that bill three times in one day — twice with a bench, once with a live outage.

---

## 6 · SEAT CONDITIONS, FOR THE NEXT SEAT'S PLANNING

- **`b44` cannot run in a seat container.** It dies loading `engine/dist/core/donna`; six stubs in a scratch copy make it run. Deriving one cell statically and stopping there is how three real defects were misread as stale pins (F-40.168).
- **`next build` is the founder's gate** — seat containers 403 on `fonts.googleapis.com` (F-40.134, R-40.66).
- **`b40`'s `cell()` inverts `bs_audit`'s**: falsy passes, a returned string is the failure reason. Two benches, two conventions.
- **b40 cells must be inserted before the epilogue.** Appending after `process.exit` means they never run — and every mutation reports FLOOR GREEN.
