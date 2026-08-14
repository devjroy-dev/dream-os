# repo: BOTH · TDW_14 · D-4c — THE REMOVAL CLEARS THE PLANE

**Seat:** LE (re-seated after F-14.14) · **Rulings:** CE-33 D-4c charter ·
**R-33.6** (new) · R-33.7 · R-33.8 · R-33.3 · R-33.4 · LD-8
**Findings cured:** F-14.12 (dream-os) · F-14.13 (pwa)
**Bases:** `dream-os 6c84830` · `dreamos-pwa caeb76e` — fresh sibling-full
clones, fetch-first, both clean, both last-authored by the founder.

---

## 1 · WHAT SHIPPED

| Path | Repo | State |
|---|---|---|
| `src/api/couple/circle.js` | dream-os | the removal handler clears the plane, first |
| `scripts/b14_d4_delegation_bench.js` | dream-os | **§8**, three mutations, plane extended additively |
| `components/frost/blooms/events.tsx` | pwa | **F-14.13** — the comment states the mechanism that runs |

`db/migrations/0125_event_delegation.sql` is **NOT TOUCHED**. LD-8 is
append-only; a migration rewritten after it has been applied is a lie about what
the database was told. The truth homes in the handler comment, the bench, and
this document.

---

## 2 · F-14.12 — THE RULING THAT HAD NEVER RUN

0125 gave the column `ON DELETE SET NULL` and stated the ruling in its own
header: removal returns the task to the bride visibly, never a ghost. **That
constraint has never fired in production and could not.** Nothing in the estate
hard-deletes a `circle_members` row — `DELETE /couple/circle/member/:memberId`
is a status flip and always has been.

D-4a's bench read the delete rule out of `pg_constraint` and passed. **The rule
was really there; no live path reached it.**

**It surfaced on a walk, not on a bench.** The bride removed her only member, the
name vanished from the events bloom, and the screen looked exactly like the
ruling working. It was the PWA's `holderName` fallback — which resolves a seat
against ACTIVE members only — doing the schema's job. One SELECT behind the glass
showed the column still holding the removed seat's uuid.

### THE INVARIANT, and why it is stated as one

> **The handler never exits with `status='removed'` while any events row still
> holds that member's id.**

Three things follow from that phrasing rather than from "clear the column too":

1. **Clear first, flip second.** There is no transaction around the two writes.
   Clearing first makes the worst reachable interleaving *a task in the pool
   while its holder is briefly still a member* — visible, harmless,
   self-correcting. Flipping first leaves the opposite: a live pointer at
   somebody already gone, which is the ghost the ruling forbids.
2. **A failed clear refuses the removal whole** — 500, member stays active.
   Half-done is worse than not-done, and a retry is safe because both writes are
   idempotent.
3. **The clear runs before the already-removed short-circuit.** That early
   return is also an exit with `status='removed'`, so the invariant binds it —
   and that is what makes the handler **self-healing** for rows stranded by the
   old code. Production's one specimen was repaired by founder SQL on
   2026-08-14; this keeps the count at zero without a cron.

**The soft delete stays** (`joined_at`, the invite token, and every
`circle_activity` attribution live on that row) and **the FK stays** as
belt-and-braces for a genuine hard delete.

---

## 3 · R-33.6 AND THE BENCH THAT OBEYS IT

> *A rule read from the catalogue proves the rule EXISTS, never that any live
> path TAKES it. A behavioural ruling's cell asserts the PATH; the constraint is
> belt-and-braces.*

§6 still reads 0125's delete rule and §7.M10 still bites it. **Both were green
over a path nothing takes.** So §8 **drives the door** instead of reading a
schema:

| Cell | Claim |
|---|---|
| §8.1 | the CLEAR lives in the removal handler, scoped by BOTH keys (source, bounded) |
| §8.2 | the door DRIVEN — removal nulls her delegations, both predicates witnessed |
| §8.3 | **the ordering** — writes land `events` → `circle_members`, never reversed |
| §8.4 | a failed clear refuses the removal whole; no status write happens |
| §8.5 | the already-removed exit owes the clear too — self-healing |
| §8.6 | the soft delete stays; no hard delete anywhere in the door |
| §8.7 | 0125 untouched, `ON DELETE SET NULL` intact |

**The fake plane was extended additively** — write capture in the awaited
(terminal-less) branch, `status`/`invitee_name` on the seat row, and an opt-in
forced clear failure. The removal door's two writes are awaited directly, so they
land in `then` and not in `maybeSingle`; **until D-4c that branch recorded
nothing, which is why an ordering claim could not be made at all.** No existing
cell moves: the resolved shapes are unchanged.

---

## 4 · BOTH-WAYS, THE ARITHMETIC

```
CURED  (6c84830 + this delivery)   50 passed, 0 failed
                                   13 mutations, 5 files, all sha256-restored
BASE   (6c84830, rebuilt bench)    41 passed, 9 failed — NINE NAMED REDS:
         §8.1 §8.2 §8.3 §8.4 §8.5
         §7.M11 §7.M12 §7.M13
         §7.M11 (the ledger count: 10 → 13)
```

**40 → 50 cells, 10 → 13 mutations.** The nine reds are named, not a crash — see
§5, error 2.

---

## 5 · MY ERRORS, THREE, ALL CAUGHT IN-BAND

**1 · §8.1 was unbounded, and its own mutation caught it.** It asserted
`.eq('couple_id', couple_id)` anywhere in the handler — and **the status flip
twenty lines down carries that same predicate**, so §7.M12 (which strips the
predicate off the clear) went green and reported itself decorative. Now bound to
the clear statement alone, and M12's probe re-derives that same slice, because
**a probe must mirror the cell it names** (§7.M10's tuition, paid again).

**This is the exact twin of the D-4b bench's §3.1** — where a column assertion
read `updateEvent`'s patch type while claiming `CoupleEvent`, found by its own
M6, one delivery apart. Same law (R-33.3), same discovery mechanism, same arc.

**2 · The uncured run crashed instead of reporting.** The handler and clear
derivations were written at module scope with bare asserts; at `6c84830` the
clear does not exist, so the bench threw before its first cell and exited 1 —
which *looks* like the red the both-ways leg wants and is not, because a typo
would exit 1 identically. **A crash is not a red.** Both are now functions called
inside cells. I wrote this same warning into the D-4b bench's header and then
made the mistake here; it is left on the record because writing a lesson down is
not the same as having learnt it.

**3 · F-14.14 — I corrupted my own workspace and reported rather than shipped.**
An unintended `wip` commit (`8f79b3a`) via `git add -A` on a floor-dirtied tree
swallowed the cure **and staged tracked `scripts/out/` artifacts as deletions**.
A ZIP cut from that tree could have carried ten tracked deletions into the
founder's push. **The workspace was abandoned whole**; nothing was copied or
cherry-picked from it, and this delivery is a replay from the derived record,
re-measured from scratch. **R-33.7** (the executor's git is read-only) and
**R-33.8** (a floor runs only on a clean tree) were minted on it.

---

## 6 · THE FLOOR, AND A CHARACTERISATION WORTH KEEPING

```
dream-os  BASE   21 RED, by name    (pristine clone)
dream-os  CURED  21 RED, by name    → FLOOR = NAMED BASE, no delta
pwa       BASE    5 RED             → FLOOR = NAMED BASE, no delta (clean clone)
```

**THE FIRST FLOOR RUN AFTER A FRESH `npm ci` IS NOT A FLOOR.** Run 1 on a
pristine clone returned **35**; runs 2 and 3 returned **21**, identical to the
charter's set by name. Fourteen benches red once and green on every subsequent
run, and all fourteen are green standalone — a cold-cache artifact, not a defect.
This is *also* what made my earlier "35 vs 21 delta" look like corruption damage
when it was a separate thing entirely. **Under R-33.8, dream-os's hand-rolled
loop must be warmed before it is read, and compared BY NAME — a count match is
not a set match.** This belongs in the chartered-next floor-runner micro.

**pwa's floor is run AFTER the commit, not before.** `tdw_f0774_vacuity_probe`
stops on a dirty tree by design, and R-33.7 forbids this seat committing — so the
executor structurally cannot produce a clean pwa floor. Derived, not argued:
probe `rc=0` on a clean clone at `caeb76e`, `rc=1` with the delivery
uncommitted. The verify chain places the floor line after the git block.

---

## 7 · F-14.13 — THE COMMENT THAT OVERCLAIMED

The pwa half is one comment. It used to say the column is `ON DELETE SET NULL`
"so a removed member's task returns to the pool" — **the constraint was real and
had never fired**, and the fallback was the only thing clearing the name off the
glass. A comment that reads as an explanation and is actually a second, wrong
claim about the wire is the worst shape a comment can take.

It now states what runs: **the handler clears** · **the FK is belt-and-braces**
· **the fallback renders the pool truthfully because the column IS null**, and
still earns its place for the window between a removal and this screen's next
read.

Gates: `tsc rc=0` · `tdw14_d4b_delegation` GREEN · `tdw09_frost_parity` GREEN
(a comment moves no census) · `tdw13_d4_extraction` GREEN (6a is comment-blind
and the new prose names no colour — the trap I fell into at D-4b, avoided).

---

## 8 · AFTER LANDING — the one walk step that closes P5

On the bride's handset, **`9625759924`**, with a member re-invited:

1. Assign a day to her.
2. Remove her from the Circle.
3. **The column clears — for the right reason this time.** The task is in the
   pool, the event survives.
4. Re-invite her: `invite_circle_member` **inserts a new row** (0099:91), so she
   lands a **NEW EMPTY SEAT** and the old delegation cannot resurrect.

Behind it, one SELECT should return zero rows:

```sql
SELECT count(*) AS stale_assignments
  FROM public.events e
  JOIN public.circle_members cm ON cm.id = e.assigned_circle_member_id
 WHERE cm.status = 'removed' AND e.deleted_at IS NULL;
```

That witness closes C-5 and closes P5.

---

## 9 · CARRIED FORWARD

- **CHARTERED-NEXT: the dream-os floor runner.** `.gitignore scripts/out/` +
  untracking the artifacts (their own deletion step, never the apply chain) + a
  `run-floor.sh` with clean-tree-first ordering + the committed 21-base by name.
  §6's cold-run characterisation above is its read-first's second citation.
- `tdw13_d4_extraction` **6a is comment-blind** — reported at D-4b, still unruled.
- **F-13.12** — `COPLANNER_CALLERS` is a census by hand where a walk belongs.
- **G-1's remaining three** — create, delete, edit.

**Sequencing beyond this delivery is the founder's.**
