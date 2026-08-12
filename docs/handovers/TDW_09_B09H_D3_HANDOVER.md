# TDW_09 · B-09H · DELIVERY 3 — THE STRUCTURAL HALF. THE PHOTOGRAPH KEEPS ITS WORDS AND ITS PATH.

**Repo:** `dream-os` · **base:** `e4e1267` (re-derived fetch-first at delivery; `origin/main` = `e4e1267`)
**Role:** LE under CE-32. The executor never pushes; this ZIP is the founder's to apply.
**Routing:** R-31.2 — chair BEFORE origin. §1α (the 7-day push-hold) was VACATED by founder ruling
mid-sitting; routing is unchanged, the hold is gone, the founder applies and pushes on the chair's green.
**Charter:** the D-3 kickoff + CE-32's ruling on this seat's read-first.

---

## 1 · WHAT SHIPPED — SIX OF NINE ITEMS, AND THE THREE ABSENT ONES ARE ABSENT BY RULING

| file | what |
|---|---|
| `src/lib/metaInbound.js` | F-05.79 — the caption rides the media descriptor (fork **c-2**) |
| `src/lib/brideInbound.js` | F-05.79 — `mediaCaption` surfaced, reaches the save + the audit body · F-09.178 — `media_url` on the bride inbound row |
| `src/brideIndex.js` | F-09.178 **(b′)** — `media_url` on the circle member's inbound row (narrow radius, ONE insert) |
| `src/lib/imageOCRRouter.js` | F-09.179 — the log honesty split (fork **d**) |
| `scripts/b09_d3_structural_bench.js` | NEW — 30 cells, 27 run, 3 declared-skipped, ten production mutations |
| this handover | — |

**HELD, NOT MISSED — the (a)-cluster.** F-09.171 (the marker), F-09.175 (/surprise sends the raw
system note) and F-09.176 (the stale injection narrative, which retires with (a)'s diff) are ruled
**BUILD-HELD** by CE-32 until the founder relays **duty (a)** and **⑤(b) the identity predicate**.
Zero bytes were written toward them. The bench carries them as three **declared skips with reasons
printed in its own summary** (§7.1–§7.3) rather than silently omitting them — the absence is on the
record every time anyone runs it.

**Still unreceived at delivery:** duty (a) and ⑤(b) bodies. §0.2 stands.

---

## 2 · THE RULINGS, CARRIED AS CODE

**Fork c-2 — the caption rides the DESCRIPTOR.** `_messageMedia` returns `caption` on the media
object; the field had **zero readers estate-wide** when it was added, so every existing consumer is
byte-unmoved. The rejected arm (c-1, promoting the caption into `_messageText`) is refused **in-comment
with its reasons**, because it would have changed vendor behaviour AND — on both lanes — routed caption
text through the STOP-word, nudge-word and `surprise me` branches. **A photo captioned "stop" would
have opted its own sender out.** That is asserted, not just argued: cells §1.3, §1.5 and §2.4.

**Fork b — SYMMETRY.** The bride row writes `resolvedMedia.stableUrl`, the vendor lane's own witnessed
value (`vendorInbound.js:386`). A storage object path would need a bucket, a prefix and a signing rule
to become openable again; the url is openable as written. Cell §3.3 reddens on a path.

**(b′) — the circle row.** Same disease, same cure, same value, one insert. This is the door
F-09.173's eaten photograph actually arrived through, so a census that could not open THIS row could
not open the specimen.

**The bodyForLog sub-fork — RULED YES, and its consequence is named not hidden.** Where the
placeholder described an IMAGE, her caption stands in its place (the vendor's `caption ||
'[calendar image]'` shape, mirrored). `inboundForEngine` is defined as "the same synthesized string we
wrote to the audit log", so the agent's context now carries her caption too — cell **§3.6 asserts that
agreement** rather than leaving it to be discovered. **The non-image branch is deliberately UNMOVED:**
its string carries the media KIND ("video", "voice note", "PDF"), the only record that the estate
received something it cannot process, and a caption must not erase it.

**Fork d — the split.** Two branches, two lines, and the error's **code and message are no longer
thrown away**. Behaviour is unchanged by ruling: both facts still default to muse. Cell §5.4 is the
guard that keeps this a log cure.

**F-06.85 mechanism comments** sit at all three new persistence/normalization sites: each names the
seam it depends on (the F-09.173 webhook resolve; the synthetic Twilio-shaped envelope) so the next
sitting on that mechanism is forced to re-read these lines.

---

## 3 · PROOF — 27/27 RUN GREEN, TEN PRODUCTION MUTATIONS

Bench run **bare**, exit code as the second independent method. Cured tree: **total 30 · run 27 ·
passed 27 · failed 0 · skipped 3 (reasons printed)**, **exit 0**.

Every mutation below was **RUN against the production file**, the bench re-run, the file restored.
None is asserted from reading. Comments cannot absorb any of them — all ten mutate executable code.

| # | production mutation | cells reddened |
|---|---|---|
| M1 | `_messageMedia` drops `caption` (**the uncured tree**) | §1.1 §1.2 §1.4 §1.6 §2.1 §3.4 §3.6 |
| M2 | `metaInputsFrom` stops surfacing `mediaCaption` | §1.4 §1.6 §2.1 §3.4 §3.6 |
| M3 | **the REJECTED arm c-1**: caption promoted into `_messageText` | §1.3 §1.5 §2.4 **§6.1** |
| M4 | `sourceCaption` stops reading `mediaCaption` (F5 blocked again) | §2.1 |
| M5 | `bodyForLog` stops preferring the caption | §3.4 §3.6 |
| M6 | the bride inbound row drops `media_url` (**the uncured tree**) | §3.1 §3.2 §3.3 |
| M7 | the bride row writes an OBJECT PATH instead of the stable url | §3.1 §3.3 |
| M8 | the circle row drops `media_url` (**the uncured tree, b′**) | §4.1 §4.2 |
| M9 | the split collapses back to ONE warn (**the uncured tree**) | §5.1 §5.2 §5.3 |
| M10 | the EMPTY branch stops defaulting to muse | §5.2 §5.4 |

**M3 IS THE ONE TO READ.** The arm the chair rejected reddens **§6.1 — the vendor-lane-byte-unmoved
cell**. The narrow radius is enforced by a bench that fails, not by a sentence in a handover.

**§1–§3 drive the REAL production path end to end**: a raw Meta webhook body → the real
`normalizeMetaInbound` → the real `metaInputsFrom` → the real `processBrideInbound`, with a capturing
supabase fake, so cells read the row production actually built. **§4 declares its limit rather than
papering it:** `brideIndex.js` calls `app.listen()` at module scope and cannot be required, so its
insert object is **cut from the production file on stable code markers and evaluated**; §4.3 proves
the extractor throws loudly when a marker moves (failure mode differs from a grep's silent zero), and
M8 proves the cells have teeth.

`node --check` clean on all four production files. `npm ci` EXIT 0 · `npm run build` EXIT 0.

---

## 4 · THE FLOOR — PAIRED BEFORE AND AFTER THE DIFF, IDENTICAL

Twenty-two benches run bare on the cured tree, then the diff stashed and all twenty-two re-run.
**The two result sets are byte-identical** (`diff` clean). No figure moved; **no labelled amendment is
owed** — the two pre-ratified amendments (the `b05_arc_m1` two-caller tripwire, the b09 surfacer stub)
were **not triggered**, because the (a)-cluster that would have touched the surfacer is held.

Greens at their sealed counts: b09 media **27/27** · meter **38/38** (`tools/bench/`) · gate bOB_d2
**40/40** (GAP 6.4 declared-and-printing) · tier **81** · billing **52** · selfserve **30** · micro
**23** · forkc **113/113** · relay_hand **126** · bride_arrival **103** · relay_foundations **42** ·
f0613 **40/40** · oow **74/74** · prospect intake **13** / exit **36** / board **10**.

Elders at their pinned reds, unchanged: b06_meter **28/29** · f0555 **22/23** · f0772 **158/159** ·
b05_p4 **46/48** · combined_cap **36/37** (§6.4 LAWFUL-STALE, F-05.77's fourth specimen — this diff
neither cures nor worsens it).

**TWO KICKOFF FIGURE DRIFTS, DERIVED NOT ASSUMED (№1 class, reported for the chair's register):**
- **`b07_p5` is 114/114, not the sealed 136.** Paired: **114 before my diff and 114 after**, so this
  is pre-existing cite drift, not movement. It smells like F-05.77's species; the chair rules whether
  it folds there.
- `scripts/b09_f09173_bench.js` does not exist; the file is `b09_f09173_bride_media_bench.js`
  (already owned by the chair as CE-32.c1).

---

## 5 · R-31.2 — THE COLLISION CHECK, EVIDENCE FIRST

`brideInbound.js` is the named multi-seat file. **OB-D D-2's three anchors are byte-untouched and
LINE-UNMOVED**, derived after my diff:

| point | OB-D anchor | line before | line after |
|---|---|---|---|
| A | `require('./onboardingGate')`, immediately after the `coupleAiCap` require | `:52` | `:52` |
| B | `const safeName = (claim.invitee_name \|\| profileName \|\| '')…` + its 16-line F-06.85 comment | `:271` | `:271` |
| C | the `+30` gate block between the `!couple` dead-end and the `TDW_10.C · THE METER` comment | `:385`–`:398` | `:385`–`:398` |

My hunks are at `:75`, `:485`, `:562`, `:567`, `:569`, `:583`, `:588`, `:837` — and the first is a
**one-line-for-one-line** replacement, so nothing above `:485` shifts at all. **No existing line is
deleted, moved, or re-indented.** The whole non-comment diff in this file is nine lines:

```
-    trimmedBody, numMedia, hasMedia, mediaContentType, mediaUrl, rawPayload,
+    trimmedBody, numMedia, hasMedia, mediaContentType, mediaUrl, mediaCaption, rawPayload,
+      sourceCaption = mediaCaption || sourceCaption;
-      bodyForLog = '[forwarded an image]';
+      bodyForLog = mediaCaption || '[forwarded an image]';
-      bodyForLog = '[forwarded an image — save failed]';
+      bodyForLog = mediaCaption || '[forwarded an image — save failed]';
+      media_url:       mediaUrl || null,
+    mediaCaption:     (media[0] && media[0].caption) || null,
```

---

## 6 · RESIDUALS, DECLARED AND OWED — none of them papered

**⓵ THE CIRCLE DOOR'S CAPTION IS STILL DISCARDED. UNRULED, NOT BUILT.** Fork c-2 was ratified as
proposed, and my proposal threaded the caption through the **bride adapter only**. The circle door
receives the **synthetic envelope** (`{ body: { MediaContentType0, MediaUrl0 } }`), which carries no
caption field, so `brideIndex.js:577` still computes `sourceCaption = trimmedBody || null` — always
null on a Meta image inbound. **F5's caption clause is therefore cured for the bride and STILL
UNREACHABLE for the circle member**, who is the person whose photograph F-09.173 ate. I did not widen
the envelope on my own reading: that is the unruled-arm law, and the envelope is F4's KEPT-AND-NAMED
vestige which no seat should extend without a ruling. **PROPOSED for the chair:** add `MediaCaption0`
to the envelope at `brideInbound.js:186` (one field, same vestige shape, one reader) — or rule the
envelope retired and pass normalized inputs. One line either way; it needs a ruling, not a guess.

**⓶ CAPTIONS ON NON-IMAGE MEDIA are still discarded** at the bride door's audit body by deliberate
choice (§2 above). The descriptor now carries them for every kind, so the data exists the moment
anyone rules a use for it.

**⓷ D-2's OWN RESIDUAL IS UNCHANGED AND STILL OWED TO .174's SITTING:** when media is present but the
resolve FAILS, control still lands in the note branch. It is now *less* opaque — the row carries her
caption as its body and `media_url` null — but "present-and-unsaved" still has no honest per-turn
state. That is `.174`'s ruled cure, D-4's, and this sitting does not paper it.

**⓸ THE (a)-CLUSTER'S TENSION, restated for whoever rules duty (a):** stripping `[session_id: uuid]`
from the wire and the row kills `execListMuse`'s playback channel unless a replacement lands, because
the uuid exists in history **only** in the marker persisted at `brideInbound.js:708`. Note that the
composer already pre-persists a CLEAN summary to the couple_self thread (`brideEngine.js:2005-2028`) —
the clean object exists today; only the wire-bound string is dirty.

---

## 7 · THE WALK CARD — RECONCILED STEP BY STEP AGAINST THE BUILD LIST

The live witness is the **founder's, declared-not-claimed**. Nothing below was witnessed by this seat.
Walk after the push deploys, **one step at a time**, pasting results before the next step.

**FIXTURE-STATE FIRST (step 0), per the fixture-state law.** Every step below names its precondition.
The founder's desk already holds the **authored eaten-photo census SELECT** — **step 0 consumes its
rows and nothing else does.** The **duty-(a) / .174 ground-truth SELECTs are NOT consumed by this
card**: their findings are held, and a card that walked them would be walking an uncured tree.

| # | step | what it proves | evidence the EXECUTOR reads | fixture-state precondition |
|---|---|---|---|---|
| 0 | Run the census SELECT + SELECT A below | the baseline: how many `[image]` rows point at nothing today | pasted rows | none |
| 1 | From `+919625759924`, send a photo **with a caption** ("gold tissue, like this") | F-05.79 + F-09.178 + the bodyForLog sub-fork, all three in one act | SELECT B: newest `messages` row — `body` = her caption, `media_url` = an `https://…/wa-media/bride/…` url; SELECT C: newest `muse_saves` row — `caption` = her caption | her couple row exists; she is under her daily cap (else the capped path answers instead) |
| 2 | Open the `media_url` from step 1 in a browser | the path is a PATH — the record can reach the photograph | the image renders | step 1 green |
| 3 | From `+919625759924`, send a photo **with no caption** | the fallback survives; nothing is invented | SELECT B: `body` = `[forwarded an image]`, `media_url` non-null; SELECT C: `caption` null | as step 1 |
| 4 | **Circle member (Mehek, `8757788550`)** forwards a photo | (b′): the circle row now points at the photograph | SELECT B scoped to the circle thread — `body` = `[image]`, `media_url` non-null | her `circle_members` row is `status='active'`; the couple is under the circle cap |
| 5 | Send a photo captioned **"stop"** from `+919625759924` | the routing firewall — a caption cannot opt its sender out | Railway: **no** nudge/opt-out line; SELECT C shows the save landed with `caption='stop'` | **HANDSET-ONLY** (below); her `nudge_optout` state is not `opted_out` beforehand |
| 6 | One **vendor** image from `9888294440` | the narrow radius held — the vendor lane is unmoved | Railway `[webhook:vendor-image]`; SELECT B on the vendor thread — `media_url` still written, `body` still `[calendar image]` | vendor `onboarding_state='complete'` |

**STEPS ONLY A HANDSET CAN WITNESS** (provable-equivalent doctrine): steps 1–6 all require a real
WhatsApp send — a caption cannot be produced from the build container at all, since it exists only on
Meta's wire. **Step 5 is the sharpest of these**: the bench proves the mechanism (`inputs.body` stays
empty, §1.5) but only a handset proves the whole live path refuses to opt her out. Steps 2 and 6 have
no bench equivalent by nature. Everything else in this delivery is proven end-to-end by cells.

**RECONCILIATION AGAINST THE BUILD LIST:** step 1 → F-05.79 + F-09.178 + sub-fork · step 3 → the
fallback · step 4 → (b′) · step 5 → the c-1 rejection · step 6 → the vendor-unmoved guard ·
**F-09.179 has NO walk step** and that is correct: it is a log-only cure with no user-visible surface,
and its two lines are Railway artifacts. If the founder wants it witnessed, it needs a deliberately
broken Vision key — **not proposed, and not run without a ruling.**

---

## 8 · FOUNDER-RUN SELECTs — read-only, zero placeholders, every column witnessed

SQL-provenance: every column below is witnessed at `docs/db/PUBLIC_SCHEMA.md` — `public.messages`
(18 columns; `media_url` col 6, `body` col 5, `direction` col 3, `channel` col 4, `sent_by` col 7,
`created_at` col 11) and `public.muse_saves` (16 columns; `caption` col 8, `save_number` col 3,
`image_url` col 6, `saved_by_role` col 12, `created_at` col 13). No DDL is chartered and none is
needed — every column already exists. `PUBLIC_SCHEMA.md` is at ladder `0099` and the ladder tail is
`0122`; neither table is altered by `0100`–`0122`, so the doc is the starting witness and these
SELECTs are read-only regardless.

**SELECT A — the baseline (run at step 0, beside the census):**

```sql
-- A · How many bride-lane image inbounds currently point at nothing?
select count(*) filter (where media_url is null) as pointing_at_nothing,
       count(*)                                   as image_rows_total
from public.messages
where direction = 'inbound'
  and channel   = 'whatsapp'
  and (body like '[forwarded an image%' or body = '[image]');
```

**SELECT B — the newest inbound rows (run at steps 1, 3, 4, 6):**

```sql
-- B · The last 5 inbound rows: does the record keep a path to the photograph?
select created_at, direction, channel, sent_by, body, media_url
from public.messages
where direction = 'inbound'
order by created_at desc
limit 5;
```

**SELECT C — the save the caption rode (run at steps 1, 3, 5):**

```sql
-- C · The last 5 saves: did her words arrive on the row, one act one row?
select created_at, save_number, saved_by_role, caption, image_url
from public.muse_saves
order by created_at desc
limit 5;
```

**Console/dashboard acts required: NONE.** No env var, no Railway variable, no Meta setting, no
Supabase flag changes in this delivery. If a step goes red the founder pastes the rows and this seat
reads them; nothing here is self-diagnosing.

---

## 9 · WHAT THIS DELIVERY DOES **NOT** DO

- **No copy.** Copy inventory is ZERO as expected. No vendor-facing or model-voiced byte moved. The
  two log lines are log lines (reviewed, exempt from veto). Comments are comments.
- **No W-1.** Zero bytes in any soul, lens, engine, or prompt file. No inline prompt literal was added
  or moved anywhere.
- **No DDL. No migration. No SQL that writes.**
- **No architecture.** The single-persist merge is the (a)-cluster and is HELD.
- **No push.** LE never pushes.
