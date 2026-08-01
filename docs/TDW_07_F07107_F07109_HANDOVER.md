# TDW_07 tail — F-07.107 + F-07.109 · SERVER HALF (ZIP 1 of 2)

**Base:** dream-os `c43bec0` · sibling half: dreamos-pwa `e8db357` (ZIP 2, applied second).
**Charter:** the seventeenth chair's F-07.107 + F-07.109 kickoff, its read-first ruling, and the
CE relay of 2026-08-02. Executor session; the founder ran the migration and will run the walk.

---

## 1 · WHAT WAS WRONG

`public.messages` held no author of any kind. `sent_by` stores a ROLE, and **four** server sites
handed that role to a field named `sender_name`:

| # | site | was |
|---|---|---|
| 1 | `messages.js:162` | `sender_name \|\| (role === 'bride' ? 'Bride' : null)` — a client echo over a literal |
| 2 | `messages.js:216` | `m.sent_by === 'bride' ? 'Bride' : (m.sent_by \|\| null)` |
| 3 | `threads.js:65` | `m.sent_by \|\| null` |
| 4 | `threads.js:121` | `lastMsg.sent_by \|\| null` — the thread-list preview |

The kickoff named three; the fourth was found at read-first and is cured despite being inert
(its only consumer renders `content` alone) — a shape that lies to a type nobody reads is one
screen change from lying to a reader.

The POST **accepted** a `sender_name` from the client and **echoed** it, while the insert had no
column to hold it: a name survived one optimistic render and died on reload.

Separately (F-07.109), `coplanner/threads/[threadId]/page.tsx:139` computed
`mine = m.sender_user_id === session.user_id` against a field **no response on this lane has ever
emitted** — `grep` returns zero across `src/` and `scripts/`. `undefined === '<uuid>'` is
permanently false, so every bubble took the stranger branch and the reader's own messages
rendered as somebody else's.

The discriminating fact, and the shape argument: `public.circle_activity` — the same estate, one
table over, rendering correctly on the same surface — carries `actor_user_id` **and** `actor_name`
as a **pair**.

---

## 2 · WHAT SHIPPED

**`0105_circle_message_author.sql` — founder-run 2026-08-02, applied, readback witnessed at
twenty columns.** Two nullable columns, `sender_name text` and `sender_user_id uuid`, both
defaultless. Nothing backfilled: history stays NULL by ruling, because minting an author for a
row that never had one is fabrication on a typed column. No index — nothing filters, joins or
orders on either column at this tip.

**Authored from the founder's `information_schema` paste, never from the doc.** `PUBLIC_SCHEMA.md`
declares itself stale by three migrations in `0104`'s own header (F-07.19: `0102` is applied with
no committed file), so the paste was the settling witness and the doc only the starting one. The
kickoff's three-message order was corrected to **four** at read-first and the CE made that this
sitting's law: witness SELECT → paste → DDL authored from the paste → run + readback → code.

**`resolveAuthor` replaces `resolveCoupleId`** (one definition, one call site). It answers three
questions off the same rows rather than walking them twice:

- **member** → `circle_members.invitee_name`, by widening one existing select. **Zero new round
  trips.** Preferred over `users.name` on derivation, not taste: `invitee_name` is `NOT NULL` at
  the witness while `users.name` is nullable, and it is the name the bride herself typed into the
  invite sheet — the right identity for her own circle.
- **bride** → `couples.user_id` → `users.name`. **One new query on her send path, disclosed here
  rather than discovered later by someone reading a query-count graph.** Her name is nullable and
  a null is returned as a null, never papered with a literal.
- **the author is the PROVEN caller.** The credential decides; the body's `userId` survives as a
  routing fallback for the mint-and-teach phase and **cannot author**. A credential-less send
  writes a NULL author, the bubble renders with no name line, and that path dies whole at ZIP 2.

**The client `sender_name` parameter is DELETED** — destructure, contract comment, and all three
senders in the sibling ZIP. An accepted-but-unread identity string is a lie in the API contract,
and a client-supplied identity is a forgeable address (F-07.56).

**The POST echo is now the persisted row**, selected back from the insert. The
optimistic-render-then-die class is dead at the source.

**One comment correction, zero behaviour:** `resolveCircleIdentityIfPresent`'s header cited
`journey.ts:438/:448/:458` as the bride's live second caller and `sanctuary:2895` for the POST.
The POST is at `:2901`, and those three `journey.ts` helpers have **zero consumers** anywhere in
the pwa tree. The ruling the file rests on is unharmed — `sanctuary:2585` and `:2901` are live and
are hers — but a dead call site cited as a live one is how a reader inherits a false census.

**One line of `docs/FINDINGS_LOG.md`**, under the CE's narrow clobber exception and no other byte:
CE-125 cited `messages.js:83` accepts / `:143` echoes; at the sealed tip those are `const supabase`
and `.single()`. Corrected to `:84` and `:162`.

---

## 3 · WHAT WAS FOUND AND NOT CURED — F-07.112, minted this sitting

The fixture SELECT that was supposed to furnish the smoke card convicted the lane instead. **One
`circle_thread` conversation exists in the entire production database, and its
`counterparty_user_id` is a member's `users.id`.**

`getOrCreateCircleThread` (`messages.js:50-58`) resolves the "canonical group thread" on
`couple_id + kind`, oldest first, **with no `counterparty_user_id is null` filter**;
`dreamai.js:83-85` mints the member's **private Mira conversation** with the same `kind`. So the
group resolver adopts whichever row was born first. In production that row was born
`13:23:18.636264` and its first message landed 166 ms later from `dreamai.js:105`.

**The couple's group chat has never existed as its own row.** Every group message on both surfaces
since 2026-07-23 has ridden a member's private AI conversation — which means
`GET /frost/circle/messages/:coupleId` returns her private questions to Mira to any caller of that
door. A privacy exposure, on the lane ZIP 2 is about to enforce.

The header at `messages.js:12-17` claiming one thread per couple is **true by count and false in
meaning**; it is left standing with F-07.112's correction beneath it so the next reader sees both.
The cure's code half is one predicate. Its data half — messages stranded in the private thread,
the group chat opening empty on both surfaces — is a write against production rows and is the
founder's alone. **Its own micro, deliberately outside this charter.**

It also **refutes two premises this sitting was built on**, and the cells respect the refutation:
`agent` is a fourth mouth on this table (`dreamai.js:133`), and `circle_member` appears **zero
times** in production because neither sender ever sends `sender_role` — Mehek's every message is
filed `couple`. No cell here assumes the three-value space.

---

## 4 · PROOFS

`b07_f0772_circle_auth_bench.js` **68 → 88**, labeled (§11's fourteen cells + §11.M's six
mutations). Extended in place rather than given a new home: these cells guard the same three files
§5 already guards.

**They are DRIVEN, not asserted.** The real routers are required and the real handlers pulled off
the Express stack, so every claim runs the shipped path a real caller reaches. Member hydration,
bride hydration with the literal absent, the NULL author on a credential-less send, the body's
inability to forge a name, the echo as the persisted row, both GET shapes, site 4, and an `agent`
row that neither crashes nor acquires a name.

**Both ways.** §11 stashed to the uncured tree goes RED on exactly the cures. Six mutations of
**production source** — not test setup — each proven to redden its named cell.

**Two defects the cells caught in their own author, disclosed rather than quietly fixed:**

1. **§11.3 convicted the code against its own comment.** The fallback was hydrating the author
   from the body's claimed `userId` while the comment two inches above said a credential-less send
   writes NULL. The ruling is literal — from the resolved caller, never the body — so the code
   moved, not the cell.
2. **§11.M1 passed over broken production code.** The fake plane ignored `.select(...)`, so every
   select-narrowing mutation was a no-op. The plane now honours projections. *A fake that ignores
   what it was asked for cannot convict code that asks wrongly.*

**One labeled, count-preserved re-aim.** `b07_p4b_body_bench.js` §5.26 read "no migration numbered
0105 or higher exists" — a pin on the **ladder tail**, not on P4b's claim. True at P4b's seal,
false the instant any later sitting shipped DDL. Re-aimed to what it always meant — the ladder may
grow, but nothing in it is P4b's — and proven non-vacuous by planting a P4b-shaped migration and
watching it redden. **76/76**, address changed, behaviour and count unchanged.

**Floor, re-derived at this tip:** rig selftest **386/386** · known-reds **EXACTLY TWO** (meter
28/29 F-06.41 · f0555 22/23 F-07.11) · p1 **75 PAIRED** · p5 **136** · auth_crossover **30** ·
p2 48 · p3 55 · p4a_ig 110 · probe 22 · slice1 19 · p6 29 · f0776 64 · f0784 59 · f0791 38 ·
f0789 19 · f0774 20/20. The F-07.74 stripper pin and ZIP 1's cells are not regressed.

**Floor-method disclosure, three items named rather than absorbed:** `b5_wa_door_smoke`,
`b5b_movementb_bench` and `test-shape` exit non-zero in a keyless container — they refuse loudly
without service-role or Anthropic credentials. They are live smokes, not floor benches, and are
absent from CE-125's list. `p1` and `p5` return 71 and 114 when the pwa tree is not beside this
one, and say so in their own skip lines; the counts above are the paired run.

---

## 5 · COPY

**One new user-facing byte in the whole delivery, and it is in the sibling ZIP:** 「 You 」.
Founder-vetoed, frozen at the byte. Every other copy movement is a **deletion** — the server's
`'Bride'` literals, the client's three payload literals, and the role suffix that 「 NO TAG 」
retired. Nothing else entered.

---

## 6 · WHAT THE FOUNDER STILL OWES

Nothing on this ZIP beyond apply / verify / push. The migration is already run and witnessed.
The walk is the sibling ZIP's and its card ships with it.

**Standing from CE-125, untouched here:** F-07.108's `CIRCLE_SESSION_SECRET` rotation · ZIP 2 of
the F-07.72 sitting (enforcement) and its partial unique index.

**New to the board:** **F-07.112** (its own micro; code half one predicate, data half the
founder's) · **F-07.110** cured here and in the sibling · **F-07.111** homes to Block 10's standing
unmounted-surface sweep, not this sitting.
