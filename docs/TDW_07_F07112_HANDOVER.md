# TDW_07 — F-07.112 · THE THREAD COLLISION · EXECUTOR HANDOVER

**Repo:** `devjroy-dev/dream-os` · **base:** `c3959c1` · **date:** 2026-08-02 · **session:** EXECUTOR (LE)
**Charter:** the F-07.112 kickoff (seventeenth chair) as RULED — CE ruling of 2026-08-02, §1–§6.
**Scope ruled:** the CLASS fix (four selectors), Fork **R-a**, the F-06.85 header verbatim, bench §12.
**ONE ZIP. dream-os only. NO DDL. ZERO writes to production data.**

---

## 1 · WHAT SHIPPED

### The four selectors, cured together

| Site | File | What it was | What it is |
|---|---|---|---|
| **C-1** | `messages.js` · `getOrCreateCircleThread` | `couple_id + kind`, oldest-first | `+ .is('counterparty_user_id', null)` |
| **C-2** | `messages.js` · the `dm:<uuid>` write target | `id + couple_id + kind` | `+ .is('counterparty_user_id', null)` |
| **C-3** | `threads.js` · per-thread messages read | `id + couple_id + kind` | `+ .is('counterparty_user_id', null)` |
| **C-4** | `threads.js` · the thread LIST | `couple_id + kind` | `+ .is('counterparty_user_id', null)` |

They ship together because the CE ruled it and because curing C-1 alone would have made
the estate **worse**: the real group row is born, C-4 still lists the private one beside it
labelled identically, and C-3 serves its contents on tap. An invisible exposure becomes a
navigable one.

### The create path
- `counterparty_user_id: null` written **explicitly** on the insert. Not for the database —
  the column is nullable and omission already produced NULL — but because the selector
  three lines above now READS that column and a reader must see the halves agree.
- **Fork R-a, select-after-insert.** `public.conversations` carries no unique constraint that
  would stop two concurrent first-callers both inserting (`PUBLIC_SCHEMA.md` index block:
  pkey + five single-column; ladder agrees at `0001:60-62`, `0014:33`, `0085:77`). The
  resolver therefore does **not** return the row it just wrote; it re-runs the discriminated
  oldest-first select, so every racer converges and a loser's row is orphaned empty rather
  than silently swallowing a message. Cost: one extra round trip, create path only, once per
  couple for the life of the couple.
- **The durable complement is NOT here, by ruling.** A partial unique index on
  `(couple_id) WHERE kind='circle_thread' AND counterparty_user_id IS NULL` is DDL. It is
  PARKED for the founder beside the partial unique index already conditional-withheld at
  CE-125 — same class, sequenced together or not at all.

### The header (F-06.85)
`messages.js`'s `CANONICAL THREAD MODEL` block is re-authored **byte-as-accepted**: it names
the discriminator, records what it replaced and what the false sentence cost, cites the
four-selector geometry, and carries the founder's 「 leave them 」 with its reason.

### `counterparty_user_id` leaves C-4's projection
It was selected at the list and read by no line below it — the defect standing beside its own
cure. With the filter guaranteeing it NULL on every returned row, selecting it asks the
database for a constant nobody consumes. **Zero behavioural change:** no shaped field ever
carried it. Disclosed here rather than discovered.

### What did NOT move
Zero pwa bytes (census-derived: the tree contains no occurrence of `circle_thread` or
`counterparty_user_id`, and `journey.ts`'s three circle helpers have zero consumers).
Zero copy bytes — all three empty states already exist and are honest. `dreamai.js`,
`brideIndex.js`, `brideInbound.js`, `router.js`, `circleEngine.js`: **0-line**. W-1 clean.
No migration. No DML. No backfill. **The nine-plus messages stay where they are.**

---

## 2 · THE PROOF

`scripts/b07_f0772_circle_auth_bench.js` **88 → 107**, a labeled growth: **§12** is new
(14 cells) plus **§12.M** (5 mutations). One home — it already guards these four handlers.

**Both ways, whole-tree:** at the uncured production tree with this bench applied,
**94/107 — thirteen RED**, on exactly the cure: §12.1 · .2 · .3 · .4 · .5 · .7 · .10 · .11 ·
.13 and four of the five mutation cells. At the cured tree, **107/107**.

**Five mutations**, each breaking PRODUCTION code (never test setup) and asserting the named
cell goes red, each restoring the file byte-identically: drop the discriminator from the
resolver / the `dm:` target / the per-thread read / the list, and settle newest-first instead
of oldest-first (which proves R-a is not decoration).

**Cells of note**
- **§12.6** is the positive control — the group thread still reads. A cure that walls the door
  passes every negative cell.
- **§12.9** drives the **fourth mouth**: an `agent` row through the cured read shape. No cell in
  §12 keys on `{couple, bride, circle_member}` — CE-126's premise-refutation honoured.
- **§12.14** asserts this delivery has no data half: no `0106_`, no `.delete(`, no re-parent.

**LABELED AMENDMENT, count-preserving:** the §11 plane learned `.is()`. Without it the four
new production filters would throw inside the shipped handlers and all nine §11 cells would
redden for a reason having nothing to do with §11's claims. The filter is **honoured**, not
swallowed (`passesIs`) — a fake that ignores what it was asked for cannot convict code that
asks wrongly. §11 stays **9 cells, all green**.

**Fixtures are the founder's own rows**, from the fixture SELECT of 2026-08-02: one
`circle_thread` row in the entire database, PRIVATE, born `2026-07-23 13:23:18.636264`,
15 messages, last written `2026-08-01 21:56`. The private row is therefore always the OLDER
one in §12's fixtures — which is exactly why oldest-first adopted it. A fixture with that
order wrong would prove nothing about the world.

---

## 3 · THE FLOOR, re-run whole at the cured tree

npm-ci-first, BUILD-ENGINE-FIRST (exit 0).

`b07_f0772_circle_auth **107** (was 88, labeled)` · selftest **386** · auth_crossover **30** ·
f0784 **59** · p1 **75** · p2 **48** · p3 **55** · p4a_ig **110** · p4b_body **76** ·
probe **22** · slice1 **19** · p5 **136** · p6 **29** · f0776 **64** · f0791 **38** ·
f0789 **19** · f0774 **20/20**. Every one byte-stable but the target.

**Sweep:** all **95** committed `scripts/*_bench.js` run to exit code. **THREE** non-zero, not two.

---

## 4 · §0.2 REPORT — THE FLOOR UNDER-COUNTS ITS OWN REDS BY ONE

The committed floor says **known-reds EXACTLY TWO** (`meter 28/29` F-06.41 · `f0555 22/23`
F-07.11). Both reproduce here exactly. **There is a third:**

```
scripts/b5b_movementb_bench.js
  BENCH ERROR TypeError: Cannot read properties of undefined (reading 'length')
    at runAdminEndpointBench (scripts/b5b_movementb_bench.js:225:19)
```

**Pre-existing, not this delivery's.** Proven by running it at the untouched tip `c3959c1`
with this sitting's changes stashed — identical crash, identical line. It is not a failed
assertion but a **crash**, which is why a count of passing cells never saw it: the two known
reds report `N/N+1`, this one reports nothing at all.

Reported, **not cured** — out of this sitting's charter. It is F-06.94's class ("the floor
under-counted itself for a tenure") on a different bench, and the number is the chair's to
mint. Named per the floor-method law rather than left for a future session to trip over.

---

## 5 · WHAT THE BENCH CANNOT PROVE, NAMED

**§12.8 is not driven.** The honest cell would drive `dreamai.js`'s history handler and watch
it still return her rows. It does not: `require`ing that router executes
`src/agent/circleEngine` (`dreamai.js:14`) — a **W-1 protected surface** that constructs a
client at import. The first cut died on `supabaseUrl is required` and would only have been
revivable by seeding credentials to load a soul module this sitting is forbidden to open.

So the claim is narrowed to what can be proven — the private lane's reads still key on
`counterparty_user_id`, this file is 0-line, and it was **not** given the group discriminator —
and the remainder is **the founder's**: card step 6, the one step that is not optional.

**A bench fault caught in its own author, in ink:** the four cured selectors carry the same
line, and `mutate` uses `String.replace`, which takes the first occurrence. §12.M5's first cut
aimed at the list and broke the per-thread read instead — §12.7 stayed green over broken
production code and the mutation cell convicted its author. CE-125's fifth bench fault,
second instance, same file. Every anchor is now site-qualified by the line above it.

---

## 6 · THE FOUNDER'S SMOKE CARD

Plain steps. The founder only performs and pastes; the executor reads the evidence.
**Step 2 and step 6 are the two that matter — one is the class fix, the other is the privacy
proof, and neither is optional.**

**Before you start**, run the conversations SELECT (§7 below) and paste the rows. That is the
BEFORE picture.

1. **On the bride's phone/browser, open Sanctuary and leave it open ten seconds.**
   Her poll births the group row. Nothing visible changes; the Circle feed still shows your
   saves and joins as before. *(Evidence: the AFTER SELECT will show a second conversations
   row, `lane = GROUP (counterparty null)`, `message_count = 0`.)*

2. **Open the co-planner and go to Threads. Count the entries. There must be exactly ONE.**
   Before this delivery that list also carried Mehek's private conversation with Mira,
   tappable, labelled the same as everything else. **This step is the whole point:** it is the
   only place a human can see the class fix. If you see two entries, STOP and paste the screen.

3. **Open it. It is EMPTY, and says "No messages yet. Say hello."**
   **THIS IS THE DESIGNED OUTCOME OF 「 leave them 」, NOT A BREAK.** The fifteen messages that
   used to appear here were never in a group chat — they were inside Mehek's private thread
   with Mira, and you ruled that they stay there. The group chat has genuinely never existed
   until step 1 created it. An empty screen here is the estate telling the truth.

4. **Send one message. It appears.**

5. **Go back to the bride's Sanctuary. That same message appears in the Circle feed.**
   One thread, two surfaces, as intended — now for real.

6. **On the co-planner, open Mira (the DreamAI chat). Scroll back.**
   **Your private history must be INTACT and unchanged — all fifteen messages, nothing missing,
   nothing added.** This is the privacy proof. A cure that closed the leak by breaking Mira
   would have passed every cell in the bench.

7. **Run the SELECT again and paste the rows.** Expected AFTER: the private row **unchanged**
   at 15 messages with its original `created_at`, plus one new GROUP row holding the one
   message from step 4.

**Reconciled against the build, step by step:** 1 → C-1's create path · 2 → **C-4** ·
3 → the 「 leave them 」 outcome, zero new bytes · 4 → C-1 + C-2 · 5 → the shared row ·
6 → the non-regression §12.8 could not drive · 7 → the data half, proven untouched.
**Every step has a thumb-path.** No step requires the founder to type a uuid or edit anything.

---

## 7 · THE FOUNDER'S SELECT (read-only, run before and after)

Identical to the read-first's. Read-only, zero writes, zero placeholders.

```sql
-- F-07.112 · FIXTURE STATE · READ-ONLY. No writes. No placeholders.
-- Columns witnessed at docs/db/PUBLIC_SCHEMA.md:
--   public.conversations · 12 columns, lines 190-203
--   public.messages      · lines 591-610
select
  c.id                       as conversation_id,
  c.couple_id,
  c.counterparty_user_id,
  case when c.counterparty_user_id is null
       then 'GROUP (counterparty null)'
       else 'PRIVATE (per-member AI)'
  end                        as lane,
  c.state,
  c.mode,
  c.created_at,
  c.last_message_at,
  (select count(*)          from public.messages m where m.conversation_id = c.id) as message_count,
  (select min(m.created_at) from public.messages m where m.conversation_id = c.id) as first_message_at,
  (select max(m.created_at) from public.messages m where m.conversation_id = c.id) as last_message_at_row
from public.conversations c
where c.kind = 'circle_thread'
order by c.couple_id, c.created_at;
```

---

## 8 · WHAT THE NEXT SITTING PICKS UP

- **F-07.72 ZIP 2** (enforcement) — now lands on doors that serve the right room. It carries
  F-07.113's log line and the partial unique index on `(invitee_phone)`.
- **R-b**, the partial unique index on the group thread — PARKED with CE-125's, the founder's
  to sequence. Until then the race is defended in code, not in the schema.
- **The third known red** (§4 above) — unnumbered, the chair's to mint.
- The masterplan row-07 doc-gap is the **chair's** debt per §6 of the ruling; this delivery
  authors no masterplan byte.
