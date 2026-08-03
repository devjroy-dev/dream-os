# TDW_08 · P5 · PHASE 1 — THE FUSED INVITE ACT (executor handover)

**Base:** dream-os `3917f87` · dreamos-pwa `c572b48` — both re-derived at origin
by `git fetch -q origin && git rev-parse origin/main` at build start, both equal
to the charter's tip, both trees `git status --porcelain` clean at first motion.
**Charter:** the twenty-first chair's P5 Phase 1 kickoff, 2026-08-04.
**Ruling built to:** the CE's read-first ruling, 2026-08-04 — FORK A(ii) ·
B(ii) · C(i) · D(ii), the §4 pwa sliver, the §5 transport and veto terms.
**Role:** EXECUTOR. Nothing here was pushed; the LE holds no write credentials.

---

## 1 · WHAT SHIPPED

**dream-os — five files, three modified, two new.**

| File | What |
|---|---|
| `db/migrations/0109_demo_invite_sent_marker.sql` | NEW. `demo_vendors.invite_sent_at timestamptz` + its column comment. Founder-run, **before** the apply. |
| `src/lib/demoLifecycle.js` | `markInviteSent()` — the column's sole writer, `_write`-shaped, `_at`-only, refuses a re-stamp. `invite_sent_at` added to the three module select lists. Exported. |
| `src/api/admin/demoAdmin.js` | Pre-check **1-0** (`invite_already_sent`), sited first. The post-send stretch fused and guarded (FORK B(ii)). The loud line rewritten to attribute honestly. |
| `scripts/b08_p5_invite_bench.js` | NEW. 35 cells, six `§M` both-ways mutations of production source. |
| `scripts/b08_p4_factory_bench.js` | TWO LABELED AMENDMENTS, **count preserved at 83**. |

**dreamos-pwa — two files, one modified, one new.**

| File | What |
|---|---|
| `app/admin/demo/page.tsx` | `DemoVendor.invite_sent_at`; `canSend` gains `&& !v.invite_sent_at`, sited above the `active` clause. Both consumers inherit from the one home. |
| `scripts/tdw08_p5_invite_spent.proof.mjs` | NEW. 14 cells, four `§M` both-ways mutations. |

---

## 2 · THE DISEASE, AND WHAT THE CURE ACTUALLY CLOSES

`_inviteOne` spends a real WhatsApp template and **then** writes state. The two
acts can come apart. Before this delivery:

- **Send fails** → caught, no state written. *Already safe; unchanged.*
- **`onInvited` returns not-ok** → loud `SENT BUT NOT STAMPED` + 500. *Already
  loud; preserved.*
- **`onInvited` throws** → escaped the handling entirely. The single door
  answered a generic 500; the bulk door filed `{error:'threw'}`. **Neither
  crashed — both erased the truth**, answering byte-indistinguishably from a
  pre-send failure with the loud line never printed. *This is the chair-adopted
  refinement from the read-first, and the cure's own comment carries the
  sentence.*
- **After any of the above** the row still read `built`, `INVITE_STATES` still
  admitted it, and **nothing recorded that a template was spent** — so the
  founder could send the same vendor a second one.

After: `invite_sent_at` is stamped between the send and the transition; the
pre-check refuses any stamped row before a template is spent; every post-send
failure converts to the loud path with correct attribution.

**THE RESIDUAL, NAMED AND NOT PAPERED.** The window between send-success and
stamp-success is **one DB write wide** and cannot be closed from this side of the
network — no transaction spans WhatsApp and Postgres. What the cure guarantees is
that every failure inside it is LOUD and correctly attributed. It is smaller than
the window it replaces (which spanned the send, the stamp *and* the transition,
and was silent on two of three paths). **It is not zero, and the source says so.**

---

## 3 · PROOF

**Both-ways, by mutating PRODUCTION code — never test setup.** Six `§M` cells in
`b08_p5_invite_bench`, four in the pwa proof. The CE's two named mutations are
the first two:

- pre-check term removed (`if (row.invite_sent_at)` → `if (false)`) → §2.1 RED.
- the stamp neutered (`markInviteSent` call → `{ ok: true }`) → §3.3 RED.
- plus: the ordering control, the `sent_not_stamped` naming, the re-stamp
  refusal, and the stamp-moves-state guard.

**The disease is reproduced, not described.** The bench's fake plane carries a
fault switch (`_faults.updateThrowsOn`) that makes a named table's write throw —
the only way to produce "template already gone, database now refuses" on demand.
`§3.1–§3.5` drive both sides of it: the transition failing *after* a recorded
spend, and the spend itself failing to record. `§3.4` walks the whole arc — send,
transition fails, founder tries again, **route refuses**.

### The floor, PAIRED, both sides stated

| | base `3917f87` | cured | |
|---|---|---|---|
| selftest | 386 | 386 | byte-stable |
| b07_p1 · b07_p5 · b07_f0774 · b07_p6 · b07_f0784_panel | 75 · 136 · 20 · 29 · 59 | identical | byte-stable |
| b08_p1_lifecycle · b08_p3 · b08_console | 106 · 61 · 71 | identical | byte-stable |
| b08_p4_factory | 83 | 83 | **two labeled amendments, count preserved** |
| b08_p5_invite | — | **35** | new |
| b07_f0789_phantom_columns | 19 | 19 | byte-stable — 0109 is ladder-visible |
| pwa tsc | 0 lines | 0 lines | cleared `.next` both runs |
| pwa named counts | 45 · 88 · 133 · 82 · 43 · 68 · 57 | identical | byte-stable |
| pwa tdw08_p5_invite_spent | — | **14** | new |

`node --check` clean on both touched `.js` files. **W-1 CLEAN** — zero soul,
prompt, lens or engine bytes; `git status` on the delivery is exactly the five +
two files above.

### Two floor-record disclosures (floor-method law)

1. **The charter says "27 proofs rc=0"; there are 29** (22 `.mjs` + 7 `.ts`) at
   base, all rc=0. The charter's number under-counts by two. Disclosed, not
   silently preserved. At the cured tree: 23 `.mjs` + 7 `.ts` = 30, all rc=0.
2. **The first floor run of this sitting reported 16 false failures** because
   `node_modules` was absent on the fresh clone. Deps installed, engine built,
   floor re-run. Those first numbers were the container's, not the tree's, and
   are recorded here so nobody reads them as a baseline.

---

## 4 · THE TWO LABELED AMENDMENTS (b08_p4_factory, 83 → 83)

Both cells pinned the pre-check's **entire column literal**, which FORK C(i)
legitimately grew. Neither was written to police that.

**AMENDMENT ① — §8.2.** `\.select\('…, state, active'\)` →
`\.select\('…, state, active[^']*'\)`. **STRICTLY STRONGER:** the old form would
have passed on a select that read `active` and then *reordered* it away from
`state`, and would have failed on any additive column forever. The new form pins
the prefix **through** `active` — it cannot be dropped, renamed or moved out of
the pre-check's own select — while admitting columns appended after it. It still
anchors on `.select(` rather than a bare `/active/`. **COUNT PRESERVED.**

**AMENDMENT ② — §M.13.** The anchor was the whole literal and matched zero after
the growth, so the cell reported a missing anchor rather than a verdict. The
anchor is now the **term under test** — `, state, active` → `, state`. Same
mutation, same assertion. Uniqueness re-derived by command at authoring
(`grep -c ', state, active'` = 1), so `okMutate`'s exactly-once guard still bites.
**COUNT PRESERVED.**

---

## 5 · DEVIATIONS, DISCLOSED (§0.2 — reported, never worked around)

**(a) The pwa wire needed ZERO server bytes, against the ruling's wording.**
CE §4 orders `GET /admin/demo/vendors` to "ship `invite_sent_at` raw beside
`invite_states`." **That route already does** — it reads `select('*')` and
spreads `...r` per row, so the column rides the moment it exists. I added no
redundant change. What I added instead is `b08_p5_invite_bench §5.5`, a guard on
the `select('*')` that makes it true, because a future narrowing edit would drop
the tell off the wire silently. The cell also asserts the board derives **no**
opinion about the column — the predicate belongs to the route and the client.

**(b) The pwa term is sited ABOVE `v.active !== false`, not appended.** My first
draft appended it and **red a sealed bench** (`tdw08_p4_factory` 44/45): §M.8's
mutation anchor is the last clause *including its semicolon*. Re-siting preserves
that anchor byte-identical and keeps §7.1's 240-character window reaching the
active clause at **190 of 240** — derived by command, not estimated, and recorded
in the surface's own comment. **Moving a sealed cell for a cure that did not need
it moved is a cost with no buyer**, so the sealed proof stayed at 45 and the new
cells went to a new file. `tdw08_p5_invite_spent §3.1/§3.2` assert both
properties *from the new file*, so a future hand re-ordering the predicate for
tidiness learns the cost there and not from a red bench elsewhere.

**(c) FORK D(ii)'s "the board carries the tell" has NO ruled rendering, and I did
not invent one.** A spent-but-`built` row currently just loses its Send button,
which looks identical to an inactive or linkage-held row. A badge is a
user-facing byte and Phase 1 is expected-zero, so per the UNRULED-ARM law the arm
is **named, not built** — proposed copy is on the veto list at §7.

**(d) One self-catch, filed rather than shipped.** My first draft's recovery log
line asserted `invite_sent_at was stamped at ${stampedAt}` from a timestamp
minted *before* the call — a log guessing which of two states the database was
in, which is the same class as a false done. Replaced with a witnessed
`spendRecorded` flag read from `markInviteSent`'s own return. The line now says
either *"invite_sent_at IS recorded"* or *"THE SPEND IS NOT RECORDED — this log
line is the ONLY record."* `§3.5` is the cell that holds it to that.

**(e) A spec drift filed for Phase 3, not fixed here.** Spec P2's wiring sentence
sites the Closer swap "in `marketingIndex.js` turn handler"; the true seam is
`prospects.js` `handleMarketingInbound` (`:227-236`). The chair filed this at
ruling §1(2); recorded again here so it travels with the code.

---

## 6 · THE FOUNDER'S STEPS, IN ORDER (numbered clicks, nothing assumed)

**STEP 1 — RUN `0109` FIRST, IN THE SUPABASE SQL EDITOR, BEFORE THE APPLY.**
Not optional: the cured `_inviteOne` SELECTs `invite_sent_at` by name, and
against a database without the column PostgREST answers an error and the invite
route refuses **every** row. The file is in the ZIP at
`db/migrations/0109_demo_invite_sent_marker.sql`; paste it whole. It returns
**five rows** and every `answer` must read `true`. Paste the grid back.

**STEP 2 — apply the dream-os ZIP**, then the dreamos-pwa ZIP. Both carry their
own repo guard as the first command.

**STEP 3 — the smoke card.** NOT AUTHORED YET, and deliberately: the
fixture-state law (F-07.6) says the card is written from pasted rows and never
the other order. **Statements 1 and 2 of the fixture SELECT are still owed** (the
chair recorded statement 3 as landed at ruling §2). The card follows the moment
they arrive, walked against `9888294440` / `swatitomar_p4b`.

**The reverse direction is NOT runnable as delivered.** 0109's `DROP COLUMN`
ships fully commented with its export SELECT above it, per the
conditional-withheld rule, and it is destructive — it discards the record that
templates were spent. It requires founder sign-off recorded here and an export
taken first, and the cured code must be reverted at the tree *before* the column
is dropped.

---

## 7 · THE VETO LIST

**Expected-zero vendor-facing bytes: HELD.** No prospect-, couple-, or
vendor-facing string moved. Log lines are transport-side and carry no customer
data beyond the `ig_handle` already logged by every sibling line.

**Keys, never prose (CE-186's precedent) — one minted:**

| Key | Where | Reads |
|---|---|---|
| `invite_already_sent` | 409 body, `_inviteOne` pre-check 1-0 | a key |
| `already_stamped` | `markInviteSent` typed refusal, internal | a key |

`sent_not_stamped` is **pre-existing** and unchanged.

**PROPOSED, NOT BUILT — FORK D(ii)'s visible tell.** If the founder wants a
stamped row to *say so* on the board rather than merely lose its button, the
smallest honest shape is a badge in the existing row of badges, in the
`shared handset` / `linked to @X` family:

> `invite sent` — beside the existing badges, warning colour, no date.

**Not shipped.** It is a user-facing byte, it was not ruled, and Phase 1 is
expected-zero. One word from the founder builds it as a micro.

---

## 8 · WHAT THE NEXT SITTING PICKS UP

- The founder's fixture statements 1 and 2 → the smoke card → the live walk.
- **FORK D(i) is DEFERRED-NAMED** by the ruling: a stamp-only recovery route,
  chartered the day the tell fires live. Until then recovery is founder-SQL.
- **Phase 2 = S-7, the TDW Manual.** It does not exist and the Closer has no
  ground truth without it.
- The residual named in §2 is permanent and belongs in the block's ledger as a
  declared gap, not a defect awaiting cure.
