# repo: dream-os @ a243444 · TDW_14 · D-4a — DELEGATION: THE PLANE AND THE DOORS

**Seat:** LE · **Rulings:** CE-34 R-D4.1–.6 · sheet ratified whole 2026-08-14 (「 all stand 」) · both founder questions answered — **a member may mark her own item done**, and **an assignment does not notify**.
**dream-os only. The two surfaces are D-4b. W-1 shut.**

---

## 1 · WHY THIS IS D-4a

The sheet's bytes are all **surface** copy — the assign affordance, the picker head, the tray label. **The server half carries none of them**, so it ships first and complete; D-4b spends the sheet. Same split as D-3a/D-3b, same reason.

| Path | State |
|---|---|
| `db/migrations/0125_event_delegation.sql` | **NEW** — one column, in order |
| `src/api/couple/events.js` | the PATCH allowlist gains the seat; both projections widened |
| `src/api/circle/assigned.js` | **NEW** — the member's Class B door |
| `src/api/router.js` | mounted **bare** beside polls |
| `scripts/b14_d4_delegation_bench.js` | **NEW** — 40 cells, 10 mutations |
| `scripts/b14_d1_visibility_bench.js` | §6.1 moved **by charter**, 8 → 9 |

---

## 2 · R-D4.2b — DISCHARGED, and it took three passes

**Claim: the new column cannot leak a couple row into a vendor read.**

The method is the finding. A 6-line grep window called four vendor files "partially scoped" — **too narrow**. Widening to 14 caught **comment prose** mentioning `public.events` — comment-blindness again. Comment-stripped and plane-aware: **70 accesses to `public.events`; exactly two are scoped by neither key, and both are `.insert(...)` whose rows carry `vendor_id` in the payload.** **Zero unscoped reads exist.** `occupancy`, `calendarSignals`, `crewSnapshot` are fully scoped on every access.

**And a fourth thing fell out: `events` is TWO TABLES.** `engine.events` (8 columns, keyed `agent_id`) is a different table on a different plane from `public.events` (17 columns). Four "unscoped" hits are engine-plane and touch nothing here. **A census that greps `from('events')` without splitting planes counts two tables as one** and would have reported a false leak.

## 3 · SEAT, NOT PERSON — and deliberately opposite the vote

`ON DELETE SET NULL`, keyed on `circle_members.id`. **A vote is a person's opinion and survives her membership; a delegation is a responsibility held by a seat.** When the bride removes someone, that responsibility returns to her **visibly** rather than lingering on a person no longer in the room. A CASCADE would have deleted **her event** — catastrophic, and §6.2 plus §7.M10 exist for exactly that.

**The FK checks existence, never ownership.** It would accept any `circle_members.id`, including another couple's seat, so the door verifies the seat is **hers and active** before the write (§1.3, §1.4). §7.M1 and §7.M2 drop each predicate and both bite.

## 4 · THE MEMBER'S DOOR

Class B, mounted bare, polls' shape exactly — **the bride reaches it too, and a Class A guard would refuse her on her own journey.** She is admitted and simply holds nothing, because she is not a `circle_members` row (§2.3).

**Narrower than the couple plane, deliberately:** she may mark `done` and `upcoming`; she may **not** cancel. **Cancelling is a decision about the wedding, not about the doing.**

**Her payload carries no vendor field, no money, no lead** (§4.1) — payload-level, never CSS.

**One declaration worth the chair's eye:** the users.id → seat hop lives in this door, not the gate, because it is the first door where the seat is the subject. **If a second door ever needs it, it moves to the gate** — exactly as R-D3.3 moved the bride's users.id there when polls made a second caller need it. The file says so and instructs its own re-read.

## 5 · PROOF

**40/40 cured · 37 cells RED at the pre-D-4 tree · 10 mutations, all sha256-restored.**
**Floor: 21 — DELTA ZERO.** Build rc=0, `node --check` clean.

**§6.1 of `b14_d1` moved by charter, 8 → 9** — `assigned.js` joins the member-route family, so §6.2's money-absence claim now covers it. **D-4's read-first declared this move before a byte was written**, which is R-33.1 working in the direction it was minted for.

## 6 · FIVE ERRORS OF MINE, ALL CAUGHT IN-BAND

1. **I reported a build failure I caused by not installing.** `npm ci` was never run in the fresh clone, so `tsc` resolved to a stray global. **And my own command lied about it:** `npm run build 2>&1 | tail -2 && echo "build ok"` measures `tail`'s exit, not tsc's — the same class as the unreachable STOP, in a diagnostic this time. Re-measured by exit code: **origin green, my tree green after install.**
2. **The plane implemented `maybeSingle` but not `single`.** The couple plane's one writer terminates with `.single()` (`coupleEventWrite.js:65`), so every §1 cell drove the door and read `undefined`. **A fake missing a terminal the production path uses does not test that path.**
3. **The harness sent a Bearer to a door that reads `req.coupleUser`.** Two lanes, two credential shapes, not interchangeable.
4. **The fixture used `id: 'e1'` against a door guarded by `UUID_RE`** — every §1 cell died at the front gate while the code behind it was correct.
5. **`§6.2` read the rule's own prose, twice.** First the `--` comments; then, after stripping those, the **`COMMENT ON COLUMN` body — a SQL string literal, not a comment**, which survives any `--` filter. §7.M10 flipped the real statement to CASCADE and the assertion went on matching the sentence describing it. The cell now reads the `ALTER TABLE` statement alone. **And the mutation's own probe had the same blindness** — a probe must mirror the cell it names.

**§7.M1 was decorative for a different reason worth keeping:** `OTHER_SEAT` did not exist in the plane at all, so dropping the couple predicate changed nothing. **A fake that makes the forbidden thing NOT EXIST cannot prove the predicate that forbids it.**

## 7 · WHAT D-4b INHERITS

Three doors proven: `PATCH /couple/events/:eventId` with `assigned_circle_member_id` · `GET /frost/circle/assigned/:brideId` · `PATCH /frost/circle/assigned/:eventId/state`. The sheet's seven bytes are unspent. **`tdw09_frost_parity`'s control census will move** when the assign affordance lands on the events bloom — declared now, per R-33.1.

**Sequencing beyond this delivery is the founder's.**
