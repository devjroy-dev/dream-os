# TDW_07 — F-07.115 · THE MIRA RETIREMENT · EXECUTOR HANDOVER

**Bases:** dreamos-pwa `5f4d7b1` · dream-os `bf66909` (NOT `f8cd7de` — CE-128 landed between the kickoff's issue and this sitting's paste, as the kickoff itself predicted; origin outranks the kickoff and the work was done at `bf66909`).

**Serial order: pwa FIRST, then dream-os.** Deleting the page is safe against a live door; retiring the door first would 404 a live page for the length of the deploy window.

**Zero SQL. Zero DDL. Zero migrations. Zero production writes.** Both parked partial unique indexes untouched in any form — not as SQL, not as comment, not commented-out.

---

## §1 · WHAT F-07.115 WAS, AND WHY THE CURE IS A DELETION

`dreamai_access_granted` was a hardcoded `false` with no column behind it. `public.circle_members` has thirteen columns at the witness (`docs/db/PUBLIC_SCHEMA.md:74-89`) and none of them is a permission. The flag could not be true for anyone, ever, and it gated a complete, working Dream AI surface in the co-planner — F-07.72's class in mirror image: a lock with no key.

The founder ruled the **lock right and the feature wrong for that surface**. Circle members reach Mira on WhatsApp; they always could; that is the intended shape. So the cure is deletion of the surface, plus a tip saying where she actually lives — not a key.

---

## §2 · THE DELTA

### dreamos-pwa (base `5f4d7b1`)

| Path | Movement |
|---|---|
| `app/coplanner/dreamai/` | **DELETED WHOLE** — page and directory |
| `app/coplanner/TabBar.tsx` | tab retired · `gated` enum + filter retired · `useCircleSession` import dropped |
| `app/coplanner/CircleSessionContext.tsx` | flag deleted from `CirclePermissions` · `CircleRole` corrected (F-07.121) |
| `app/coplanner/page.tsx` | the tip · `displayWaNumber` deriving from `waNumberFor('bride')` |
| `app/coplanner/settings/page.tsx` | F-07.121 cured |
| `scripts/tdw07_f0772_circle.proof.mjs` | census amendment · §14 · §15 · eight mutations |

**The apply chain for this ZIP carries a deletion**, disclosed per the apply-verbatim law: `rm -rf app/coplanner/dreamai` runs as its own command after the copy. `cp -r deploy/*` cannot remove a file.

### dream-os (base `bf66909`)

| Path | Movement |
|---|---|
| `src/api/circle/dreamai.js` | **DELETED WHOLE** |
| `src/api/router.js` | `/dreamai` mount deleted · the eleven→nine paragraph · Class A census re-worded |
| `src/lib/circlePermissions.js` | flag deleted · the F-06.85 paragraph re-authored as its own re-read |
| `src/api/circle/messages.js` | the mint-site pointer re-derived (comment only) |
| `src/api/circle/threads.js` | the mint-site pointer re-derived (comment only) |
| `docs/SCHEMA.md` | payload corrected · the retirement recorded |
| `scripts/b07_f0772_circle_auth_bench.js` | §5.4 · §12.8 · §12.12 · §13.13 · §13.14 · §13.22 amended · §13.23 replaced by §14 · six inverses · verdict re-worded |

Same deletion note: `rm -f src/api/circle/dreamai.js` is its own command.

---

## §3 · ELEVEN DOORS BECAME NINE, AND THE DISTINCTION IS ASSERTED

`/dreamai` carried **two** Class A doors. Retiring the mount moves Class A six → **four** and the total eleven → **nine**; Class B is unmoved at five.

**A falling door count is what a regression looks like from a distance, and this is its opposite.** `§14.3` asserts both halves mechanically and separately: every door that existed at `f8cd7de` and still exists is still guarded (`guarded === 2` mounts, asserted by count, not narrated), and the mints and Class B doors still carry no member guard. `§14.1` asserts the deletion itself. The two facts cannot be settled by a tally, and **INVERSE 12** exists precisely to prove it: it takes the guard off a *surviving* door while the count stays right, and the cell reddens.

**Fork C is SUPERSEDED, not contradicted**, and the reasoning is committed at `router.js` rather than only here. It was ruled when the door was unguarded and the deletion hypothetical; its decisive fact — the door outlives the surface — is answered by retiring the door *with* the surface. What ZIP 2 left behind was a door that was guarded, client-less, and undrivable by any cell (requiring the router executes `circleEngine` at import, a W-1 surface). Guarded + client-less + unbenchable is the worst of the three states: nothing would ever notice its guard regressing.

**Record consequence, carried as ruled:** F-07.112's five `circle_thread` mint sites become **four**. `dreamai.js` died with the file, so the collision surface that finding cured got *smaller*. `§14.4` asserts it, and the two prose pointers in `messages.js` and `threads.js` were re-derived — they had named `dreamai.js:93`, which was **already stale at `bf66909`** (that insert sat at `:117`). The private lane is now minted by the WhatsApp lane alone: `brideIndex.js:369` and `brideInbound.js:278/:371`.

**The historical cite is deliberately allowed to survive** in both notes — they record that they *used to* name the deleted file. `§14.4` forbids the present-tense claim and not the memory; a bare `!/dreamai\.js:93/` would have forbidden the estate from remembering its own corrections.

---

## §4 · THE TIP — DERIVED THREE WAYS, ASSERTED BY CELL

The circle member's WhatsApp path to Mira terminates on the **bride lane**, `917011788380`, agreed at three independent homes:

1. `db/migrations/0099_circle_invite_link_fix.sql:108` — `wa_me_link := 'https://wa.me/917011788380?text=' || v_token`. The strongest witness: it *is* her own path in. Applied 2026-07-23, verified from `pg_get_functiondef`.
2. `dream-os src/lib/waNumbers.js` — `BRIDE_WA_NUMBER`, the canonical home.
3. `dreamos-pwa lib/waNumbers.ts:46` — the declared drift twin.

Runtime path: bride `/webhook/meta` on `BRIDE_PHONE_NUMBER_ID` → `processBrideInbound` → the phone match at `brideInbound.js:166-170` → `handleCircleMemberMessage` → `runCircleAgenticTurn` at `brideIndex.js:677`.

**No digits were typed.** The tip imports `waNumberFor('bride')`; `§14.8` reddens on any hardcoded number, `§14.10` asserts the formatter still derives, and **M-23/M-25** prove both non-vacuous. A config change now reddens a cell instead of shipping a wrong number to a member.

**Founder bytes, frozen 「 all, mira 」 + 「 introduce Mira as (bride's name) PA 」**, asserted verbatim at `§14.11` (M-24 reddens on paraphrase):

```
eyebrow:  MIRA
line:     Mira is {bride}'s PA.
body:     Message her on WhatsApp at +91 70117 88380 — she knows the wedding
          and can answer anything about it.
control:  Open WhatsApp
```

The eyebrow is the one byte the chair assembled rather than quoted. Flagged: if it comes back changed it is a one-file re-cut of `app/coplanner/page.tsx`.

**Placement: home, persistent, ONE home** — above the activity panel, deliberately. Activity renders up to ten rows, so a tip beneath it sits below the fold on any busy wedding, and this is the only thing standing where a tab used to be. Not dismissible: a member who dismissed it would have no path back to the only address Mira answers on. `§14.12` asserts the absence of a dismiss or a gate.

**F-07.122's gap is named where it lives**, in `page.tsx`'s own header: recognition keys on `circle_members.invitee_phone`, which is NULLABLE at the witness. The tip ships unconditional because the fixture shows the one active member carries an E.164 number. If a gate is ever needed it is a **derived boolean** on the session payload, never the value — CE-125's minimisation removed phone from that payload with zero readers, and re-adding it to power a convenience would reverse a privacy cure.

---

## §5 · F-07.121 — THE FOLD-IN

The settings screen printed **"Circle"** for a member whose role is `family`. The map at `settings/page.tsx:9-13` was keyed `Partner` / `inner_circle` / `circle` and was **1-of-3** on the lawful values: `Partner` was the right word in the wrong case, `circle` was never in the value-space at all, and `family` — the default every invite takes — was missing. `:19`'s `|| 'Circle'` fallback printed over the miss, silently and plausibly.

**The value-space was derived, never assumed.** The authority is the database's own CHECK constraint (`PUBLIC_SCHEMA.md:1094-1095`): `partner | family | inner_circle`, three values, all lowercase. Corroborated at five independent sites, all agreeing: `0099:50`, `join.js:128`, `join.js:300`, `couple/circle.js:28`, `brideEngine.js:1787`.

**THE SWEEP, as ordered — a class with two instances earned a census.** Both repos walked. The only other role map in the estate is the **bride's own** at `sanctuary/page.tsx:2522`, and **hers is correct** — keyed on all three lawful lowercase values and driven by the same three at `:2736`. The estate got this right once, one surface over, and the member's copy drifted. That contrast is the discriminating fact, exactly as `circle_activity`'s correct pair was at CE-126. **No third copy exists**; `§15.6` asserts exactly two and reddens if a third appears.

**No unvetoed byte reached a screen.** The labels are lifted verbatim from the bride's live, already-shipped map, so the member and the bride now read the same word for the same row.

**The fallback is now honest:** `|| session.role`. If the CHECK constraint ever grows a fourth value, printing a confident wrong label is worse than printing the raw one. Ugly, true, self-revealing. `§15.3` asserts it; **M-27** reddens on the old fallback's return.

`CircleRole`'s type carried the same impossible space and was corrected in the same act — one drift, not two (`§15.4`, M-28).

---

## §6 · FLOOR, RE-DERIVED AT THE EXECUTOR'S HAND ON REBUILT TREES

**dream-os** (npm ci, **build-engine-first**, exit 0):

- `b07_f0772_circle_auth_bench` **149 → 159** (labeled) · both-ways **152/159 at the uncured tree, SEVEN RED**
- `b07_auth_crossover_bench` **33** · `selftest` **386** (`--rig-selftest`, per the chair's correction — `--selftest` aborts on the absent API key)
- `f0784 59 · p1 75 PAIRED · p2 48 · p3 55 · p4a_ig 110 · p4b_body 76 · probe 22 · slice1 19 · p5 136 · p6 29 · f0776 64 · f0791 38 · f0789 19 · f0774 20/20` — byte-stable whole
- **The honest sweep: 98 scripts, SIX non-zero** — `f0555` and `meter` (the two known-reds by tally), `b5b_movementb_bench` (F-07.114's crashing bench, uncured), and three credential-gated live rigs (`b06_gauntlet`, `b5_wa_door_smoke`, `test-shape`) that refuse loudly by design and are not benches. Byte-identical to CE-128's statement.

**dreamos-pwa** (npm ci):

- `tdw07_f0772_circle` **102 → 127** · **27/27 mutations RED across process boundaries, all restored byte-identical** · both-ways **84/100 at the uncured tree, SIXTEEN RED** (cells-only)
- **tsc ZERO true-exit on cleared `.next`**
- CE-128's floor unmoved whole: `p1 43 · p2 48 · p3 117 · p4a 69 · slice1 30 · probe 33 · body 133 · f0760 82 · f06133 41 · p6_fold 68 · auth_crossover 46 · f0766 28 · f0770 104 · m3_chip GREEN · f0790 37 · f0784 34 · f0789 30 · f0774 35/35`

**F-07.112's four discriminators and ZIP 2's enforcement asserted un-regressed by cell** (`§12.10`, `§12.11`, `§13.24`–`§13.28`, `§14.3`).

### The count movements, stated apart so neither hides in the other

- **pwa:** 102 → **101** by the labeled census removal (`dreamai/page.tsx` leaves `COPLANNER_CALLERS`; `§2.1` is a per-file loop) → **+18 cells** (§14 twelve, §15 six) → **+8 mutations** → **127**. `§2.2`'s ordinal re-worded eighth → seventh.
- **dream-os:** 149 → **159**: five new §14 cells + six new inverses, less `§13.23` which was replaced rather than kept.

---

## §7 · WHAT THE BENCHES DO NOT PROVE, NAMED

**Four of the six new dream-os inverses pass VACUOUSLY at the uncured tree.** `mutateSrc` asserts that the cell reddens under mutation; where the cell already reds without it, the inverse "passes" for the wrong reason — CE-125's third fault class. The non-vacuity that matters is proven **at the cured tree**, where each inverse genuinely flips a green cell red, and the honest signal at the uncured tree is the cure-cells themselves (`§14.1`–`§14.4`, `§13.14`). Disclosed rather than counted as seven independent proofs.

**Three pwa cells are GUARDS, not cure-cells**, and are green at the uncured tree by design: `§14.9` (the `waNumbers` pair — a future-drift watch), `§15.5` (the bride's shipped labels), `§15.6` (the two-map census).

**`§14.5` is a guard too** — `brideIndex.js` is untouched by this delivery, so it is green both ways. It is the arc's non-regression claim and its live proof is the founder's step 4, not a cell. INVERSE 16 proves it is not vacuous.

**Nothing drives the retired handlers, because there are none.** The narrowing `§12.8` and `§13.23` used to disclose is gone with its subject rather than inherited.

---

## §8 · ROLLBACK, NAMED BEFORE THE WALK

Both movements are pure deletions plus one additive tip and one label correction. Revert is `git revert` of the two commits **in reverse order — dream-os first, then pwa** (so the door is back before the page that calls it). No DDL, no data motion, nothing to undo in production, no environment variable to restore.

---

## §9 · THE DERIVATION ITEM — REPORTED, NOT CURED

**Where the session's name comes from:** `src/api/middleware/requireCircleMemberAuth.js:137` —

```
name: userRow.name || member.invitee_name || null
```

`public.users.name` **wins** over `circle_members.invitee_name`. The banked fixture gives `invitee_name = 'Mehek'`, so the `users` row bound to that session must carry `name = 'Droy'`, and it takes precedence on the settings screen.

**That is the code path and it is all I will assert.** Why that `users` row is named Droy is data, not code. A name matching a vendor account in the row-06 record is a coincidence I can see and cannot derive, and naming a mechanism I have not proven is the CE-40 α class. No cure proposed, none taken, no bytes moved. It is settled by a founder SELECT on `public.users` for the bound `user_id`, not by reasoning.

Worth one line for the ruling: if `users.name` is the wrong source for a circle member's own display name — she never typed it, and the bride *did* type `invitee_name` when inviting her — that is a product question adjacent to F-07.121 and not this sitting's.

---

## §10 · FINDINGS THIS SITTING

- **F-07.115 — CLOSED BY DELETION.** The lock was right; the feature did not belong there.
- **F-07.121 — CURED.** F-07.110's twin, one directory over; census closed at two maps that now agree.
- **F-07.122 — FILED, not cured.** `invitee_phone` is nullable; the tip is unconditional by ruling and the gap is named in `page.tsx`'s own header, where the next reader of the tip will meet it.
- **F-07.120 — FILED** (chair-minted from the read-first): `circle_last_path` is write-only. Bytes left as found. Its useful half is recorded: **no route-restore hazard** — a returning member cannot be dropped onto the deleted page.
- **Executor disclosure:** the two prose pointers to `dreamai.js:93` were already stale at `bf66909` before this delivery touched them. Not a defect of this arc; recorded because the next reader deserves to know the line number moved once before it died.
