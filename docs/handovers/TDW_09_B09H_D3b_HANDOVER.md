# TDW_09 · B-09H · D-3b HANDOVER — THE SINGLE-PERSIST
# one composed thing, persisted once, sent clean

**BASE: `29bef9577856472c81495f2b49acd263f1b86980`** (CE-22: derived fetch-first at seating,
matched TIP-AT-CHARTER exactly; SIBLING-FULL clone, `dreamos-pwa` @ `60b4317`).
**SEAT: LE.** Nothing pushed. The founder applies and pushes.
**CHAIR PRE-ORIGIN under R-31.2** — `brideInbound.js` and `brideEngine.js` are both
multi-seat-adjacent; §4's collision table is the item the chair reads first.

---

## 1 · WHAT SHIPPED — five items, all ruled, zero open forks

### (1) F-09.171 + DUTY (a) — THE SINGLE-PERSIST

`surfacePendingCircleSessions` now takes `channel = 'web'` and returns
`{ displayText, sessionIds }` or `null`. One row per circle summary, written **before the
send** (crash-durability), carrying the **caller-declared** channel, stamping
`circle_sessions.summary_message_id`. Both wire copies in `brideInbound.js` are deleted:
the engine-loop write is now the only write.

The `[session_id: uuid]` marker at the old `:2036` is gone from every send-bound and
persisted body. The session id lives on the stamp. The `[SYSTEM NOTE]` header and the
model-addressed instruction paragraph are **removed, not relocated** — nothing downstream
needed them, because the summary is delivered as its own message and never enters the
turn's context, and the one instruction that carried behaviour (call `list_muse` with the
session_id) is now held server-side.

The lossy header-strip at the old `:133-140` **retires**. It was a parser for a format
nobody owned, lossy by construction (a summary whose own first line began `One or more`
lost that line), and it guarded only one of the two send-bound paths.

**PLAYBACK.** `execListMuse` resolves through the stamp — most recent
`circle_sessions` row for the couple where `summary_message_id is not null`, ordered
`last_activity_at DESC`, limit 1 — then to `circle_activity` as before. No join. No stamped
session returns an honest empty rather than widening to the whole board. The model never
sees a uuid in either direction.

### (2) F-09.175 — /surprise SENDS CLEAN

`send(phone, circleSummary.trim())` becomes `send(phone, circle.displayText)`. The cure is
structural: there is no header, no instruction paragraph and no marker **reachable** by any
`send()` on this path, because the composer cannot build them. `/surprise` also declares
`channel: 'whatsapp'` on its own surfacer call and no longer persists a second row.

### (3) F-09.176 — THE STALE NARRATIVE RETIRES

Three sentences, not one. `brideEngine.js:61-67`'s 「 Injected as a system-level note 」
(the media context is **prepended to `dynamicContext`**, never a distinct message); the
module header's 「 prepend it to dynamicContext 」 and 「 the preamble carries the session_id
back to the agent 」 (both false of the code beneath them, before and after this diff); and
`:1529`'s cite to 「 the SYSTEM NOTE 」. The `deliveryChannel` header is written in **F-06.85
form** — it names `public.messages.channel` and the single persist as the mechanism it is
conditioned on, and names the bench cell that holds the hazard.

### (4) ⑤(b) — THE DOUBLED BRIDE MESSAGE

Ruled shape built: map → **scan from the tail, remove AT MOST ONE match, `break`** → slice.
Both faults die in one reordering — she is no longer handed to the model twice, and no
genuine turn is evicted to make room for the duplicate. The `break` is the chair's third
leg: a bare content match would remove **every** identical inbound in the window, so an
earlier 「 yes 」 would be evicted by the cure. The bench's fixture set carries that case.

### (5) MediaCaption0

The circle member's caption joins the synthetic envelope at `brideInbound.js:186` (one
field, the vestige's own shape) and is read at `brideIndex.js`'s image branch into
`sourceCaption`. It rides the caption **field** of the save that already happens — no
second row. The envelope's F-06.85 vestige comment gains its line naming the new field.

---

## 2 · COPY INVENTORY

**Couple-facing authored bytes: ZERO.** The wire-shape change is scaffold removal, ruled
non-veto-bearing — brides stop receiving a header, an instruction paragraph and a uuid.
`W-1` shut on the summary prose (still Haiku-composed behind `miraSoul`, untouched).

**ONE W-1-LIFTED SCHEMA ENTRY**, granted by CE-32 for the `session_id` parameter alone,
disclosed **verbatim for review**. The parameter is retired and re-aimed; `src/agent/brideTools.js`:

```
        // ── W-1 NARROW LIFT (CE-32, granted for this entry alone) ────────────
        // LD-5 — the why, attached: the old entry took a `session_id` UUID and
        // told you to read it out of the summary. That uuid only ever existed
        // in the summary because it was STAPLED TO A MESSAGE THE BRIDE READS
        // (F-09.171), which is the defect this diff cures. With the marker gone
        // there is no uuid for you to copy, and an entry that still asked for
        // one would be asking you to invent it. So the parameter is re-aimed:
        // you say IN WORDS that she means the circle activity you just told her
        // about, and the engine resolves which session that was from its own
        // records. You are not being asked to remember an id — you are being
        // asked what she meant, which is the thing you actually know.
        from_recent_circle_session: {
          type: 'boolean',
          description: 'Optional. Set true when she is asking to see the images from the circle activity she was just told about — "yes send them here", "show me what mom added", said right after a circle summary. Scopes the listing to that session\'s saves. Leave it out for any other kind of lookup.',
        },
```

**PRICING, disclosed per the ruling:** any `brideTools.js` byte invalidates the bride lane's
cached static prefix **once** — a one-time cache-write cost on the first turn after deploy.

**NO DDL.** `summary_message_id uuid` is column 8 of `public.circle_sessions`
(`docs/db/PUBLIC_SCHEMA.md:102`), FK to `messages(id)` at `:1716-1717`; `messages.id` at
`:594`. Witnessed before the statements were authored, per SQL-provenance.

---

## 3 · PROOF

### The bench floor — bare, by EXIT CODE, second independent method alongside the tally

| bench | exit | count | note |
|---|---|---|---|
| `b09_d3_structural_bench` | 0 | **33/33/0-skipped** | was 30/27/3 — amendment ratified |
| `b09_d3b_singlepersist_bench` | 0 | **12/12** | NEW this diff |
| `b09_f09173_bride_media_bench` | 0 | 27/27 | |
| `b05_arc_m1_bench` | 0 | **54** | was 53 — amendment ratified |
| `b05_m1b_inbound_bench` | 0 | 4/4 | |
| `b05_couple_soul_bench` | 0 | 21/21 | |
| `bOB_d2_onboarding_gate_bench` | 0 | 75/75 | |
| `bOB_taxonomy_bench` | 0 | GREEN | |
| `b0452_collab_bench` | 0 | 52/52 | |
| `b0453_collab_wiring_bench` | 0 | 71/71 | |
| `tools/bench/tdw10c_couple_meter_bench` | 0 | **38/38** | see §5 — unauthorised amendment |
| `b07_p5_bench` | 0 | **136/136** | sibling-full |
| `b05_m1_transport` · `b05_arc_m2` · `b06_f0613` · `oow` · `prospect exit` · `board` · `tier` · `billing` · `selfserve` | 0 | 10 · 27 · 40 · 74 · 36 · 10 · 81 · — · 30 | |

**Elders at their pinned reds, unchanged and neither cured nor worsened:**
`b06_meter` **28/29** · `f0555` **22/23** · `f0772` **158/159** · `b05_p4` **46/48** ·
`combined_cap` **36/37** (§6.4 LAWFUL-STALE, F-05.77's fourth specimen).

**`npm ci` + `npm run build` run before any floor claim binds** — `b06_meter` reports 5/6
with the engine dist absent and 28/29 with it built, so a floor claimed on a clean clone
would have been a different number than the sealed one. `node --check` clean on all ten
touched files.

**RESOLVED CITE DRIFT (D-3's open report, №1 class):** D-3 reported `b07_p5` as **114/114,
not the sealed 136**, and asked whether it folds into F-05.77. **It does not — it was the
sibling.** Run SIBLING-FULL at this base it is **136/136**, the sealed figure exactly. The
114 was `dreamos-pwa` absent from the clone, which is **F-06.196's class**, not F-05.77's.
Recommend the chair close that item there.

### Both-ways — twelve production mutations, each reddening a NAMED cell

| # | mutation | reddens |
|---|---|---|
| M1 | slice restored before the filter | §1.2 §1.4 |
| M2 | `break` dropped — removes every match | §1.3 §1.4 |
| M3 | positional test (`i === arr.length-1`) restored | §1.1 §1.2 §1.3 |
| M4 | stamp predicate dropped from the resolver | §2.2 §2.3 |
| M5 | recency key inverted to ascending | §2.2 §2.3 |
| M6 | the marker re-appended to each summary | §7.1 |
| M7 | header + instruction paragraph return to `displayText` | §7.2 |
| M8 | second persist restored on the engine path | §7.4 |
| M9 | the persist hardcodes `'web'` again | §7.5 |
| M10 | an undeclared fourth caller of the bride turn lands | §6.6 |
| M11 | the WhatsApp door stops declaring its channel | §6.6 |
| M12 | `.limit(FANOUT_MAX_SESSIONS)` deleted | meter 6.1 |

**M4/M5 caught a bench defect before the chair did.** On the first pass they reddened only
the *structural* cell, because the supabase fake ignored `.not()` and `.order()` and handed
back the same rows whatever was asked — a behavioural cell reading its fixture rather than
the code, which is the vacuous-green family. The fake now honours `not`/`order`/`limit`, and
§2.2's fixture carries an **unstamped-and-newest decoy** that a predicate-less resolver would
wrongly select. Both mutations now bite behaviourally. First-draft failure kept in-file.

**§6.6's own first-run failure kept in-file too:** it pinned `file:line` and reddened at the
cured tree, because `code()` strips comments and its indices are not the file's lines.
Re-shaped to **file+count**, adopted by CE-32 as the standing shape for census tripwires.

### Seat defect — le3, owned, graded, cured structurally

An M10 fixture's `rm -f` deleted `src/agent/brideNudge.js`, a live 154-line production
module the fixture had not created. Caught by `git status`, restored byte-identical (empty
`git diff` as witness). Two bench runs happened in that window with the tripwire's own file
list scanning a missing file, so those greens were **obtained, not authored**; both affected
cells re-run clean against the restored tree.

**CE-32 Ruling 1 rides this ZIP:** `b09_d3b_singlepersist_bench.js` §4 carries a checksum
restore-proof over every path the harness **writes OR deletes**, fixture paths included,
with absence recorded as its own state. It is **part of the verdict, not a footnote** — a
run that leaves the tree moved is RED even if every cell passed. It is *exercised*, not
asserted: §4.1 creates a leave-behind and deletes a production file, requires the ledger to
name both by their distinct shapes, then restores. Not a git-status assertion — the
founder's terminal runs benches on lawfully-dirty applied trees.

---

## 4 · R-31.2 COLLISION TABLE — the chair's first read

`brideInbound.js` takes the deepest cut it has had since becoming the named multi-seat file:
**9 hunks, +63/-40 net.** Every foreign anchor re-derived at the cured tree by command.

| foreign work | anchor at 29bef95 | anchor after this diff | collision |
|---|---|---|---|
| **OB-D** `onboardingGate` require | `:52` | `:52` | **none** — above every hunk |
| **OB-D** `safeName` / R-OB.7 order | `:271` | `:279` | **none** — displaced +8 by the `:186` hunk only; body byte-identical |
| **OB-D** the gate block, R-OB.2/.9/.5 | `:385-398` | `:393-406` | **none** — displaced +8, body byte-identical |
| **D-3** F-05.79 caption read | `:493` | `:501` | **none** — displaced +8, body byte-identical |
| **D-3** F-09.178 `media_url` on the bride row | `:607-630` | `:615-638` | **none** — displaced +8, body byte-identical |
| **D-3** F-05.79 descriptor `mediaCaption` | `:878-885` | `:899-906` | **READ, not written** — this diff's `:186` hunk is its first consumer on the circle door |

**My hunks, and what they touch:** `-186` (envelope, +8 lines) · `-647..-670` (the /surprise
block, rewritten) · `-734..-751` (the engine-path consumer). **No hunk overlaps any foreign
anchor's line range.** The `+8` displacement below `:186` is uniform and mechanical.

`src/api/couple/chat.js` is **byte-untouched**, as READ-ONLY ALWAYS requires — and that is
asserted by a cell (`§7.5`), not by this sentence.

---

## 5 · ONE UNAUTHORISED AMENDMENT — surfaced, ratify-or-revert

`tools/bench/tdw10c_couple_meter_bench.js` cell **6.1** is **not** in the pre-authorised
five-file scope. It reddened at my cured tree. **The ceiling never moved** — the cell located
its subject by the FIRST `from('circle_sessions')` in the file, and D-3b's playback resolver
added a **second reader of that table that sits earlier in the file**. The cell measured my
resolver, found no `FANOUT_MAX_SESSIONS` on it, and reported the fan-out unbounded.

Amended to anchor on `async function surfacePendingCircleSessions` rather than on file
order, so a third reader cannot re-break it. **Count unchanged: 38 → 38** (cell amended,
none added or removed). Proven both ways: green at the cured tree, and **M12** (delete the
ceiling) still reddens it with the same message.

**REVERT, if the chair refuses:** restore `const i = src.indexOf("from('circle_sessions')")`
— one line. Reverting leaves a standing false red on the meter floor.

This is RETIRE-WITH-THE-READER's mirror image: not a retirement that owns its readers, but
an **addition** that acquired one. Proposed as a class note for the register — *a new reader
of an existing table inherits every cell that located that table by file order.*

---

## 6 · THE WALK CARD — JOINS D-3's HELD CARD, one bride-lane walk over both deliveries

The live witness is the **founder's, declared-not-claimed. Nothing below was witnessed by
this seat.** Walk after the push deploys, **one step at a time**, pasting results before the
next step. **Dashboard acts expected: NONE.**

**FIXTURE-STATE FIRST (step 0), per the fixture-state law.** The duty-(a) / .174
ground-truth SELECTs already on the founder's desk feed step 0 — **this card consumes them**;
D-3's card consumes the eaten-photo census SELECT and nothing else does.

| # | step | what it proves | evidence to read | fixture-state precondition |
|---|---|---|---|---|
| 0 | Run the duty-(a) ground-truth SELECT (on the desk) | the baseline: how many summaries carry a marker, and how many rows exist per summary today | pasted rows | none — read before anything is walked |
| 1 | D-3's card, steps 0→end, unchanged | the elder delivery | per D-3's card | D-3's own |
| 2 | From a circle member's handset, save 2 photos to the board **with a caption on one** | the circle door accepts media | member gets her normal ack | member active on the couple's board |
| 3 | Wait past `SESSION_IDLE_MS` (10 min), then message the bride lane from **9888294440** | the fan-out fires | bride receives a summary message | one circle session idle and unsummarised |
| 4 | **READ THE SUMMARY ON THE HANDSET** | F-09.171 + F-09.175: no `[SYSTEM NOTE]` header, no instruction paragraph, **no uuid** | the message itself — handset only | step 3 delivered |
| 5 | `SELECT id, channel, body FROM messages WHERE conversation_id=<hers> AND direction='outbound' ORDER BY created_at DESC LIMIT 3;` | **duty (a)**: ONE row for that summary, `channel='whatsapp'`, body marker-free | pasted rows | step 4 seen |
| 6 | `SELECT id, summary_message_id FROM circle_sessions WHERE couple_id=<hers> ORDER BY last_activity_at DESC LIMIT 3;` | the stamp landed and points at step 5's row | pasted rows | step 5 pasted |
| 7 | Reply 「 yes send them here 」 | **playback through the stamp** — the model named no uuid | the photos arrive | step 4's summary was the last thing she read |
| 8 | Check the captioned save on the board | **MediaCaption0**: her caption is on the save, and there is no second row for it | board + `SELECT count(*) FROM muse_saves WHERE ...` | step 2 included a caption |
| 9 | Send 「 surprise me 」 while a **second** circle session is pending | F-09.175 on the door that never had a strip | summary arrives clean, then the surprise reply | a second idle unsummarised session |
| 10 | Send the same short word twice in one session (e.g. 「 yes 」 … later 「 yes 」) | ⑤(b): she is not answered as if she said it twice | her replies read coherently | a live session with prior turns |

**Steps only a handset can witness: 4, 7, 9, 10.** Steps 5, 6, 8 are the founder's SQL and
are the only place duty (a) is provable at all — the wire cannot show a row count.

---

## 7 · WHAT THE NEXT SITTING PICKS UP

- **Chair verification pre-origin (R-31.2)**, then the founder's terminal. Nothing pushed.
- **The unauthorised meter amendment (§5)** — ratify or revert, one line either way.
- **`b07_p5` 114-vs-136** — recommend closing under F-06.196, not F-05.77.
- The class note proposed at §5, if the chair wants it minted.
- **D-4** remains the vetoed copy: `.172` two homes · `.174` per-turn deed states · `.177`'s
  capped-path state. **`.174`'s residual ⓷ from D-2 is still owed and still not papered.**
- `PUBLIC_SCHEMA.md` regen remains overdue (stale by multiple migrations) — this diff added
  no DDL and does not worsen it.
- The DeepSeek seven-day window is live; **nothing here deploys onto the bride lane's live
  path until the founder's verdict**, per CE-217 ④(b).

Sequencing beyond this sitting is the founder's.
