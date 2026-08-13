# TDW_09 · B-09H · DELIVERY 4 — THE HONEST MOUTH
# the arc's final sitting · the copy half · every byte through the founder's pen

**BASE: `f18234e0327bb1b341deeed74896fea8aae2009a`** (bundle transport, no origin; HEAD
re-derived by this seat, `git status --porcelain` empty at clone. SIBLING-FULL —
`dreamos-pwa` @ `60b4317976bf34944a36a215c91cf0b3f5ad83db`, cloned side by side.)
**SEAT: LE.** Nothing pushed. The founder applies and pushes.
**CHAIR PRE-ORIGIN under R-31.2** — `brideInbound.js` AND `brideIndex.js` are both in this
diff; §5's collision table is the item the chair reads first.
**THIS TREE IS A REBUILD.** The first build was condemned by the chair (le5, §6). Every
figure below was derived on the rebuilt tree; none is carried forward from the condemned one.

---

## 1 · WHAT SHIPPED — seven files, eight signed bytes, zero unvetoed copy

| file | what |
|---|---|
| `src/lib/deedState.js` | **NEW** — sole author of the per-turn deed vocabulary (V6) |
| `src/agent/circleSystemPrompt.js` | V5 (W-1 lift 2, ONE static line) · V6 rendered into the uncached dynamic block |
| `src/agent/circleEngine.js` | the deed state threaded, narrowed mid-loop by a refusal, returned; real `toolCalls` |
| `src/agent/brideEngine.js` | V2/V3/V4 (W-1 lift 1) · F-09.182's `refused` discriminator |
| `src/brideIndex.js` | the circle door's five deed sites · V1 · residual ⓷ closed |
| `src/lib/brideInbound.js` | V7 (fork 3a) · V8 (F-09.186) |
| `scripts/b09_d4_honestmouth_bench.js` | **NEW** — 47 cells, ten sections, fifteen production mutations |
| this handover | — |

**THE BUILD LIST IS EXECUTABLE.** The rebuild was applied by a script of 27 numbered
entries, each asserting a UNIQUE anchor — a drifted anchor is a hard stop, never a silent
no-op. §6's reconciliation maps every hunk in the diff to one of those entries.

---

## 2 · THE RULINGS, CARRIED AS CODE

**Fork 1a — the state rides the UNCACHED block.** `deedState.js` is the one home; the
door seeds it, `buildDynamicCircleContext` renders it, the engine may narrow it. Only ONE
byte moved inside `STATIC_SYSTEM_PROMPT` (V5). **Pricing, disclosed:** that one line
invalidates the circle lane's cached static prefix once, on the first circle turn after
deploy. The dynamic block costs nothing.

**The default direction IS the finding.** An unrecognised deed state resolves to
`nothing to record`, never to a save claim. Cell §1.5 asserts the direction rather than the
value, so a future state added without a sentence fails safe. M3 proves it bites.

**Fork 2 — V1, one send.** The prefix is prepended and `CAP_BYTES.circle` is concatenated
**untouched** behind it. The prefix rides `deed.kind === SAVED` and nothing else: a capped
member who sent a text note, or whose save failed, hears the bare frozen byte. Claiming a
save there would be F-09.174 rebuilt inside F-09.177's cure — M9 is that mutation and it
reddens.

**Fork 3a — V7.** `mediaCaption ? \`${mediaCaption} — save failed\` : '[forwarded an image — save failed]'`.
The success row and the failure row are no longer byte-identical when a caption exists.
Driven end-to-end through the REAL `processBrideInbound`, not asserted from source.

**F-09.182 — `refused` is set AT THE SOURCE, never inferred from error prose.** Three
branches of `execDeleteMuseSave` decline (bad number · no such save · not yours); two fail
(lookup error · delete error). Inferring the difference from the error string downstream
would make every future copy edit a silent behaviour change. M6 — promote ANY `!ok` to
declined — reddens: *telling a member "I decided not to" over a broken database is the same
lie as F-09.174 pointing the other way.*

**V8 — symmetrical, and its gap is declared.** The founder signed the DAILY and MONTHLY
windows. `state === 'zero'` is not a window; it carries no signed prefix and speaks its
frozen 10.C byte bare, as today. Same for the onboarding surface, which refuses only at
zero. **Cell §4.4 asserts the gap has teeth** — M11 widens the window set to include zero
and reddens. A conditional block ships withheld until its condition arrives.

**Residual ⓷ closed.** `hasMedia` survives a failed resolve (`media.length > 0`, which knows
nothing about the resolve) while the envelope's type and url both go null, so neither the
save branch nor the note branch fired and the member's photograph produced no state at all.
It is a failed save and now says so.

---

## 3 · PROOF — 47/47, BARE EXIT 0, FIFTEEN PRODUCTION MUTATIONS

Every mutation below was **RUN against the production file**, the bench re-run, the file
restored. None is asserted from reading. All fifteen mutate **executable code**; comments
absorb none of them.

| # | production mutation | reddens |
|---|---|---|
| M1 | `circleSystemPrompt:57` restored (**the uncured tree**) | §2.1 §2.4 |
| M2 | the deed line dropped from the dynamic block (**uncured**) | §2.2 §2.3 §2.5 |
| M3 | `deedStateText` defaults to SAVED | §1.1 §1.2 §1.4 §1.5 §2.3 |
| M4 | `save_failed` returns the saved text (**the collapse**) | §1.1 §1.6 §2.5 |
| M5 | the permission branch drops `refused` (**uncured**) | §5.1 |
| M6 | any `!ok` promoted to declined (a fault worn as a decision) | §5.5 |
| M7 | `toolCalls: []` restored (**the bare absence**) | §5.5 |
| M8 | the circle cap speaks the bare byte over a save (**uncured**) | §3.1 §3.2 |
| M9 | V1's prefix applied unconditionally | §3.1 §3.2 |
| M10 | the bride cap drops the V8 prefix (**uncured**) | §4.6 |
| M11 | V8's window set widened to include `'zero'` | §4.6 |
| M12 | `brideInbound`'s save-failed body restored (**the collapse**) | §7.1 §7.3 §7.5 |
| M13 | the composer fallback restored to one sentence (**uncured**) | §6.1 §6.2 §6.3 |
| M14 | V3's frame restored (**uncured**) | §6.4 §9.4 |
| M15 | the resolve-failure branch deleted (residual ⓷ reopens) | §8.1 §8.3 §9.1 |

**§7 drives the REAL production path end to end** — raw Meta webhook body → real
`normalizeMetaInbound` → real `metaInputsFrom` → real `processBrideInbound`, with a
capturing supabase fake, so cells read the row production actually built. §5 drives the
REAL `executeBrideTool`. **§3 and §8 declare their limit rather than papering it:**
`brideIndex.js` calls `app.listen()` at module scope and cannot be required, so its
expressions are cut on stable code markers and evaluated; §3.5 proves the extractor throws
loudly when a marker moves.

`node --check` clean on all seven files. `npm ci` EXIT 0 · `npm run build` EXIT 0 **before
any floor claim binds.**

### FOUR BENCH DEFECTS THE SWEEP CAUGHT — cures carried into the rebuild, first drafts kept in-file

1. **§1.6's collapse cell passed through its own collapse.** Each state was built from its
   own payload, so M4 produced `saved as save #undefined` — still distinct from
   `saved as save #1`. **One payload, every kind** is what makes the inequality real.
2. **§5.5 was a census of one home.** `includes()` over a file with TWO returns carrying the
   audit; M7 reverted the success path and the cell stayed green off the other one. Reshaped
   to **file+count** (D-3b §6.6's standing shape).
3. **Three extractions ran at MODULE SCOPE.** M8/M9/M15 threw before any cell ran — the
   bench exited 1 with **no named red**, a crash where a verdict belonged. `grep -c FAIL` on
   that output reads zero, which is the taxonomy band's own trap wearing its opposite face.
   Extraction is now cell-local.
4. **§7.5 asserted the wrong direction** — that the model reads her bare caption. It does
   not and should not: `trimmedBody` is empty on this transport, so `inboundForEngine` falls
   through to `bodyForLog` by D-3's own sub-fork. The right cell is the AGREEMENT.

---

## 4 · THE FLOOR — SIBLING-FULL, PAIRED, IDENTICAL

`b09_d4_honestmouth` **47/47 (new)** · d3b **12/12** · d3 **33/33/0** · media **27/27** ·
arc_m1 **54** · m1b **4** · couple_soul **21** · bOB_d2 **75** · taxonomy **76 GREEN** ·
b0452 **52** · b0453 **71** · meter **38/38** · b07_p5 **136** — all EXIT 0.

Elders at their pinned reds, **neither cured nor worsened**: b06_meter **28/29** ·
f0555 **22/23** · f0772 **158/159** · b05_p4 **46/48** · combined_cap **36/37**.

Every figure matches the kickoff's §5 cite exactly. No labelled amendment is owed.

---

## 5 · R-31.2 COLLISION TABLE — the chair's first read

Both named multi-seat files are in this diff. Every foreign anchor re-derived **by command**
at the cured tree.

### `src/lib/brideInbound.js` — 5 hunks, +51/-4

| foreign work | anchor at f18234e | anchor after this diff | collision |
|---|---|---|---|
| **OB-D** `onboardingGate` require | `:52` | `:69` | **none** — displaced +17 by B-1 only; body byte-identical |
| **OB-D** `safeName` / R-OB.7 order | `:279` | `:296` | **none** — displaced +17, body byte-identical |
| **OB-D** the gate block, R-OB.2/.9/.5 | `:408` | `:425` | **none** — displaced +17, body byte-identical |
| **D-3** F-05.79 caption read | `:501` | `:518` | **none** — displaced +17, body byte-identical |
| **D-3** F-09.178 `media_url` on the bride row | `:644` | `:661` | **none** — displaced +17, body byte-identical |
| **D-3b** `MediaCaption0` on the envelope | `:194` | `:211` | **none** — displaced +17, body byte-identical |
| **D-3** descriptor `mediaCaption` | `:934` | `:951` | **READ, not written** — B-2 is its second consumer |

**`metaInputsFrom` is byte-untouched.** Stated explicitly because the condemned tree's
contamination landed there; §6.

### `src/brideIndex.js` — 13 hunks, +81/-3

No foreign seat's live work sits in `handleCircleMemberMessage` at this base. The 10.C
anchors above the handler (`newTurnId` at `:570`, the gate call at `:579`) are displaced
+10 by I-1/I-2 only and are byte-identical.

---

## 6 · SEAT DEFECT le5 — THE CONDEMNED TREE, OWNED

Mid-build, `src/lib/brideInbound.js` acquired three coherent, commented lines threading a
`mediaDeclaredType` field through the descriptor, `metaInputsFrom`, and the synthetic
envelope — **a cure for the exact residual this seat had declared in-comment and filed for
the chair as unruled.** They were not in the build list. The seat caught them at the R-31.2
derivation, **stopped before authoring the ZIP or the CE-22 header**, and reported.

The chair's three witnesses settled the base: the bundle's `f18234e` contains zero
occurrences, and no commit in history ever introduced the string. **The contamination was
seat-side.** Most probable cause on the chair's reading and this seat's: work done mid-build
and never registered in its own build list, then restored by the mutation harness — le3's
family in new clothes. **Probable, not proven, and the condemnation did not need it proven.**

**What the chair ruled and this ZIP carries:** the condemned worktree is preserved whole as
a post-mortem artifact; the field is **OUT** on the merits as well as on procedure — widening
F4's kept-and-named vestige is D-3 ⓵'s ruling, not a seat's to take; **F-09.187** mints for
the residual so it cannot get lost; the rebuild is from a fresh clone with a line-by-line
reconciliation before the header; **none of the condemned tree's results were carried
forward.**

**The standing lesson, offered for the register:** a build list that lives only in the
seat's head cannot detect a hunk the seat does not remember writing. This delivery's build
list is an executable script with 27 asserted anchors, and the reconciliation against it is
mechanical. *An unregistered hunk is indistinguishable from a foreign one — so register them
all, and let the diff prove it.*

---

## 7 · THE EIGHT SIGNED BYTES — pinned as literals, mutations bite

Each is `APPROVED-COPY-CARRIES-ITS-HASH`, frozen at the byte; an edit — a comma, an
em-dash, a trailing space — is a fresh veto and may not ride a refactor.

| # | byte | pin | frozen 10.C byte behind it |
|---|---|---|---|
| V1 | 「 Added to the board. 」 + circle cap byte | §3.1 §3.3 §3.4 | `CAP_BYTES.circle`, untouched, asserted as the exact suffix |
| V2 | four fallback sentences | §6.1 §6.2 §6.3 | — |
| V3 | the composer frame | §6.4 | — |
| V4 | the notes-only example | §6.5 | — |
| V5 | the static deed-reading line | §2.1 §2.4 | — |
| V6 | six deed sentences + header | §1.1 §1.2 §1.6 | — |
| V7 | 「 {caption} — save failed 」 | §7.1 §7.3 | — |
| V8 | 「 Saved. 」 + daily/monthly cap bytes | §4.1 §4.2 §4.3 | `CAP_BYTES.bride_daily`/`_monthly`, untouched, asserted as exact suffixes |

**§9.5 asserts no V1 or V8 byte leaked into `coupleAiCap.js`** — the frozen 10.C copy home
is byte-untouched by this diff.

---

## 8 · RESIDUALS, DECLARED AND OWED — none papered

**⓵ F-09.187 (chair-minted).** `save-failed` and `unsupported-kind` are indistinguishable at
the deed-state discriminator: a member who sends a VIDEO is told his save failed and invited
to resend something that can never work. The pre-existing
`[forwarded a {kind} — not yet supported]` line has always collapsed the same way for the
same reason, so this diff **neither creates nor worsens it** — but it now has a second
reader. Candidate cure unruled, convenience shelf.

**⓶ `circleEngine`'s anthropic-failure reply.** 「 Got it. Thanks. 」 confirms a deed. On a
turn whose state is `save_failed` it is exactly the sentence this delivery exists to kill —
the model never ran, so nothing read the state. **The byte is NOT moved:** it was not on
D-4's veto sheet, and an honest replacement is the founder's to sign, not this seat's to
invent. The audit is threaded regardless, so the row records what the reply does not.
Unnumbered; R-M3.

**⓷ `note_recorded` and `note_failed` share one audit shape.** The inbound row's body is her
words on both. The only cure that separates them appends a new model-voiced byte to that
body, and no such byte was put to the founder. The deed LINE distinguishes them for the
model today; the ROW does not. Named in `deedState.js` at the audit comment.

**⓸ THE OWNERSHIP-ASK LOOP (walk-found).** The circle agent asks about ownership rather than
resolving it from `list_muse_saves`, and accepts a bare 「 Yes 」. Server gate holds; the cost
is two turns of a five-turn daily cap per deletion. W-1, outside the two lifts. Unnumbered.

**⓹ THE 10:06:35 SAVE FAILURE (walk-found, cause open).** Bytes green, cause unestablished.
The dial is exonerated by three readings (§9). Railway log settles it. Unnumbered.

**⓺ F-09.185 (chair-minted).** D-3 §8 asserted `public.messages` is 18 columns and unaltered
by `0100`–`0122`. **`0105_circle_message_author.sql` adds `sender_name` and
`sender_user_id`** — its own readback expects twenty. `docs/db/PUBLIC_SCHEMA.md` is stale on
that table. D-3's SELECTs were unharmed; the provenance claim was not. **This delivery adds
no DDL** and its fork-3 choice (3a) was made so none is needed.

---

## 9 · THE WALK — RUN 2026-08-13, FOUNDER'S HANDSETS. RESULT.

**Every line below is the founder's witness, declared-not-claimed.** This seat saw rows and
screenshots, never a phone. Dial home is `public.admin_config`, keys
`couple_ai_daily_<tier>` / `couple_ai_monthly_<tier>` — **not** `app_config`, which does not
exist; the seat's first guess was wrong and the founder pasted the error rather than hunting.
Test couple `9f1f84d5-e688-4d4f-9e44-9f5da6315e52`, tier `basic`, dials `40`/`600`.
**Dashboard acts: NONE, as forecast.**

### GREEN — witnessed on a handset AND in the rows

| step | cure | evidence |
|---|---|---|
| 1 | control — the ordinary circle path | save `#13` `circle_member`; agent-composed warm reply `09:30:37` |
| 3 | **V1 · F-09.177** | save `#14` `09:40:16`, outbound `09:40:18`: 「 Added to the board. The board's chat is quiet for today — you can still browse and add to it any time. 」 ONE message, no agent turn between inbound and reply. **Witnessed twice** — `#15` at `09:48:35` repeated it unprompted |
| 4 | **V1's guard** | text turn `09:41:47`: the bare frozen byte, prefix ABSENT. The two outbounds sit adjacent in the log, same door, same cap state, 89s apart, identical suffix, prefix in exactly one |
| 5 | **V8 · F-09.186** | save `#16` `10:00:42` `saved_by_role = bride`; outbound `10:00:45`: 「 Saved. You've reached today's conversation limit. I'll be right here at midnight. 」 |
| 6 | **V8's guard** | text turn `10:02:24`: bare frozen byte, 「 Saved. 」 absent. Same adjacency proof as step 4 |
| 7 | **V7 · F-09.183, BOTH ARMS** | see below — the arm this handover called unforceable |
| — | **F-09.183's audit column, live** | `10:21:32` outbound carries `[{"ok":true,"name":"delete_muse_save","reason":null,"refused":false}]`; the turn 20s earlier where no tool ran carries `[]`. The column discriminates rather than always emitting |

### V7's FAILURE ARM — this handover was WRONG and production corrected it

§3 and the first draft of §8 recorded V7's failure arm as **bench-only, unforceable from a
handset without breaking Cloudinary**. At `10:06:35` a real save failed on the bride door,
unforced, 45 seconds before an identical one succeeded. The two inbound rows:

```
10:06:36  "Gold tissue, exactly like this — save failed"   media_url present
10:07:25  "Gold tissue, exactly like this"                 media_url present
```

**Identical human input, byte-different audit rows.** Before this diff both read
`Gold tissue, exactly like this` and nothing downstream could tell them apart. That is
F-09.183's collapse cured on live data — M12's exact shape, refuted in production. The
agent's reply on the failed turn (「 The save didn't go through 」) is F-09.174's whole point
arriving on the same turn, and her resend then landed as `#17`, so its advice was correct too.

### CARRIED — unwitnessed, blocked on the IST-midnight cap reset. NOT failures.

| carried | why | what already covers it |
|---|---|---|
| **F-09.182's `refused: true` branch** | the circle member spent both daily caps (5 images, 5 texts) before the branch could be reached | §5.1 §5.3 §5.4 + M5/M6/M7; and the audit column is **proven live** on the `ok:true` path above — what is untested on a handset is the refusal flag specifically |
| **step 9 · F-09.172** | needs an idle notes-only session, which needs circle text turns she no longer has | §6.1–§6.5 + M13/M14 |

**Both are one message each after IST midnight.** Recorded as unwitnessed rather than
folded into a green — the walk is not complete and this handover does not say it is.

### WHY THE CAPS RAN OUT — a behaviour for the chair, not a red

The circle agent **asks about ownership rather than resolving it**, even for a member's own
save — it holds `list_muse_saves`, which returns `saved_by_role`, so it could know. At
`10:21:12` it made the member confirm ownership of a save that was already hers, and at
`10:15:13` it offered 「 If save 17 is yours, tell me and I'll take it down 」 over a save that
was not. **It then accepts a bare 「 Yes 」.** The server gate is the real one and it holds —
`execDeleteMuseSave` checks `saved_by_user_id` and cannot be talked past — so this is a
wasted-turn loop, not a hole. But it costs **two turns of a five-turn daily cap per
deletion**, which is precisely why F-09.182's branch went unwitnessed.

It is prompt shaping on the circle lane: **W-1, shut outside D-4's two granted lifts.**
Filed unnumbered; R-M3, the register is the chair's.

### SEAT DEFECTS DURING THE WALK — three, all self-caught, none consequential

1. **Predicted a `wa-media/bride/…` url for a muse save.** It is Cloudinary
   (`dream-os/muse/<couple_id>/…`); `wa-media` is the inbound transport bucket. Written from
   memory instead of derived.
2. **Predicted `tool_calls = []` on a cap refusal.** It writes **`null`** — the cap-refusal
   insert omits the column because the model never runs. Right about the rows, wrong about
   the column.
3. **Read a step as green from a screen report that the rows contradicted.** Two photos the
   founder believed went down the bride lane were `saved_by_role = 'circle_member'`; V8 was
   unwitnessed and the seat said so and re-issued step 5. **The rows-and-logs rule caught it.**

### ONE CAUSE STILL OPEN — the save that failed at 10:06:35

The founder's reading was that the dial change had not yet propagated. **The seat disagreed,
and the disagreement is on the record because it is load-bearing.** Three independent
readings say the dial cannot produce that failure: `media_url` is **present** on the failed
row, so the resolve succeeded and the fault is downstream in `saveToMuse`; `museSave.js`
contains **zero** references to the cap, the gate, or `admin_config` (grepped, count 0); and
the turn received an **agent-composed reply**, which a cap refusal returns before. There is
no cache — `readCoupleCap` queries `admin_config` fresh every turn.

So the failure is one of `museSave`'s named modes, most likely the Cloudinary leg
(`image pipeline failed: …`), and a resend succeeding 45s later fits an intermittent upstream
far better than a config write. **Why this matters:** if "cap propagation" enters the record,
an intermittent live save failure on the bride door stops being investigated. The BYTES are
green either way — the cure is not in question, the cause is. Railway logs settle it in one
line, tag `[museSave] pipeline failed:` or `[museSave] insert failed:` around `10:06:35 UTC`.
**Not blocking. Filed unnumbered; R-M3.**

### THE DIAL IS RESTORED

`couple_ai_daily_basic` was set to `1` for steps 3–6 (**estate-wide config, signed off with
the radius named — every basic-tier couple, three test couples, no real ones**) and restored
to `40` at step 7, verified by read. The estate is out of its modified state.

## 10 · FOUNDER-RUN SELECTs — read-only, zero placeholders

**SQL-provenance.** `public.messages`: `body` col 5, `media_url` col 6, `sent_by` col 7,
`tool_calls` col 8, `direction` col 3, `channel` col 4, `created_at` col 11 — witnessed at
`docs/db/PUBLIC_SCHEMA.md`. **That doc is STALE on this table (F-09.185): `0105` adds
`sender_name` and `sender_user_id`, so the live table is TWENTY columns, not eighteen.**
Every column read below is among the witnessed eighteen and is unaltered by `0100`–`0123`.
`public.muse_saves`: `save_number` col 3, `image_url` col 6, `caption` col 8,
`saved_by_role` col 12, `created_at` col 13.

**`public.couple_ai_usage` is NOT in `PUBLIC_SCHEMA.md` at all** — the doc sits at ladder
`0099` and the table is born at `0120`. Its columns are therefore witnessed at the two
places that do hold them: migration `0120_couple_ai_ledger.sql`, and the table's sole
reader `coupleAiCap.js` `countTurns`, which selects `turn_id` filtered on `couple_id`,
`kind`, a non-null `turn_id`, and `created_at`. SELECT E mirrors that predicate exactly,
including the non-null guard — **counting turns without it would not be the number the gate
counts**, and a baseline that disagrees with the gate is worse than no baseline.

**No DDL. Nothing below writes.**

```sql
-- D · today's circle saves for the test board
select count(*) as saves_today
from public.muse_saves
where saved_by_role = 'circle_member'
  and created_at >= (date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata');
```

```sql
-- E · the couple's turn count today (the cap's own unit: DISTINCT turn, kind='turn')
select couple_id, count(distinct turn_id) as turns_today
from public.couple_ai_usage
where kind = 'turn'
  and turn_id is not null
  and created_at >= (date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata')
group by couple_id
order by turns_today desc
limit 5;
```

```sql
-- F · the last 5 saves — did the deed actually land?
select created_at, save_number, saved_by_role, caption, image_url
from public.muse_saves
order by created_at desc
limit 5;
```

```sql
-- G · the last 8 rows both ways — the bytes the humans read, and the audit
select created_at, direction, channel, sent_by, body
from public.messages
order by created_at desc
limit 8;
```

```sql
-- H · the refusal's audit shape (F-09.182 / F-09.183)
select created_at, body, tool_calls
from public.messages
where direction = 'outbound'
  and tool_calls is not null
order by created_at desc
limit 5;
```

**Each block is its own paste boundary.** The Supabase editor renders only the last
statement in a batch — the taxonomy band's standing lesson, applied to SELECTs.

---

## 11 · WHAT THIS DELIVERY DOES **NOT** DO

- **No unvetoed copy.** Eight signed bytes, all pinned. Two user-facing bytes were found
  wanting and **left alone** because they were not on the sheet (§8 ⓶, §8 ⓷).
- **No W-1 beyond the two granted lifts.** §9.4 asserts `miraSoul.js` is untouched.
- **No `CAP_BYTES` edit.** §9.5 asserts the frozen 10.C home is byte-untouched.
- **No DDL. No migration. No SQL that writes.**
- **No `mediaDeclaredType`.** §6, and the contaminant sweep reads zero across the tree.
- **No push.** LE never pushes.

Sequencing beyond this sitting is the founder's.
