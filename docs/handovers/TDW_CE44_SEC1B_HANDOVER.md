# TDW_CE44_SEC1B_HANDOVER — SEC-1 Part B: `0170` on the ladder, and the cell that keeps it there

**Seat:** LCV-4, CE-44. **Sitting:** 21 September 2026 IST.
**Cut on:** dream-os `9aacf33b0ce33fa65799b775e3b2554d12d503ce` · dreamos-pwa `320ad7e39f7e70e0fb4be6b37b84b4299a3c8307`.
Both tips derived at origin by fresh clone at the opening of the sitting and again at the cut.

> **THIS DELIVERY CHANGES NOTHING IN PRODUCTION.** `0170` was run by the founder on 20 September 2026
> and is live. Filing it into `db/migrations/` makes the tree tell the truth about what ran; it is
> not a migration anyone runs again. Nothing in this cut touches the database.
>
> **THE LADDER'S TRUE TIP IS NOW `0170`** and the directory says so. **THE NEXT FREE NUMBER IS `0171`.**

---

## 1 · WHAT SHIPPED

**`db/migrations/0170_public_schema_lockdown.sql`**, copied byte for byte from
`docs/db/queries/0170_public_schema_lockdown.AS-RUN.sql`. Not re-authored, not tidied, not
renumbered. Both copies hash to SEC-1's pin,
`b3e0c972b15d00a6154435b4fa0e6e0e8d319230d068fae64ea0756cf9307ca6`, and `b91` §3 pins all three
facts: each file against the hash, and the two files against each other. The AS-RUN file stays where
it is. Two copies with one hash is deliberate: the record of what ran and the rung on the ladder are
different jobs, and the cell is what stops them drifting.

**`scripts/lib/rls_ladder_check.js`**, the rule in one home. It lives under `scripts/lib/` because
the floor's set is `ls scripts/*.js`, top level only, so a helper there is never run as a bench for
want of a verdict it does not have. That is E-1's lesson, recorded in `run-floor.sh`'s own exclusion
of `_noop_middleware.js`.

**`scripts/b91_rls_ladder_bench.js`**, the floor cell. 53 cells, all green at this tip. `b91` is the
next free bench number in this repo; `b90` was the highest present (R-40.86, numbers are per repo).

**`scripts/floor-manifest-ce44-sec1b.txt`**, the packet's own manifest.

**This file.**

Nothing else moved. `scripts/floor-base.txt` is untouched, because nothing joins or leaves the red
set: see §4.

## 2 · THE LAW, AND THE BOUNDARY THAT MAKES IT BUILDABLE

The law is the CE-44 SEC-1 block in `docs/TDW_BUILD_PROTOCOL.md`: every migration that creates a
table in schema `public` enables row level security on it in the same transaction, as `0169` did.

**Of the 153 numbered `.sql` files on the ladder, 61 create a table and exactly one of them, `0169`,
enables row level security.** Sixty files predate the law. So the whole design of this cell is its
boundary, and a cell without one would have reddened on sixty rungs and been deleted inside a week.

**The boundary is `0170`, ruled by the chair, and it is fixed history rather than a count (C-44.7).**
The law entered the protocol on 20 September 2026, at which moment the committed ladder's tail was
`0169`; `0170` is the first rung allocated at or after the law. The constant `170` is a literal in
the checker with that sentence beside it, and `b91` §0.3 asserts it is a literal. It is never derived
from the directory, because a boundary that read the tree to decide its own scope would slide forward
every time the ladder grew, which is exactly the shape C-44.7 forbids.

**`0169` is evidence, not scope.** It complies and it is the law's named specimen. It sits below the
boundary on purpose, so that the boundary names the law's date rather than the last file that
happened to comply.

## 3 · WHAT THE CELL JUDGES, AND THE ONE THING IT REFUSES TO JUDGE

A bare table name is `public`. That is derived and not assumed: at `9aacf33` the ladder holds 97
`CREATE TABLE` statements, 42 of them `if not exists <bare>`, 40 `if not exists public.`, 15 `<bare>`;
no file sets `search_path`; and no engine table is created in this ladder.

In scope: `IF NOT EXISTS`, quoted identifiers, any case, `UNLOGGED` tables, and `CREATE TABLE ... AS`.
Cleared by `ALTER TABLE`, `ALTER TABLE ONLY`, `ALTER TABLE IF EXISTS` and the two together.
Out of scope: a name qualified to any schema but `public`, because `engine` is a separate plane with
its own witness and its own grants; `TEMP` and `TEMPORARY` tables, which live in a per-session schema
no other role can address; and unnumbered entries, which are not rungs.

**A table created and DROPPED in the same file needs no line. This is a ruling, not an oversight.**
The ladder is pasted into the editor one file at a time, DDL in Postgres is transactional, and a
table that does not survive its own file was never visible to another session. It is pinned as a
fixture (`b91` §7.13) and its exclusion is mutated (§8.4), so the day someone disagrees the
disagreement is with a named decision.

**WHAT IT DOES NOT YET JUDGE, AND IT IS OPEN: F-44.86.** A file that enables row level security on
its new table and then DISABLES it further down is silent. The cell asks only whether the file ever
says the words; it does not read the LAST statement about that table. The law exists to catch
forgetting and nobody forgets their way into a disable, so this does not block the cut. But the
cell's claim is *this table leaves the file closed*, and on those bytes the claim is not true. **The
last statement on a table should decide.** Allocated by the chair at CE-44 and left OPEN here: it is
closed in the next code cut that touches `scripts/lib/rls_ladder_check.js`, with its own fixture and
its own mutation. Found by the chair's own plants against `checkLadder`, eight of nine as ruled.

**The refusal.** A file at or above the boundary that sets `search_path` is reported as a violation
of its own kind whose message is *cannot judge*. Under another search path a bare name is not known
to be in `public`, so every judgement about bare names in that file would be a guess wearing a
verdict's clothes. No such file exists today. **The refusal travels alone**: under `blind`, only
schema-qualified `public.` statements are judged, on both sides of the question, because a bare
`ALTER TABLE` is no more trustworthy there than a bare `CREATE TABLE`. The first cut of this function
printed the refusal and then convicted every bare name anyway, which is a guess printed beside the
sentence saying a guess is unavailable; it was caught by running the falsification, not by re-reading
the code. §7.16c to §7.16e pin all four cases and §8.6 mutates the arm away.

## 4 · THE SURVEY, AND WHY THE FLOOR DOES NOT MOVE

Fifty-three benches under `scripts/` read `db/migrations`. All 53 were surveyed two ways, chosen so
their failure modes differ (the independent-method law).

**By grep**, for every anchor that counts the ladder, pins its tail or lists its files.

**By differential**, which is the one to trust: two fresh copies of the tree, `0170` filed in one and
absent from the other, all 53 benches run in both, exit codes and full output compared. Environment
noise is identical on both sides and cancels, so only what `0170` changes survives the diff. Neither
copy was left dirty.

**No exit code moves.** Three benches change only what they print, and all three were already RED in
the named base and already failing their own assertion before `0170` existed:

| bench | the cell | what moves |
|---|---|---|
| `b10_p1_search_bench.js:122-125` | ladder top pinned to `0112_couple_route_and_flag.sql` | `top=0169_…` → `top=0170_…` |
| `b10_p2_bridge_bench.js:500-503` | the same pin, numeric | `top = 169` → `top = 170` |
| `b10_p3_mint_deck_bench.js:606-610` | the same, plus "0113 is still unwritten" | the tip's filename |

**One hit the differential cannot show, and it is filed rather than touched.**
`b07_p4b_body_bench.js:264-269`, its §5.26, reads every file matching `^01(0[5-9]|[1-9]\d)` and
requires none of them to contain `rate_min`, `rate_max`, `public.vendors` or `P4b`. `0170` matches
that filter and its line 201 is `ALTER TABLE public.vendors ... ENABLE ROW LEVEL SECURITY`, so `0170`
does trip it. It shows no delta because the cell is already false on some twenty committed migrations
between `0106` and `0147`, and the bench is already in the base. **F-44.85**, allocated to Block 09.
The cell's own comment records that it was re-aimed in August away from a ladder-tail pin for this
class of reason; the re-aim did not reach far enough, since any migration naming `public.vendors` for
any reason now trips it.

**The precedent this cell copies** is `b77_sunday_brief_bench.js:421-430`. Its cell once read "no
0166 exists", true at its seal and false the moment 0166 was allocated; it now asserts what it meant,
that any 0166 present is the allocated file. That is the shape a ladder-reading cell should take.

**Three green benches read the whole ladder and each was checked by hand as well as by the run.**
`b15_schema_register_bench.js:244-250` derives the reserved-but-empty count from the directory on
both sides of its own comparison, so a contiguous `0170` moves neither side.
`b07_f0789_phantom_columns_bench.js:57-76` concatenates every `.sql` only to clear columns added by
`ALTER TABLE ... ADD COLUMN`; `0170` has none, so it can only widen that escape hatch.
`b14_d1_visibility_bench.js:524`, `b14_d3_polls_bench.js:609` and `b14_d4_delegation_bench.js:504`
require that no `.sql` begins a line with a shell verb; `0170` has zero such lines.

## 5 · WHAT WAS PROVEN, AND HOW EACH LEG WAS FALSIFIED

A green on first run is not evidence. Every leg of `b91` was broken at its own site and watched to go
red, then restored, and the tree was confirmed clean afterwards.

Planting a violating rung at `0171` in the real directory reddens §2.1 with the file, the line and
the table named. Removing the filed `0170` reddens §2.2, §3.2, §3.4, §3.5 and §3.6. Appending two
bytes to the filed `0170` reddens §3.4 and §3.5 and prints the hash it got. Planting a rung above the
boundary that sets `search_path` reddens §2.1 and §7.17.

**The planted control is the point of the bench, not its decoration (C-44.4).** The real ladder holds
one file at or above the boundary today and that file creates no table, so the honest cell over the
real directory returns an empty list. An empty list is also what a broken regex, a mis-parsed
boundary, a typo in the filename filter or a checker that threw would return. So §4 plants a
violating migration above the boundary and fails if the checker does not report it; §5 plants the
cured twin and fails if it does; §6 plants the identical bytes at `0169` and fails if they are
reported, which is the ruled boundary under test rather than described.

**Six mutations prove the exclusions are load-bearing**, each an in-memory compile of the checker's
source with one range replaced: the `CREATE` regex broken and the planted control goes silent; the
boundary pushed past the ladder and the control falls out of scope; the `TEMP` exclusion, the
create-and-drop ruling, the other-plane exclusion and the blind arm each removed in turn, and in each
case the fixture that had been green starts convicting. §8.7 then reads the checker off disk and
asserts it is byte-unmoved.

**Nothing in this bench ever writes inside the repository.** Plants live in a directory under
`os.tmpdir()` that the bench creates and removes in a `finally`; mutations are compiled in memory and
the file on disk is opened for reading only. LESSON 3 in `run-floor.sh` is the reason: a bench killed
mid-write leaves production source carrying its mutation, and the floor then measures a correct
number over corrupted bytes, which is the worst shape a green can take.

## 6 · CRAFT THE NEXT SEAT WOULD OTHERWISE RELEARN

**The floor's set is `ls scripts/*.js` at the top level, less `_noop_middleware.js`, and nothing
else.** 211 files at this tip. A helper placed in `scripts/lib/` is not a bench and will not be run;
a helper placed beside the benches will be run, will exit 0 forever, and will read as a green that
proves nothing. That is E-1's finding and it is why the checker lives where it lives.

**The floor is not a floor without two preconditions, and both lie quietly.** `npm run build` must
have produced `src/engine/dist` or the run reads twenty-seven too many REDs, every one of them
looking like a defect (F-39.p2); the runner now refuses outright rather than measuring it. And the
first pass after a fresh install is discarded by the runner itself, because fourteen benches redden
once on cold module resolution and are green on every run after (LESSON 1). Run `tools/preflight.sh`
and read it before writing any number down.

**`--delivery` tolerates the dirty SET and never the dirty CONTENTS.** The manifest's files are
hashed before the run and re-hashed after, so a bench that corrupts a file already expected to be
dirty is a hard stop rather than a hidden one. A manifest may list a path that is not dirty; it may
not omit one that is.

**The base file is a pure set and carries no comments**, it is diffed raw against a sorted
measurement, and `RED:` sorts before `REFUSED:`. Reasons for base movements are written into
`run-floor.sh`'s header, never into the base.

**Three benches in this repo pin the ladder's tail and all three have been red since the tail passed
`0112`** (`b10_p1:122`, `b10_p2:500`, `b10_p3:606`). A new cell that reads the ladder should assert
what it means rather than where the ladder happens to end. `b77_sunday_brief_bench.js:421-430` is the
worked example of that correction.

**A FLOOR'S REFUSAL COUNT IS A FACT ABOUT THE MACHINE, NEVER ABOUT THE TREE.** The verdict is the
sentence `FLOOR = NAMED BASE, no delta`; the number printed after `refusals, not in base:` differs
between containers and carries no information about the delivery. Only a line reading `FLOOR DELTA`,
or a RED that is not in the named base, is a stop. **What this seat measured is a fact about THIS
container and is recorded as that and nothing more:** with both repos present it read four refusals
(`b06_gauntlet`, `b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`, `test-shape`), and with the pwa
sibling moved aside exactly two of the 22 dream-os benches that read it changed, `b4c1_shoot_board_bench`
and `b73_post_cards_bench`, both from green to REFUSED. **It does not transfer.** The founder's
dream-os Codespace also holds no sibling and his last four floors there each printed four
(P2 at `cb84f6f`, P4a at `f3f7398`, P5 at `ecc564d`, P5-h1 at `2aea4ce`), so those two benches
evidently do not refuse on his machine. The load-bearing half of the measurement is the half that DOES
transfer: **none of the five base lines that read the sibling moves either way** — `b07_f0772`,
`b07_f0774`, `b07_p4b_body`, `b07_p5` and `b08_p1_lifecycle` each exit 1 with the sibling and without
it — and refusals never enter a base, so `--check` cannot see them at all.

**The directory holds 156 entries and 153 rungs.** The other three are
`MAYA_MODEL_FLIP_FORMS.sql`, `OUT_OF_ORDER.json` and `archive/`, which holds one file,
`0068_binders.sql`. Both the kickoff and SEC-1 §2 say "156 files"; c-44.36 records the correction.
Any cell that counts the ladder should filter on `^\d{4}_.*\.sql$` and say so.

**`run-floor.sh` OWNS `/tmp/floor.txt` AND `/tmp/floor_warm.txt`.** They are not scratch paths a
caller may borrow. The runner truncates the first, appends every verdict line to it, and then `cat`s
it to stdout, so a caller who redirects the run's stdout onto that same path is writing into the file
the instrument is reading from, and the captured output is nonsense rather than a measurement. Give
the capture a name the instrument does not own. This seat lost a run to it (e-34) and the giveaway
was a stdout file with lines in it while the runner was still in the discarded warm pass.

**THE 300-SECOND CEILING, AND HOW THIS CONTAINER LIVES WITH IT.** A full dream-os floor here is two
passes over 212 benches and takes roughly twenty minutes; a seat container kills any single command
at 300 seconds. R-40.63 forbids backgrounding a floor and its stated cause is that `pgrep -f`
self-matches when a seat asks whether the run is still alive. The shape ruled allowable at CE-44 for
this container, and no wider: start the run detached, use NO `pgrep`, have the wrapper write the
runner's OWN exit code into a sentinel file on completion, poll the sentinel rather than the process
table, quote the runner's output file verbatim for the verdict with the sentinel's code beside it,
and read `git status --porcelain` and `git diff --stat` the moment it ends. **And do not let the turn
end while it runs.** A detached run in this container does not reliably survive an idle gap: one was
found gone with no sentinel, mid-measured-pass, after a pause (e-35). Poll back to back until the
sentinel appears. If it never appears, the run is not a measurement and nothing may be claimed from
its partial files, however complete they look.

**SQL is not JavaScript and `scripts/lib/stripComments.js` does not read it.** SQL comments are `--`
to end of line and `/* */` which NEST; literals escape by doubling the quote; double quotes are
identifiers and must survive stripping; and dollar-quoted bodies hold whole function definitions.
`0170`'s own header names thirty-odd tables inside `--` comments, so a checker reading raw text
convicts on the explanation. The SQL scanner is written in the checker, declared there, and canaried
in `b91` §1 with a vacuity twin showing the unstripped bytes would convict.

## 7 · FINDINGS, ERRORS, CORRECTIONS

**F-44.85** (chair-allocated, to Block 09) `b07_p4b_body_bench.js` §5.26, re-aimed in August away from
a ladder-tail pin, still reddens on any migration naming `public.vendors` for any reason; already
false at base on some twenty migrations, so it shows no delta and hides nothing new. Untouched here.

**F-44.86** (chair-allocated, OPEN, not blocking) the cell is silent on a file that enables row level
security on its new table and then disables it further down; the last statement on a table should
decide. Closed in the next code cut that touches `scripts/lib/rls_ladder_check.js`, with its fixture
and its mutation. Found by the chair's own plants; the other eight landed as ruled.

**c-44.36** (chair) "213 scripts under `scripts/`" is `scripts/*.js` plus `scripts/*.mjs`; the floor's
own glob reaches 211 top-level `.js`. "156 files" in `db/migrations` is 156 entries, 153 of them
numbered `.sql`.

**e-32** (LCV-4) the survey's first differential run produced an empty result, which was read as a
difference in line counts rather than as "no difference", and that is how a vanished temporary file
holding the bench list was found. Cost one round. Recorded because reading an empty result as a pass
is precisely the class C-44.4 exists for, inside the survey built to enforce it.

**e-36** (LCV-4) the founder's card, as first drafted, told him to expect
`(refusals, not in base: 6)` and that a different number there would be a finding. Cause: an
expectation carried across from this seat's own container, where the six was measured by moving the
pwa sibling aside — his container differs from it in more than the sibling, and his last four floors
on that Codespace each read four. The CE-44 block forbids quoting a seat's counts to him, and this
would have made him stop a good run. Caught by the chair before the card reached him. Cured: the
card names the verdict line alone, says the refusal number differs by machine and does not matter,
and names the only two things that stop him.

**e-34** (LCV-4) the first full-floor attempt redirected the run's stdout to `/tmp/floor.txt`, which
is the instrument's own results file. Cause: reaching for an obvious temp name without reading what
`run-floor.sh` writes. The run was stopped, `git status --porcelain` and `git diff --stat` read first
per R-40.32, the tree was clean and nothing was claimed from it; it was still inside the discarded
warm pass at `b64_mutations`. Capture redirected to `/tmp/sec1b_floor.out` and the run restarted.

**e-35** (LCV-4) the restarted detached floor was found gone with no sentinel, partway through the
measured pass, after an idle gap in the seat. Nothing was claimed from its partial files. Cause: a
detached run in this container does not reliably survive an idle turn boundary. Cured by polling back
to back and never pausing while a floor is live. The third run completed and is the one reported.

**e-33** (LCV-4) the checker's first cut reported the `search_path` refusal and then convicted every
bare name in the same file. Cause: the refusal was written as an extra violation rather than as a
change of what the function is willing to answer. Caught by running the falsification plant, not by
re-reading. Cured as §3 describes and mutated at §8.6.

## 8 · WHAT THE NEXT SITTING PICKS UP

This seat closes here. LC-Victor resumes from packet P5b on a fresh seat, from the tree, per the
chair's ruling: `docs/handovers/TDW_CE44_LCV3_SEAT_CLOSE.md` is its read-first and nothing in this
sitting touched the engine, the doors or the pwa.

**F-44.86 is open and is the first thing owed by whoever next touches the checker:** make the LAST
statement about a table decide, with a fixture for enable-then-disable and a mutation that removes
the arm.

**The next free migration number is `0171`.** The next free bench number in this repo is `b92`.

---

*Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.*
