# repo: dream-os @ c4773a6 · TDW_14 · D-3a — POLLS: THE PLANE AND THE DOORS

**Seat:** LE · **Rulings:** CE-33 R-D3.1–.8.
**Tips at build, fetch-first, SIBLING-FULL:** dream-os `c4773a6` · dreamos-pwa `403faf9`.
**dream-os only. Zero prompt bytes — W-1 shut.**

---

## 1 · WHY THIS IS D-3a AND NOT D-3

**The two web surfaces are HELD, and the reason is your own ruling.** CE-33 says the copy veto sheet comes *"simplified with a recommendation per line, zero bytes drafted before it."* The poll surfaces are made almost entirely of the strings on that sheet — the create affordance, the vote states, the tally label, the closed/tie lines. Building them now would mean drafting those bytes inside a delivery, which is the exact thing the ruling forbids and the thing I held on in D-2.

So D-3a is everything the surfaces will stand on and **carries no user-facing copy**: the plane, the doors, the gate cure, the bench. **The veto sheet rides this message.** D-3b is the two surfaces, in the delivery after your word.

---

## 2 · WHAT SHIPPED

| Path | State |
|---|---|
| `db/migrations/0124_circle_polls.sql` | **NEW** — `circle_polls` + `circle_poll_votes` |
| `src/api/circle/polls.js` | **NEW** — Class B, three doors |
| `src/api/router.js` | polls mounted **bare** beside its three siblings |
| `src/lib/resolveCoupleIfPresent.js` | the gate returns the `usersId` it already computed |
| `src/lib/resolveCircleIdentityIfPresent.js` | arm 2 passes it through |
| `scripts/b14_d3_polls_bench.js` | **NEW** — 49 cells, 10 mutations |
| `scripts/b14_d1_visibility_bench.js` | two cells moved **by charter** |
| `scripts/b07_auth_crossover_bench.js` | four cells moved **by charter** |
| `docs/specs/TDW_BRIDE_TRACK_AMENDMENT_ONE.md` | §2.14 **(v)** — the C-9 strike |

---

## 3 · THE THREE RULINGS THAT SHAPED THE CODE

**R-D3.1 — Class B.** The spec contradicts itself inside one sentence: *"member auth (C-9 pattern)"* is Class A and would 403 the bride out of the poll the same sentence says she votes in. Polls mount bare on the resolver. **§2.1 drives her through and votes; §8.M9 puts the Class A guard back and proves the cell isn't decorative** — the refusal the spec would have shipped, mechanised. Amendment One §2.14 (v) records the strike.

**R-D3.2 — no sentinel anywhere.** `couples.user_id uuid NOT NULL` means the bride has a `users.id` exactly as every member does, so `voter_user_id uuid` answers "who voted" for everybody and **`PRIMARY KEY (poll_id, voter_user_id)` makes "one vote per participant" a Postgres constraint rather than a handler's opinion.** The spec's `member_ref text /*'bride'|member_id*/` would have reopened the text-discriminator scar this lane already carries in `dm:` and `counterparty_user_id`. **§3.5 asserts no `'bride'` literal and no `member_ref` exists in either the router or the migration.**

**R-D3.4 — the fourth consumer, and what it does NOT gate.** A poll is shared by creation: question, options and tallies render **whole** to every active member. Gating options makes a ballot half the circle cannot answer, and **§8.M7 mutates exactly that and reds.** What *is* gated is what a poll **joins**: `linked_event_id` reaches into the journey and an event carries `vendor_id`, so the linked event serves `{id, title, event_date}` to everyone and its `vendor_id` only when the resolved block says `can_see_vendors`. The bride has no block and sees her own journey whole (§5.1/§5.2/§5.3). **No new permission key was invented** — the key set is unruled and UNRULED-ARM binds; §5.6 reds if a name appears that isn't one of the four.

---

## 4 · R-D3.3 — CURED AT THE GATE, AND IT COST NO NEW QUERY

`resolveUsersId` already ran on **every** arm-2 resolution and its answer was discarded one line later. The gate now returns it; arm 2 passes it through. **No new query, no second resolution, no handler-side `couples` hop** — §1.6 asserts `polls.js` contains neither `from('couples')` nor `resolveUsersId`, so the second implementation cannot creep back.

**The widening is additive and shape-consistent:** every return branch carries all three keys (§1.2), so no caller has to ask whether a field is absent or merely null. `usersId` is null wherever the couple is null and never the reverse — the value only exists once a credential resolved to a real public user.

---

## 5 · MY MISS — the census I scoped wrong, owned

**I declared ONE cell moving by charter in the read-first. Three moved — and a fourth error rode the SQL itself.**

- `b14_d1` **§5.1** — declared. Consumers 3 → 4.
- `b14_d1` **§6.1** — **not declared.** The circle router family 7 → 8. Two cells read that radius, not one.
- `b07_auth_crossover` **§2.1 · §2.2 · §2.6 · INVERSE 3** — **not declared.** They pin `resolveCoupleIfPresent`'s return with `deepStrictEqual`, so an additive third key reds them.

**The mechanism of the miss is precise and worth more than the miss.** I ran the reader census for the gate widening as `grep -rn "resolveCoupleIfPresent" src/` — **scoped to source.** Benches live in `scripts/`. Every *caller* was found; every *cell that pins the shape* was never looked for. **A return-shape change has two reader censuses, not one**, and the floor found the second because the read-first didn't.

**None of the moved cells was weakened.** The `deepStrictEqual`s still assert the whole shape — a cell that checked only the keys it cared about would let a fourth key appear unnoticed — so the expectations **grew** rather than loosened, and `INVERSE 3`'s mutation target was re-aimed at the live line with its substance unchanged. The reasoning is written beside each.

**A third, caught by the founder's own paste:** VERIFY 2's `EXPECT` line shipped reading *"8 ROWS: 2 PK, 5 FK, 1 CHECK"*. **There are SIX foreign keys** — `couple_id`, `thread_id`, `linked_event_id`, `created_by_user_id` on `circle_polls`, plus `poll_id` and `voter_user_id` on `circle_poll_votes`. The DDL was right; the prediction was short by one, and it went to the founder as the number he was to check a production result against. **That is the dangerous direction:** a wrong expectation makes a correct migration look like a failure, and would just as readily wave a real one through. *Assert the artifact, never a predicted count* is standing law, and a founder-facing `EXPECT` line is the one place a predicted count has to live — so **§7.7 now counts the DDL's own `REFERENCES` / `PRIMARY KEY` / `CHECK` declarations and reds if the file's stated expectation disagrees**, non-vacuity proven by restoring the exact wrong line (it reds) and correcting it (it greens). The migration header records the error rather than quietly showing the fixed number.

**A fourth, and it is a DELIVERY defect not a code one:** two different D-3a archives were presented under **one filename**. The founder downloaded the first — cut before his verify results came back — so his tree ran the build whose migration header still read *unapplied* and whose `EXPECT` line still carried the wrong count. **The bench count is what caught it: 47 where 48 was expected.** A `# repo:` head-guard checks which repo an archive lands in; nothing checked which *version* of an archive it is, and a filename is not a version. **Two cures:** the archive is now cut under a distinct name whenever its contents change, and **§7.8** reds if a migration's `Applied:` line still carries its unfilled placeholder — so a build that predates its own verify results cannot be committed silently. Non-vacuity proven against the real v1 placeholder.

**A second self-catch, smaller:** §7.4 first searched the raw migration for a sentence that **wraps across two comment lines**, so the `--` and the newline sat inside the phrase and it could never match. It reddened against a file that says exactly what it was asked to say. The cell now normalises comment markers and whitespace: the claim is about the sentence, not where the author broke the line.

---

## 6 · PROOF

**Both-ways.** Cured **49/49, exit 0**. At the uncured tree: **19 cells RED**, every D-3 cell and only D-3 cells.

**10 mutations, all on production code**, restores sha256-verified. The ones that matter: **§8.M2** hard-nulls arm 2's identity and the bride can no longer vote · **§8.M8** upserts on `poll_id` alone and one participant gets two votes · **§8.M9** remounts behind the Class A guard · **§8.M3** drops the couple scope and a cross-circle vote lands · **§8.M4** trusts caller-supplied option ids and two options share one, silently merging a tally.

**Floors:** dream-os **21 non-zero exits — DELTA ZERO** against the adopted seventeen plus the four credential-blocked. Recorded honestly: the first full run read **22**, with `b07_auth_crossover_bench` as a real delta of mine; it is back at **33/33** after §5's cells moved. `b14_d1` **62/62**, `b07_f0772` **158/159** (pinned §12.14). Build exit 0, `node --check` clean. **pwa untouched** — zero pwa bytes, so its floor stands at its named base.

---

## 7 · WHAT THE FOUNDER DOES — SQL FIRST

**STEP 1 — Supabase, five blocks, each pasted ALONE.** Statements 1–3, then verify blocks 1–4. Expected: **13 column rows** (9 + 4) · **8 constraints** (2 PK · 5 FK · 1 CHECK, the CHECK carrying `jsonb_array_length(options) BETWEEN 2 AND 4` and the votes PK reading `(poll_id, voter_user_id)`) · **4 indexes** · **polls 0, votes 0, circle_members 14**. Paste all four result sets back.

**STEP 2 — the ZIP. STEP 3 — verify. STEP 4 — git.** **No file to open** — the apply date is filled by me from your pasted results, per 0098's tuition.

**No dashboard acts, no env var.** The doors are live on apply but **nothing calls them until D-3b ships the surfaces.**

---

## 8 · WHAT D-3b INHERITS

- **Three doors, driven and proven**: `POST /frost/circle/polls` · `POST /frost/circle/polls/:pollId/vote` · `GET /frost/circle/polls/:brideId`. `:brideId` is not read — the proven identity wins.
- **The payload shape is settled**: options carry their own `votes`, plus `total_votes`, `my_vote` (viewer-relative), `closed`, `linked_event`.
- **Two surfaces, no third** (R-D3.5): the circle bloom and a polls strip on the coplanner threads index. Refresh **piggybacks the existing 10s interval** at `circle.tsx:92` — one home applies to timers too.
- **The walk card carries D-1's muse-switch witness** as its rider, per CE-33.

**Sequencing beyond this delivery is the founder's.**
