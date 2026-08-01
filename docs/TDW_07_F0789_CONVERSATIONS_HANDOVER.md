# TDW · THE VENDOR CONVERSATIONS MICRO — the phantom column and the empty room that wasn't

Base: `dream-os c0b7872` · `dreamos-pwa dd2d16f` (the panel fold, banked). Executor never pushes.
Founder-witnessed on the wire before a byte was written.

---

## 1 · THE TWO DEFECTS, AND WHY THEY WERE ONE SYMPTOM

**F-a — the phantom column.** `src/api/admin/conversations.js:21` selected `channel` off
`public.conversations`. That table has **twelve columns** and `channel` is not one of them —
witness `docs/db/PUBLIC_SCHEMA.md:190–205`, **settled on the wire by the founder's own network
capture**: `{"ok":false,"error":"column conversations.channel does not exist"}`. `channel` is a
`messages` column (`:597`); the field list was copied across tables. Postgres refuses the WHOLE
select on one bad column, so the screen has 500'd for as long as the line existed.

**F-b — the false sentence.** `.catch(() => setLoading(false))` swallowed it, the list stayed
`[]`, and the screen rendered 「 No conversations yet 」. The founder was told he had no vendor
conversations while the server was saying the column doesn't exist.

**Neither was visible until the panel fold landed.** The route ALSO 403'd from the rotation, so
the 500 sat behind the outage and the lie sat in front of the 500. Curing the credential is what
made both readable. The brides sibling never selected `channel` and never broke — that asymmetry
is what named the defect.

---

## 2 · WHAT SHIPPED

**dream-os** — `src/api/admin/conversations.js` (one word, mechanism named in-comment) ·
`scripts/b07_f0789_phantom_columns_bench.js` **NEW, 19 cells** · this doc.

**dreamos-pwa** — `app/admin/conversations/vendors/page.tsx` + `brides/page.tsx` (the failure
state) · `scripts/tdw07_f0789_conversations.proof.mjs` **NEW, 24 cells**.

The brides screen carries the identical swallow and **was cured in the same delivery though it
has never errored** — a class that survives on one screen is a class that survives.

---

## 3 · THE SWEEP, NOT THE SITE

Curing one word cures one screen. The bench validates **every** `.from(table).select(...)` in
`src/api/**` against the committed column witness, clearing anything a later `ALTER TABLE ... ADD
COLUMN` added (PUBLIC_SCHEMA regeneration is deferred since 0085, so the doc is a *starting*
witness). Engine-plane queries are excluded **by name and with reason** — `public.messages` has 17
columns, `engine.messages` has 6, and validating one against the other manufactures false
phantoms.

### DECLARED OPEN — a SECOND live phantom, reported not cured

`src/api/couple/discover.js:514` selects **`name` and `routing_handle`** off `discover_heroes`.
Migration `0044_discover_heroes.sql` creates that table with seven columns and neither is among
them; no later ALTER adds them; and the admin router that WRITES heroes
(`api/admin/discoverHeroes.js:15,32`) never touches either. The select therefore errors, and the
handler's `if (!error && heroes && heroes.length > 0)` **falls silently through to its fallback**
— so **every hero the founder uploads through the admin has been invisible to couples, with no
error surfacing anywhere.**

It is a COUPLE-FACING surface and outside this micro's charter. It sits in the bench's
`DECLARED_OPEN` list **by name**, `§3.1` passes only on *undeclared* phantoms, `§3.2` reddens if
the list grows, and `§3.3` proves the sweep still SEES the pair — excluded by name, never by
blindness. **CHARTER IT.**

---

## 4 · THREE MISSES OF MY OWN, ALL CAUGHT BY MUTATION, ALL DISCLOSED

1. **The sweep had a blind spot and was green anyway.** Drafts 1–2 required `.select(` to sit
   immediately after `.from('x')`. This estate routinely writes `.from('x').update(...).select(...)`
   and `.insert({...}).select(...)` — every one of those was **invisible**. Mutation N-3 planted a
   phantom at `api/vendor/me.js:229` and the bench stayed **19/19 GREEN**. The hollow-green class
   inside the bench built to prevent it, caught by running the mutation, not by re-reading. Span
   widened, stops at the next `.from(`. N-3 now convicts.
2. **A sweep matching nothing.** An intermediate draft returned ZERO hits and `§3.1` went green on
   an empty result set. `§3.3` exists so a green can never rest on blindness.
3. **A comment-judging cell, the class's third appearance here.** `§1.a` asserted the retired
   `.catch` shape was absent from the FILE and went red on the cured tree — because the F-06.85
   comment quotes the old shape verbatim, which that law *requires*. Re-aimed to stripped code;
   `§1.a2` added as the canary asserting the comment survives. Greens are never bought by deleting
   evidence (F-07.52).

Also disclosed: `§2.3` first scanned brides-to-EOF and convicted the `/:id/messages` route, which
selects `channel` off `messages` where it legitimately lives. Scoped; `§2.4b` added as its
non-vacuity twin.

---

## 5 · MUTATIONS — 17, all RED, production code mutated

**dream-os** (19/19 cured): N-1 `channel` restored `16` · N-2 new phantom on brides `17` ·
**N-3 phantom via an `.update().select()` chain `17`** (the gap-closer) · N-4 engine exclusion
removed `17` · N-5 ladder escape hatch removed `17` · N-6 declared-open list emptied `17` ·
N-7 sweep blinded `17` · N-8 mechanism comment stripped `18`.

**dreamos-pwa** (24/24 cured): P-1 swallow restored on vendors `22` · P-2 on brides `22` ·
P-3 arm order inverted `23` · P-4 flag never resets `23` · P-5 retry removed `23` ·
P-6 mechanism comment stripped `23` · P-7 veto marker removed `23` · P-8 string inlined `23` ·
P-9 stripper no-op `22`.

All files restored **byte-identical** (`cmp` / porcelain).

---

## 6 · FLOORS — whole, both repos

**dream-os** — `npm ci` 0 → `build:engine` 0 → **92 benches**.
selftest **386** · p5 **136** · p6 **26** · auth **24** · f0776_doors **61** · f0784_panel **59** ·
**f0789_phantom 19 ← NEW** · known-reds **EXACTLY TWO** (meter 28/29 F-06.41 · f0555 22/23 F-07.11).

**dreamos-pwa** — `npm ci` 0 · `rm -rf .next` · `tsc --noEmit` **ZERO**.
All fifteen prior counts unmoved · **f0789_conversations 24 ← NEW** · the seven `run-*.sh`
24·11·17·11·25·22·41 green. **Movement: ZERO** beyond the two additions.

---

## 7 · VETO SLOT — two strings, one line from the founder

| | |
|---|---|
| frozen, unchanged | `No conversations yet` · `Failed to load messages.` |
| sibling precedent | `Could not load your preview.` · `Something went wrong. Try again.` |
| **LE DRAFT** | 「 Could not load conversations. 」 |
| **LE DRAFT** | 「 Try again 」 (the retry affordance) |

Both live in named constants on both screens, marked `VETO PENDING` in-file; `§3.a/b/c` assert
they stay named and never inline. A one-byte re-cut on his word.

---

## 8 · THE FOUNDER'S WALK — four steps

| # | you do | I read |
|---|---|---|
| 1 | Deploy dream-os, then Vercel. | boot green |
| 2 | `/admin/conversations/vendors` | **the thread list renders.** This has 500'd since the line was written. |
| 3 | `/admin/conversations/brides` | still renders — the sibling did not regress |
| 4 | Open a vendor thread | messages load |

**The failure state is bench-only by design and named as such** — witnessing it live would mean
breaking the query on purpose against production. `§1.d/e/f` prove the arm order, the gating and
the retry; no step depends on unsetting anything. **Fixture state: none.**

---

## 9 · FOR THE SEAL ENTRY

- **F-a CURED** at the site, and the CLASS made re-runnable estate-wide.
- **F-b CURED** on both screens; the sibling cured though never sick.
- **DECLARED OPEN, charter owed:** `discover_heroes.name` / `.routing_handle` — the couple hero
  feed has been silently serving its fallback.
- **THE OUTAGE-MASK LAW, earned here:** a 403 in front of a 500 in front of a false empty state.
  Each layer hid the one beneath it, and each cure exposed the next. **A screen that renders after
  a guard fix has proven the guard, not the screen** — the walk must read the network tab, not
  only the pixels.
- **THE BLIND-SWEEP LAW:** a sweep that reports zero must prove it can see one. `§3.3` and `§4` are
  that proof, and they exist because my own sweep was green while blind.

Sequencing beyond this sitting is the founder's.
