# TDW_06 — THE FIXTURE AND ARM SITTING · EXECUTOR HANDOVER

**Base:** `fb2d7fa` (re-derived at origin, fetch-first, at delivery).
**Delta:** `scripts/b06_gauntlet.js` ALONE — 259+/9−, one file.
**W-1:** HELD SHUT. Zero soul, prompt, voice, engine or production bytes.
`donnaSoul.ts`, `donna.ts`, `memory.ts`, `loop.ts` read-only throughout; the
F-06.81 relay cure is not touched by one byte. No SQL, no migration, no
engine build owed (no engine TS moved).

---

## 1. WHAT SHIPPED

### F-06.82 — the double stops manufacturing the estate's own specimens

Four fixture edits inside `mkLaneDb`, all in `scripts/`:

| Site | Before | After |
|---|---|---|
| select `agent_owner` | `null` | `store.owner` (seeded row) |
| select `agent_snapshot` | `{ note: { items: [] } }` | `store.snapshot` (NULL at birth) |
| insert/upsert `agent_snapshot` | fell to the default branch, **discarded** | persists on the store |
| update `agent_owner` | fell to the default branch, **discarded** | persists on the store |

**The forks as ruled:**

- **1C** — `owner_name: 'Gauntlet Vendor'` (the double's own
  `agents.display_name`, so no second name was minted),
  `owner_descriptor: 'a wedding photographer'`, **`note: null` by ruling**.
  The sibling seeds at `b06_0081_bench:101` / `b06_advisor_bench:119` are
  NOT amended — different scope, and their note never meets a live model.
- **2C** — `null` at birth plus a real slot the write lands in. This is the
  only shape that is both production-faithful and self-maintaining; it also
  makes `patchNote`'s surgical path exercisable at the desk for the first
  time (asserted at [26]).
- **3A** — `consult_done: true`, the steady state of any vendor past turn
  one. **3C is refused for now and is the founder's question** — see §5.
- **4B** — the CARRIED emission ships WITH its missing world.

### The carried-emission gap

`handAttribution`'s limb 2 gains its silent branch:
`handsDated && !verdictTurnsOnIt && relay carried` now emits a neutral
`DATES CARRIED (observation only …)` line. `ok` is untouched on every path.

**The wording names its own resolution, by ruling.** Both predicates are
ANY-over-a-join, so a relay speaking one date of three reads CARRIED, and
`REPLY_ARRIVAL_RE` can be satisfied by an arrival phrase about something
else. The line says *"AT LEAST ONE arrival token survived"* and discloses
the test — it never says *"the dates survived."* **F-06.82(d) is FILED,
NOT CURED**; a per-result predicate was refused as a second authority on
`recencyFidelity`'s vocabulary.

A third scripted profile, `relaycarryanswered`, produces the world the
emission needs — **one string from `relaycarry`** (Victor's prose answers
with the arrival instead of denying it) exactly as `relaycarry` is one
string from `relaydrop`.

### The comparability notice

The live-run header now carries the F-06.82 notice in the CE-84 form: this
run's numbers are **not byte-comparable to any run before this ZIP**, with
the mechanism stated — the cheap non-dispatch path §2.1 sentence 3 forbids
was not available to a Victor whose estate line said clean slate.

---

## 2. PROOF

**Selftest 255 → 278.** All 23 new cells are in section [26]; **the
pre-existing 255 assertion lines are byte-identical** (diffed, 0 lines).

**Non-vacuous, three separate mutations, each on the shipped fixture and
never on test setup:**

| Mutation | Result |
|---|---|
| Restore `agent_owner → null`, `agent_snapshot → items:[]`, and drop both write branches (the exact pre-ZIP bytes) | **269/278 — 9 RED**, on exactly the three consequences, 2C's persistence, patchNote's path and the consult_done stamp |
| Delete the CARRIED branch | **276/278 — 2 RED** |
| Collapse `relaycarryanswered`'s one prose string into the denial | **275/278 — 3 RED** |

The three consequences are asserted **through the REAL compiled
`loadOwner` / `snapshotText` / `patchNote` against the REAL double**, and
`wasFirstMeeting` is **LIFTED from `loop.ts` source**, never restated — a
re-word or deletion of that line REDs at the lift.

**Floor at the tip, every §5 count HELD:**

```
b06 m0 50 · m1 45 · m2 39 · m3 37 · m4 33 · m4b 24 · m4c 20 · m4d 16
f0658 20 · f0667 16 · advisor 16 · advisor_route 16 · 0081 12 · sonnet 13
b0461_p6 25 · b6_floors 47 · b6_s1 24 · b6_sitting2 22
b05 f0550 31 · arc_m2 27 · arc_m4 18 · arc_m5 11
gauntlet --rig-selftest 278/278  (was 255/255; +23, section [26])
BEYOND THE LIST: b06_donna_cache_bench 16/16
KNOWN RED, not this sitting's: b06_meter_bench 28/29 (F-06.41)
```

**BENCHES SKIPPED, NAMED** (the floor-method law): every bench outside §5's
list and the one named beyond it — the `b04*` / `b05_*` transport, media,
crew and collab families, `checker_bench`, `b5_wa_door_smoke`,
`b6_door_rider_bench` (also the named credential-drop specimen from CE-80),
`b6_f79` / `f80` / `witness` / `rider` / `referent`,
`b06_pwa_flip_seam_bench`, `b06_wa_words_bench`, `b06_downgrade_bench`,
`b06_fresh_thread_bench`. Reason: no shipped byte reaches their surfaces.

**Copy inventory: ZERO.** Veto slot empty, per the CE's §3 ruling — the
owner seed's two strings are rig fixture text of `CODEX_SEED`'s class.

---

## 3. FILED, NOT CURED — the widened default branch (§1)

F-06.82's scope widened by ruling on the read-first's census. The double's
default select branch (`:1199`) returns empty for every table it does not
name, and the default insert/update branches (`:1208`/`:1215`) discard the
write. Turn-reachable members still in that state after this ZIP:

- **`facts`** — `factsBlock` is `''` on every turn; `rememberFact`'s insert
  is lost, so a fact written in a lane is unreadable in the same lane.
- **`briefs`** — the Document Shelf never composes, **and `donnaFind.ts:356`
  searches it**.
- **`donna_review_binder`** — `donnaFind.ts:381`, same.
- **`domain_manifests`** (`cabinet.ts`), **`owner_notes`** (`jotAdvice`'s
  write is lost).

**THE CONSEQUENCE, NAMED: `donna_find` searches TWO planes at the desk
where production reaches FOUR.** The fixture does not only compose a
different prompt — it returns different tool results. Asserted as
filed-not-cured at [26] so the handover cannot drift from the code.

---

## 4. THE HONEST LIMIT ON THIS ZIP'S OWN PROOF

Section [26] proves the repair mechanically. It does **not** prove the
repair changes any model verdict, and it cannot: the selftest runs scripted
transports, so a prompt change is invisible to it by construction. This is
the read-first's measurement restated as a standing caution — the seeded
fixture changes what Victor reads on 309 of 324 turns and not one of the
original 255 assertions noticed.

**The witness is the founder's next live gauntlet run.** That is why the
comparability notice ships in the same ZIP.

---

## 5. FOR THE FOUNDER — ONE QUESTION, PUT BY THE CHAIR

`consult_done` is seeded **true** (fork 3A): every gauntlet turn is an
ongoing working relationship, and Victor's **opening line is never
scored**. Fork 3C would seed it false and let the run's first turn flip it,
which is more faithful to a genuinely new vendor — but it changes S1's
world, and a fresh thread is not a first meeting.

**If you want the evenings to score Victor's opening line, 3C returns as
its own act with S1's world re-derived.** Nothing waits on this; the ZIP
stands either way.

---

## 6. NEXT

The live gauntlet run, read against the comparability notice. Any red that
was green before is a first measurement on the estate production actually
serves, not a regression — that is what the notice exists to say.
