# TDW_08 · P5 PHASE 3 — HANDOVER: THE CLOSER

**Base:** dream-os `3b6fa97` · dreamos-pwa `19978c7` (ZERO pwa bytes this phase)
**Sitting:** LE, twenty-first CE chair's charter, 2026-08-04
**Soul:** `maya-v1` · 9,771 chars / 10,000 · **Manual:** `v1`

---

## 1 · WHAT SHIPPED

The marketing lane's first AI. `src/lib/prospects.js` carried a sentence from Block 05 saying the Closer soul would slot in at its seam with zero transport change; that day arrived and the sentence kept its promise. **MAYA** answers where `prospectCopy.holding_line` stood, and not one transport byte moved.

The Closer was Block 06's P2, never built, carried out of Block 06 with nothing filed forward — **F-08.51's orphan class**. CE-187 homed it here.

---

## 2 · THE RETIRED BYTES — PRESERVED IN FULL

`prospectCopy.holding_line` is **EXPECTED-DEAD at the seam** as of this phase. The founder's own bytes (CE-67, softened on his ruling), recorded here verbatim so the record survives the retirement:

> Good to hear from you — thanks for reaching out! Tell me a bit about your business whenever you like.

**The constant and the string remain in `src/lib/prospectCopy.js`, untouched.** Neither was deleted: `HOLDING_LINE_KEY` still resolves, no other reader breaks, and a vetoed founder line is not removed from the estate because one seam stopped calling it. Only the *call site* retired.

**Byte-untouched, stated:** `opt_out_confirmation` (*"You're opted out — you won't hear from us again. Reply START any time if you change your mind."*) · every template body in `templates.js` · every transport string in `sendWa.js` and `metaCloud.js` · `GRACEFUL_TURN_LINE` in `marketingIndex.js`, which the CE ruled stands as the failed-call line with zero new bytes.

**New model-voiced copy, all founder-vetoed:** `MAYA_SOUL` (two veto rounds, one amendment on 「 swap 」) · the F-08.55 redirect line (his own bytes, one sentence, 「 i just want this 」) · F-08.54's replacement frame in `demo/vendor.js` (approved under 「 im ok with the proposals 」).

---

## 3 · DECLARED DEVIATIONS — DISCLOSED, NOT PAPERED

### 3.1 · The facade call shape

FORK 3 ruled *the facade, harvest.js's precedent*. `harvest.js:122-125` ternaries on `route.provider === 'anthropic'` and hands the anthropic leg to an **injected** `anthropic` client. **This service has no such client** — `marketingIndex.js` never builds one. So `closerEngine` calls `llmCreate` for **both** legs.

**This is provably the same call, not an approximation.** `src/lib/llm.js:73` reads:

```js
if (p === 'anthropic') return params; // byte-identical path — untouched
```

`llmCreate` then calls `clientFor('anthropic').messages.create` on exactly those params. **The bench asserts the object identity** (`translateFor('anthropic', params) === params`) rather than this paragraph asserting it.

### 3.2 · The bench's home

R2 ruled `scripts/`. The 06 spec sited the bench at `src/agent/bench/`, which does not exist and never has. Estate convention beats the spec's path.

### 3.3 · `PRODUCT_LINK` — a copy byte flagged, not minted

S-6's fallback close needs a product link when a prospect has no demo. **No vendor-signup deep-link constant exists anywhere in this estate.** `closerEngine.PRODUCT_LINK` is the product root `https://thedreamwedding.in`, which is what live code uses (`api/couple/circle.js`, `api/vendor/ig.js`). Invite codes are retired (W-8), so the admin console's *"enter code"* shape is dead and was not copied. **If the founder wants a deeper path this is the one byte to change, and it is his.**

---

## 4 · THE SPEC-P2 DRIFT — NOW SIX LIMBS

`docs/specs/TDW_06_WA_AGENT_FINAL.md:64-65`, authored 2026-07-14, is stale on its own sentence in six ways:

1. **Arity** — `resolveModel('wa_marketing', —, 'victor')` vs the live `resolveModel(supabase, surface, tier)`.
2. **Argument order** — the first argument is `supabase`, not the surface.
3. **Role mechanism** — there is no role param; per-role splits ride route-object fields `donna_provider`/`donna_model` (TDW_02 P7 Amendment Two).
4. **Bench path** — `src/agent/bench/` does not exist.
5. **Swap file** — *"replaces the holding line in `marketingIndex.js` turn handler."* The holding line lived at `prospects.js:230`/`:235`. **Code beats spec.**
6. **Context source** — *"`ig_handle`, `category`, `city` from the prospect row."* On the live fixture all three are NULL on `prospects` and populated on `demo_vendors`. **CE ruled: demo row primary, prospect row fallback.**

`wa_marketing` occurred **once repo-wide** at charter — that spec line itself. Zero in `src/`, zero in `db/migrations/`, zero in `DEFAULTS`. The wiring was a birth, not an inheritance.

---

## 5 · R1 AS AMENDED — WHERE THE VERSION STAMP ACTUALLY LIVES

The spec required the version const *"stamped into the message ledger meta."* **It cannot be.** `public.messages` is 20 columns at `information_schema` and carries **no `meta`**. The `meta jsonb` Block 06's F-06.3 cure used is `0081`'s, on **`engine.messages`** — a plane this lane never touches (`ENGINE_SCHEMA.md:23` names exactly this trap). `logMessage` writes five fields.

**Executable home, CE-ruled:** `CLOSER_SOUL_VERSION` rides the transport log line on every turn, beside the parsed `MANUAL_VERSION`, the provider, the model, the wake reason, the nudges standing, and the token/cache counts. A row-level column returns only if the founder ever wants per-message provenance — one migration and one line in `logMessage`, and `closerSoul.js` says so where whoever does it will find it.

---

## 6 · THE F-06.105 RIDER — RECORDED

Bench and scenario fixture names in Maya's lanes are **full-name-grade disjoint** from all five estate personas — Victor · Donna · Mira · Eliza · Maya — near-twins included. **The R-a family is barred outright** rather than checked case by case: the existing Riya/Rhea fixtures appear in no scenario of hers, because F-06.105 was minted on a first-name collision that read as disjoint until it wasn't.

---

## 7 · F-08.53's THREE LIMBS

**Live-form tells** — every bench cell drives production code paths, never a copy of them. The `0110` seed asserts against `modelRouter`'s own `DEFAULTS` object rather than a string pasted into the bench, so seed and default cannot drift apart silently.

**Bang-free lines** — no bench cell asserts on a `!`-negated shape whose passing state is indistinguishable from an absent one; the guard cells assert both the positive (`isRegisteredUser` true on both phone forms) and the negative (a stranger, and a thrown lookup failing open).

**Every check limb proven able to fire** — ten `--mutate=` arms against **production source**, each named, each producing a clean red with a readable count. `--mutations` prints the list. A mutation whose anchor has moved **exits 2 with a stated reason** rather than passing quietly, so a stale mutation can never masquerade as a proof.

---

## 8 · THE FLOOR AT SEAL — PAIRED STATUS DISCLOSED

```
b08_p5_closer_bench          64   NEW, joins the floor
b5c_prospect_lane_bench      47   labeled amendment · COUNT PRESERVED
b08_p1_lifecycle_bench      105 + 1 skip   two labeled amendments · COUNT PRESERVED
b08_p3_seeing_surface_bench  61   byte-stable
b08_console_bench            71   byte-stable
b08_p4_factory_bench         83   byte-stable
b08_p5_invite_bench          35   byte-stable
b07_f0789_phantom_columns    19   byte-stable  ← ABSENT FROM THE CHARTER (R3)
b07_f0774_stripper_bench     19 + 1 named skip
b07_p6_bench                 29   byte-stable
b07_f0784_panel_bench        59   byte-stable
b07_p1_bench                 71   ⚠ LONE — charter's 75 is the PAIRED number
b07_p5_bench                114   ⚠ LONE — charter's 136 is the PAIRED number
dreamos-pwa floor            —    ⚠ NOT RUN
```

**The two LONE floors and the unrun pwa floor are named rather than reported as green.** `dreamos-pwa` was not checked out in the build container, so the sibling-dependent halves could not run. **This is F-08.50's exact class and it is disclosed by the sitting that filed R3 against it.** The pwa floor must be run before the seal is claimed complete.

---

## 9 · THE BENCH AMENDMENTS

**`b5c_prospect_lane_bench`** — the holding-line cell asserted `prospectCopy.PROSPECT_COPY.holding_line` on the wire. **CE-59's both-sides clause**: when one sitting changes both sides of a contract, the bench drives the new caller's payload and the old shape's green is **retired, not retained**. Re-aimed at the Closer's reply over the same free-form Meta transport; the transport predicate is byte-unchanged and is the load-bearing half. The STOP cell now injects a `closerTurn` that **throws**, making "STOP reached the Closer" a mechanical conviction. **47 → 47.**

**`b08_p1_lifecycle_bench` ①** — the fake query builder had no `.limit()`. The seam's new path calls it, so §15.2 died on a harness gap, not a defect. Capability added; no predicate weakened.

**`b08_p1_lifecycle_bench` ②** — every seam call injects a stub Closer turn. Without it, §15.2 asserted nothing about the demo restore and everything about whether the container held an API key. Declared as a hoisted `function` after a `const` produced a TDZ crash the bench caught on its own first run of the amendment.

**Both preserve `105 / 0 / 1` exactly, identical to the pristine tree. Ratify-or-revert.**

---

## 10 · DOC-GAPS FILED

1. **`PUBLIC_SCHEMA.md` is stale on the demo plane** — `demo_vendors` documented at 14 columns, live at **26** (all of `0106`'s ten, `0107`'s `sunset_at`, `0109`'s `invite_sent_at`); `demo_leads` at 13, live at **15**; `messages` at 18, live at **20** (`0105`'s `sender_name`, `sender_user_id`).
2. **`linkage_held_by` is not a column** — it is a server-computed payload field at `api/admin/demoAdmin.js:222`. CE-182's predicate reads a computed value. Filed so no future sitting writes SQL against it.
3. **The spec-P2 drift, six limbs** — §4 above.
4. **F-08.11 remains open** — `last_template_at`'s meaning is module-scoped to `demoLeadAlert` while its name is global. Confirmed at source during this sitting's whole-read; the near-miss it produced was exonerated, not filed.

---

## 11 · THE ACCEPTANCE EVENINGS — WHAT THE CARD MUST CARRY

**The prospect role walks from a CLEAN, NON-REGISTERED handset. This is a named founder act:** he procures a fresh number before evening one. `+919888294440` returns one `users` row (`ec4232ae-d670-4538-ab65-0be9f51a37af`) and is therefore **the guard's own live witness**, not the prospect.

**The `94440` step is a walk step, not a failure.** Texting the marketing line from it must return exactly:

> You're already with us — this line is for people we haven't met yet.

**and nothing after it.** No Maya turn, no second sentence.

**The fixture's own shape, for the transcript read:** `swatitomar_p4b` is `invited`, `active = true`, `discover_eligible = false`, `sunset_at` NULL, zero `demo_leads`. So on that row **the clock is SILENT in both senses** — `invited` rows carry NULL `expires_at` because the 72h window opens at the first enquiry, and `discover_eligible = false` excludes the row from the 90-day sweep. Maya has no deadline to reach for, and the enquiry count collapses to nothing. **Any "days left" or "enquiries waiting" sentence on that walk is a red.**

---

## 12 · SEQUENCING FROM HERE

1. Founder runs `0110` with its confirmation SELECT, **before** the apply.
2. Apply the ZIP; full floor PAIRED against the fuller list; pwa floor run.
3. `node scripts/b08_p5_closer_scenarios.js` on **both lanes**; transcripts tee to `scripts/out/`.
4. **Founder reads the transcripts. His approval gates the deploy.**
5. The acceptance evenings, on his handset — the clean number as the prospect, `94440` as the guard's witness. Reds file to the CE and are ruled, never papered.

**§0.2 stands above all of it.**

---

# ADDENDUM · THE CURE SITTING (2026-08-04, same day)

The Phase 3 build above shipped at `c0d34ed` and the founder's transcript read
returned **RED**. This addendum records the cure.

## 13 · WHAT THE TRANSCRIPTS CONVICTED

Six findings, all minted at the CE, all from counts rather than impressions —
the repetition discipline corrected the chair's scope twice, which is the whole
reason CE-99 requires two specimens.

| | Finding | Evidence |
|---|---|---|
| **F-08.57** | the wake turn was conversed with, not obeyed | **9/9 Haiku** nudge sends carried stage direction or were wholly meta; **1/9** DeepSeek. Lane-asymmetric, and the seeded lane was the failing one. |
| **F-08.58** | the reveal never landed before the close | **0/6, BOTH lanes.** Not defiance — she reveals instantly when asked. The moment had no trigger. Re-scoped from a DeepSeek defect to a design gap. |
| **F-08.59** | fabricated provenance under a candour wrapper | *"Your number came from publicly available business listings"* — invented, on the one question with legal weight. |
| **F-08.60** | the money register's tier breach | Haiku attached the range's ceiling to a named tier. Manual §9 forbids per-tier prices by name. DeepSeek got this right; **the architectures are unsafe in different places.** |
| **F-08.61** | a handed constant re-typed and shipped dead | `/demo/<handle>` for `/demo/vendor/<handle>`. |
| **F-08.62 / F-08.63** | the fabrication family | *"nobody else can see it but you"* against a provably public endpoint; and *"The Manual says two more after the first silence"* — invention **inside** the anti-invention document. |

## 14 · THE CURE, AS RULED

**Mechanical (F-08.57, F-08.61).** The user-role wake is **deleted**. The standing
is now a fact in the dynamic context, in the same register as the clock and the
enquiry count; a nudge history is truncated at the prospect's last inbound so no
trailing assistant turn invites a prefill; a woken turn may return nothing and
transport sends nothing, **and logs nothing** — an unsent message must not raise
the derived standing or silence would spend one of her two. The link normalizer
byte-replaces any URL carrying this vendor's handle with `claimLinkFor`'s own
output, and fails safe in three directions.

**Post-hoc preamble stripping was REFUSED BY NAME at the CE**: a scrub over a
confused speaker is papering. The speaker stopped being confused instead.

**Soul (F-08.58, F-08.60, F-08.62, F-08.63).** Three vetoed deltas: the
link-is-the-close binding (ONE home, in THE REVEAL; THE CLOSE deliberately
untouched so the rule cannot fork), the fabrication-taste paragraph naming
F-08.63's own specimen, and the price craft line naming the convicted inference.

**Manual → v2 (V-4).** The demo page's visibility truth enters §10, witnessed at
`src/api/demo/vendor.js:2-4`. The header re-stamps and the version bumps —
**and the two-breakpoint cache design pays off exactly here**: the Manual segment
invalidates once, the soul segment's cache survives untouched.

**The ceiling: 7,000 → 10,000 → 11,500**, each move with its arithmetic in
`closerSoul.js`. The final move rests on a **measurement**, not an argument:
`cache_read=6518` Haiku, `6144` DeepSeek, every warm turn, from the founder's own
run.

## 15 · F-08.59 — THE PROVENANCE SLOT STAYS OPEN, NAMED

RULED: she answers *"I don't know exactly — let me find out"* and routes it.

**No provenance sentence enters the Manual, and the reason is the finding itself:**
neither the chair nor the executor may author a fact about the founder's sourcing.
The CE inventing that sentence would be F-08.59 committed from the chair.

The day the founder supplies the true sentence it enters as **his bytes** and her
answer upgrades from honest ignorance to honest fact. Until then, honest
ignorance — which is what the whole arc says she does when the truth runs out.

## 16 · TWO NON-VACUITY REPAIRS, DISCLOSED

On the first both-ways run, `no_truncate` and `no_send_off` **both came back
GREEN**. The cells above them asserted source text and could not reach either
limb's runtime behaviour. **A mutation that does not go red is a cell testing
nothing.**

Fixed rather than noted: an injectable `llm` seam was opened on `runCloserTurn`
— for the bench and nothing else, because both limbs are observable only in its
return value — and four runtime cells added. Both mutations now fire.

`no_send_off`'s first fixed run then **crashed** instead of failing, taking the
count with it. Wrapped, per F-08.50: a red whose count nobody can read is not a
usable red.

## 17 · THE FLOOR AT THE CURE SEAL

```
b08_p5_closer_bench       89   (was 64) — 14 mutations, 14 clean reds
b5c_prospect_lane_bench   47   byte-stable
b08_p1_lifecycle_bench   105 + 1 skip   byte-stable
b08_p3_seeing_surface     61   ·  b08_console 71  ·  b08_p4_factory 83
b08_p5_invite             35   ·  b07_f0789   19  ·  b07_f0784      59
b07_p1  71 ⚠LONE   ·   b07_p5  114 ⚠LONE   ·   b07_p6  29
dreamos-pwa floor          —   ⚠ STILL NOT RUN
```

Two cells inside the closer bench were **re-aimed under CE-59's both-sides
clause**, disclosed in-file: the Manual-version cell (asserted `v1`, re-aimed at
the property rather than the value so it cannot go stale on the next
re-version) and the two-standing cell (the old wording *was* the narration bug's
raw material).

## 18 · WHAT GATES THE EVENINGS NOW

The full eleven, **×3 per lane**, counts read against this arc's counts:

```
node scripts/b08_p5_closer_scenarios.js
```

The numbers that must move: **stage-direction sends 9/9 → 0/9 on Haiku**, and
**reveal-before-close 0/6 → 6/6 on both lanes.** Anything less is another RED
and files to the CE rather than being argued down.

---

# ADDENDUM 2 · THE THIRD RED — THE STRUCTURAL SET (2026-08-04)

## 19 · ⚠ §0.2 — I COULD NOT RE-DERIVE THE CHAIR'S COUNTS

The relay named three transcripts and said to read all three whole before
building. **They are not in the repository at `5351a1b`.** `scripts/out/` holds
eleven files ending at `T07-27-44`; the three cited — `T07-53-36`, `T07-55-12`,
`T07-57-13` — are on the founder's Codespace disk and were never committed.

**So every count in §2 of the relay is the chair's read and I have verified none
of them.** The rulings stand on their own and this build executes them; the
counts do not enter any claim I make.

**What I DID re-derive at my own hand, and it is the load-bearing one:**
`b08_p5_closer_scenarios.js:130-131` called `llmCreate` directly and printed raw
model blocks. **F-08.65 confirmed independently.** And the chair's exoneration
reproduces exactly — `normalizeDemoLinks` on the mangled specimen returns
`corrected: 1`, so the transcript mangles were pre-normalizer raw text and
F-08.61 was already cured at the production seam.

## 20 · ⚠ §0.2 — THE CEILING, MEASURED AND STATED AS ORDERED

The relay said soul deltas ride ≤11,500. **They do not: 11,650**, after one
tightening pass that took 11,841 down. The remaining 150 cannot come out without
cutting ruled content.

`SOUL_CHAR_CEILING` is set to **11,750, EXECUTOR-PROPOSED, RATIFY-OR-REVERT**,
with the whole history and this reasoning in `closerSoul.js`. If the chair
refuses, one constant reverts and **the provenance line is the byte to re-cut,
not the `[NOTHING]` contract** — the token has an engine on the other side of it.

## 21 · THE SET AS BUILT

**THE LINK SIGNATURE** — founder-sealed bytes at the `runCloserTurn` seam,
fired on link-presence only, idempotent, appended **after** the normalizer so the
floor lands on a corrected link and never a dead one. The soul's REVEAL section
is untouched: the reveal stays character; this stops it being the only thing
between a stranger and F-08.64's *"Real person, not a bot."*

**THE `[NOTHING]` TOKEN** — one home in `closerSoul.js`, imported by the engine,
so the two sides cannot drift into different words. Silence now has a word she
can type; an empty completion never was one, which is why Haiku's exits were 0/3
meta. The exit wake also names itself: *"This wake is the goodbye… not a note
about having said goodbye."*

**THE PROVENANCE TRUE-BYTES** — honest ignorance plus the one true mechanism she
can actually offer: STOP ends it permanently. **On the veto list.**

**THE HARNESS CURE (F-08.65)** — the scenarios script no longer authors its own
context or reads raw blocks. It seeds ROWS and calls `runCloserTurn`, so the
context builder, the guard, the normalizer, the token, the signature and the
watcher are all in the instrument. Every transcript from here is what a prospect
receives. Per-turn output now prints `source · signed · normalized · flags`.

**THE WATCHER** — report-only, five convicted classes, `console.warn` at the
seam. **It blocks nothing and a bench cell asserts that mechanically**: no branch
returns or throws on a flag. Interception stays refused. Precision is UNMEASURED
and the log line says so in its own words.

## 22 · THE FLOOR AT THIS SEAL

```
b08_p5_closer_bench      110  (64 → 89 → 110) · 19 mutations, 19 clean reds
b5c 47 · b08_p1 105+1 · b08_p3 61 · console 71 · factory 83 · invite 35
b07_f0789 19 · b07_f0774 19+1 · b07_f0784 59 · b07_p6 29
b07_p1 71 ⚠LONE · b07_p5 114 ⚠LONE · dreamos-pwa floor ⚠ STILL NOT RUN
```

**Four cells re-aimed under CE-59, disclosed in-file**: the version cell (now
asserts the shape `maya-v\d+`, so it cannot go stale on every future delta), the
two exit-wording cells, and the normalizer runtime cell — whose expected text now
carries the signature, **which is itself the ordering it proves**.

`no_send_off`'s anchor had moved and the mutation silently failed to apply; the
harness exits 2 on a stale anchor rather than passing quietly, which is how it
was caught. Repaired and re-proven.

---

# ADDENDUM 3 · THE FOURTH RED — F-08.66 / F-08.67 / F-08.68 (2026-08-04)

**Base:** dream-os `1298a8d` · dreamos-pwa `19978c7` (**ZERO pwa bytes this
sitting**) — both re-derived at origin by `git fetch -q origin && git rev-parse
origin/main` at first motion, both equal to the charter's tips, both trees clean.
**Ruled to:** the twenty-first chair's OMNIBUS RULING, 2026-08-04 — §2 F-08.67
minted · §3 F-08.68 minted · §4 F-08.66 siting and frame bytes · §5 the standing
arms closed · §6 the records gap.
**Role:** EXECUTOR. Nothing here was pushed; the LE holds no write credentials.

## 23 · WHAT SHIPPED

| File | What |
|---|---|
| `src/agent/closerEngine.js` | `unansweredSendsFrom` (the truncation's exact complement) · `loadHistory` publishes the cut sends on the opts object · the ruled quoted-sends frame replaces the two count-speaking lines · the turn RETURNS `nudgesStanding` + `unansweredSends` · `quoted_sends=` joins the transport log line |
| `scripts/b08_p5_closer_scenarios.js` | F-08.68: the nudge fixture seeds **her answer**, so the exit wake is reachable · the transcript label is the ENGINE's number, never the loop's |
| `scripts/b08_p5_closer_bench.js` | 112 → **130** · four labeled amendments, all COUNT-PRESERVING in intent · two mutations RE-ANCHORED · four mutations NEW |
| `docs/FINDINGS_LOG.md` | CE-188 — the F-08.52 → F-08.68 index (§6 of the ruling) |
| `docs/TDW_08_P5_PHASE3_HANDOVER.md` | this addendum |

**W-1 CLEAN in the sense that matters:** `closerSoul.js` is **byte-untouched**.
W-1 was open for Maya's own files; the soul did not need a byte and did not get
one. Zero bytes in any other soul, lens, prompt or `src/engine/src`.

## 24 · THE CURE, AND THE ONE PLACE IT IS DEFINED

`unansweredSendsFrom(rows)` is written as `rows.slice(truncateAtLastInbound(rows).length)`
— **the complement, not a second scan for trailing outbounds.** A second scan
would be a second method for the same fact, which INDEPENDENT-METHOD clause 1
names as a drift surface rather than a check. Defined this way, **what the
context quotes is by construction exactly what the messages array lost**, and
the no-inbound case falls out correctly for free.

The cut rides back on the `opts` object `loadHistory` already receives — the
same named side channel, for the same stated reason, as `o.demoLink` in
`buildProspectContext`. `histOpts` is named rather than inline at the call site
because it is now the only thing standing between the two halves of one fact.

**THE SPOKEN COUNT IS GONE ENTIRELY** (§2's ruling). Not corrected — removed.
The block's opening line names what it counts in words, the quotes are the
count, and `nudgesStandingFrom` stays machinery for `runNudgeJob`'s fail-closed
cap. The exit declarative reads its condition off `sends.length`, the same rows
the quotes come from, so the declarative and the evidence beneath it cannot
disagree.

**F-06.85 NAMED, THREE MECHANISMS**, in-comment at the block: `runNudgeJob`'s
trailing-outbound predicate · `loadHistory`'s truncation · **`MAX_NUDGES = 2`,
because "Both follow-ups are spent" states the cap IN WORDS.** A bench cell
asserts the cap beside the sentence, so the pairing is mechanical.

## 25 · ⚠ DISCLOSED LOSS — ONE CONTEXT BYTE DOES NOT SURVIVE THE RULED FRAME

The old exit line ended *"…write the goodbye itself — **not a note about having
said goodbye**."* The chair's ruled exit declarative is *"Both follow-ups are
spent. What remains is the goodbye, or [NOTHING]."* **I shipped the ruled bytes
exactly and did not append to them.**

That anti-note clause was bought with evidence — **0/3 Haiku exits produced a
note instead of a goodbye.** Its equivalent survives in the SOUL, in her own
register: *"instead of arriving as a message announcing that no message is being
sent."* **The amended bench cell now asserts BOTH homes in one expression**, so
if that soul byte ever moves the loss cannot pass unnoticed. Named here rather
than papered; the chair may want the clause restored to context, and that is a
ruling, not mine.

The standing `[NOTHING]` offer on non-exit wakes is **retained byte-unchanged**
— existing ruled content (F-08.57's third limb), not re-authored. On the exit
wake it is not duplicated: the ruled declarative carries the token itself.

## 26 · THE BENCH — 112 → 130, AND WHAT EACH MUTATION CONVICTS

**FOUR LABELED AMENDMENTS**, each disclosed in-file with its reasoning, each
re-aimed under CE-59's both-sides clause (the old shape's green **retired**, not
retained): ① §8's exit cell · ②/③ §11's two context cells (the cell between
them, asserting context instructs her to compose nothing, is **byte-unchanged**
and now guards a larger block) · ④ the exit-wake cell, which is the disclosed
loss above.

**TWO MUTATIONS RE-ANCHORED, and this is the harness's own law working:**
`no_truncate` and `no_send_off` both had anchors inside lines this cure moved.
The harness **exits 2 on a stale anchor rather than passing quietly**, which is
how both were caught rather than silently going green. `no_send_off` additionally
needed a *unique* anchor once both no-send returns became byte-identical.

**FOUR MUTATIONS NEW**, each producing a clean red with a readable count and a
named cell:

| Mutation | Reddens |
|---|---|
| `no_quoted_sends` | the wake-state cell · the verbatim-order cell · **F-08.66 DELIVERED — the turn the model receives** |
| `speaks_count` | the frame-line cell · **F-08.67 — the block speaks no count at all** |
| `no_zero_collapse` | **F-08.67 — ZERO-COLLAPSE** |
| `no_returned_standing` | **F-08.68 — the turn RETURNS what it derived** · the independent-method agreement cell |

**THE DELIVERED-TURN CELL IS THE LOAD-BEARING ONE** and it was written because
everything else asserts the *builder*: a mutation could delete the quotes at the
seam and leave every builder cell green. It captures the `system` array actually
handed to the model through the injectable `llm` seam and asserts her sends are
in it.

**All 23 mutations run at the cured tree: 23 clean reds, zero stale anchors.**

## 27 · F-08.68 PROVEN AT THE FIXTURE, BY COMMAND

Production's shape is `inbound → HER ANSWER → wake → wake → exit`. Against the
cured fixture, the engine now derives, across the three wakes:

```
WAKE 1  standing=0  quoted=1
WAKE 2  standing=1  quoted=2
WAKE 3  standing=2  quoted=3   → "Both follow-ups are spent. What remains is the goodbye, or [NOTHING]."
```

**The exit wake is reached for the first time in this arc.** Her seeded answer
carries her name deliberately, because production's first outbound does, and
because the chair's §4 prediction is only measurable if the quoted evidence
contains what production's would.

## 28 · ⚠ §0.2 — A CORRECTION AGAINST MY OWN READ-FIRST

My read-first reported **"six silent `.ts` runners, pass-vs-broken not
established"** and refused to count them. **That refusal was right and the
observation was wrong.** All seven runners pass; the silence was an artifact of
my own `tail -1` over output ending in a blank line — a measurement reproducing
its own failure mode, INDEPENDENT-METHOD clause 1, against my own bench, in the
same packet that cited the law. Re-run with the summary line matched directly:

```
assign-words 24 · bands 11 · city 17 · crew 11 · post-access 25 · roster-mint 22 · settle 41
```

**151 cells, seven runners, rc=0 on every one.** The pwa floor is therefore
**28 `.mjs` + 7 `.ts`**, and the §5 build item closes as a *no-defect*.

## 29 · THE FLOOR AT THIS SEAL — PAIRED, SIBLING CHECKED OUT

```
b08_p5_closer_bench      130  (64 → 89 → 110 → 112 → 130) · 23 mutations, 23 clean reds
b5c_prospect_lane_bench   47  byte-stable
b08_p1_lifecycle_bench   106 + 0 skip   PAIRED
b08_p3_seeing_surface     61 · b08_console 71 · b08_p4_factory 83 · b08_p5_invite 35
b07_f0789 19 · b07_f0774 20 PAIRED · b07_f0784 59 · b07_p6 29
b07_p1 75 PAIRED · b07_p5 136 PAIRED
dreamos-pwa   tsc 0 lines on a cleared .next · 28 .mjs green · 7 .ts green
```

**The three-seal `⚠ dreamos-pwa floor NOT RUN` closes here.** `node --check`
clean on both touched `.js` files.

## 30 · COPY INVENTORY

**ZERO new user-facing bytes.** No prospect ever reads any byte in this
delivery. The context frame is machinery — model-visible, never wire-visible —
and its bytes are the chair's, ruled 2026-08-04, shipped unamended.

**ONE FIXTURE STRING, named so it is not mistaken for copy:** the harness's
seeded answer row. It is model-visible inside a bench fixture and reaches no
wire and no vendor. It is not on the veto list and it is not the founder's byte;
if he wants it to read differently, it is a fixture edit, not a copy act.

**The veto list is EMPTY. The build minted nothing.**

## 31 · WHAT THE NEXT SITTING PICKS UP

1. **The eleven ×3 through the true pipe, both lanes** — `node scripts/b08_p5_closer_scenarios.js`.
   The counts to read against this arc's: **self-reintroduction 7/9 Haiku,
   2/9 DeepSeek** (the chair's named prediction — should collapse) ·
   **exit wake, now reachable, 0/3 lifetime → measured for the first time** ·
   reveal-before-close · F-08.64 recurrence.
2. **F-08.64 is OPEN and recurred at `1298a8d`.** The specimen rides to the
   founder's transcript read. Interception stays refused.
3. **F-08.59's provenance slot stays open** — the founder's own sentence.
4. **The disclosed loss at §25** — the anti-note clause, chair's call.
5. **F-08.54's content is UNDERIVED and F-08.56 is an empty reserved address**
   (CE-188). Neither is reconstructable from the repo; both are named rather
   than invented.

---

# ADDENDUM 4 · THE POST-CURE RULING BUILT — §2 → §8 (2026-08-04)

**Base:** dream-os `710b4e5` · dreamos-pwa `19978c7` (**ZERO pwa bytes**) — both
re-derived at origin at first motion, both trees clean.
**Ruled to:** the CE's POST-CURE READ ruling, 2026-08-04, §2 through §8.
**Role:** EXECUTOR. Nothing pushed; the LE holds no write credentials.

## 32 · WHAT SHIPPED

| File | Ruling | What |
|---|---|---|
| `src/agent/souls/closerSoul.js` | §2, §4 | the fabrication root cause re-authored · the exit sentence gains its truthful clause · ceiling **11,750 → 12,100 EXECUTOR-PROPOSED** |
| `src/agent/closerEngine.js` | §3–§7 | F-08.70's declarative · the exit gate + `EXIT_LINE` · `isExitWake` one home · `DEMO_LINK_RE` scheme-optional · the sign-off upgrade · `called_*` on the line of record · the watcher tuned |
| `src/lib/modelRouter.js` | §6 | `_resetRouteCache()` — a named test seam, production never calls it |
| `scripts/b08_p5_closer_scenarios.js` | §6 | cache bust at every lane boundary · the facade declares what it forced · the turn line gains `called=`, `exit_gated=`, `(upgraded)` |
| `scripts/b08_p5_closer_bench.js` | all | **130 → 156** · 33 mutations, 33 clean reds · three re-anchored |
| `scripts/out/README.md` | §8 | NEW — the record explains itself where the files live |

## 33 · §2 — THE ROOT CAUSE WAS IN HER SOUL, AND THE CHAIR FOUND IT

The old passage said, in her own voice, that handle + category + city **meant**
she had looked at their work, and handed her a city-set reference as the
exemplar. *"That Jodhpur set with the late-afternoon light"* — against a fixture
whose city is Chandigarh — was **not a model inventing against her character. It
was her character, obeyed.** Re-authored so specificity comes from what is true,
never from images she has not seen, with the reason in the same breath (LD-5).

## 34 · ⚠ §0.2 — THE CEILING, MEASURED AND STATED AS ORDERED

**12,007 characters.** Three tightening passes (12,241 → 12,086 → 12,007). The
two ruled additions cost ~600 and retired ~330; the remainder cannot come out
without cutting ruled content, and **a ruled cure is not hollowed to hit a
number.**

`SOUL_CHAR_CEILING` = **12,100, EXECUTOR-PROPOSED, RATIFY-OR-REVERT**, with the
whole history and this arithmetic in `closerSoul.js`. On a *fresher* measurement
than the last move rested on: the founder's own run at `710b4e5` returned
`cache_read=7,033` Haiku and `6,656–6,912` DeepSeek on every warm turn.
**If the chair refuses:** the byte to re-cut is the **Jodhpur illustration** —
the example, not the rule — ~120 characters, leaving the reason still in the
same breath.

## 35 · ⚠ §0.2 — A DECLARED DEVIATION FROM §5's RULED MECHANISM

§5 ruled *"idempotence tests for the signature's SUBSTRING, not the whole
string."* **Read literally that reopens F-08.58.** A trailing `— Maya` IS a
substring of the signature, so it would count as already-signed and **suppress
the append** — leaving a link close carrying her name and no disclosure that she
is an AI, at the exact site the signature exists for.

**Reported, not quietly adapted.** What ships instead, EXECUTOR-PROPOSED,
RATIFY-OR-REVERT: the partial sign-off is **UPGRADED IN PLACE** — a trailing
bare `— Maya` is absorbed and the full signature takes its position. That
delivers the chair's stated outcome (one sign-off) without the consequence. If
the chair wants the literal reading, **one predicate reverts**
(`PARTIAL_SIGNOFF_RE`).

## 36 · §4 — THE EXIT GATE, AND WHAT IT IS NOT

Link-presence only — **the signature's own predicate**, no classifier, no
reading of her words for intent. It judges nothing she wrote; it observes that a
farewell is carrying an opening. Sited **after the normalizer** (so it lands on
a canonical link, including the scheme-less shape §5 just cured) and **before
the signature** (so the replacement is never signed as a close). Interception on
the content of her prose stays refused.

**⚠ NAMED, NOT BUILT:** the predicate is the DEMO link, mirroring the signature
exactly as ruled. A prospect with **no demo studio** closes on `PRODUCT_LINK`,
and that shape is **not covered**. Enumerated for the chair rather than widened
on my own reading.

F-06.85 is satisfied at both ends: the gate's comment names the soul sentence,
the soul sentence names the gate, and a bench cell asserts both.

## 37 · THE BENCH — 130 → 156, 33 MUTATIONS, 33 CLEAN REDS

**Ten mutations new** — `soul_looked` (the root cause put back) ·
`no_stale_declarative` · `exit_gate_off` · **`exit_gate_greedy`** (over-blocking
is a defect too: the gate must NOT fire on a non-exit wake) · `scheme_required`
(F-08.71's exact specimen) · `sign_no_upgrade` · `watch_costume_blind` ·
`watch_prov_narrow` · `watch_price_wide` · `called_ignored`.

**Three RE-ANCHORED** — `soul_ceiling2`, `sig_off`, `sig_doubles`. **`sig_doubles`
had been left pointing at a comment this cure reworded, and its stale form
CRASHED the require rather than reddening.** A mutation that cannot even load is
not a proof; caught by the harness's own exit-2-on-stale-anchor.

**The end-to-end cell is the load-bearing one for §5:** the hole was that a
scheme-less link defeated the **signature**, not just the normalizer, so the
cell drives `runCloserTurn` and asserts `normalized=1 signed=true` on the shape
that broke it.

## 38 · ⚠ F-08.73 MINTED — A BENCH IN THE ESTATE HAS BEEN RED FOR THREE SEALS

`b06_meter_bench` reads **28/29**, and `§3.2 no OTHER route moved — the whole
DEFAULTS map, key-for-key` has been FAILING since Phase 3 seeded
`model.wa_marketing.default`. **Proven both ways: identical 28/29 at `710b4e5`
and at the cured tree**, so it is not mine.

The bench pins `JSON.stringify(DEFAULTS)` against a five-key literal. Maya's
route is a legitimate sixth key. **The bench convicted a correct change and
nobody read the number** — F-08.50's exact class, three seals deep.

**NOT FIXED — the ruling released §2–§8 and this bench is outside it.** Reported
with its diagnosis so the amendment is one line for whoever is chartered: the
literal gains the `wa_marketing` row, or the cell narrows to the keys it means
to police.

## 39 · THE FLOOR AT THIS SEAL — PAIRED

```
b08_p5_closer_bench      156  (64→89→110→112→130→156) · 33 mutations, 33 clean reds
b5c 47 · b08_p1 106+0 · b08_p3 61 · console 71 · factory 83 · invite 35
b07_f0789 19 · b07_f0774 20 · b07_f0784 59 · b07_p6 29 · b07_p1 75 · b07_p5 136
modelRouter-adjacent (the one shared file touched):
  b06_advisor_route 16 · b06_wa_words 19 · b6_f79 19 · b6_f80 24 · b6_rider 32
  b06_meter 28/29 ⚠ PRE-EXISTING, F-08.73, proven both ways
dreamos-pwa (ZERO bytes): tsc 0 lines on cleared .next · 28 .mjs green · 7 .ts green
```

`node --check` clean on all five touched `.js` files.

**FLOOR-METHOD DISCLOSURE:** running the modelRouter grep sweep executed
`b08_p5_closer_scenarios.js`, which **wrote a transcript into `scripts/out/`**.
It was **deleted before packaging** and is in no ZIP. A container artifact in a
delivery is a byte nobody ruled (Phase 2's disclosure ③ is the precedent).

## 40 · COPY INVENTORY — TWO ITEMS, BOTH FOR THE FOUNDER

**Model-voiced, drafted under §2/§4's delegation, founder override standing:**

1. **The soul's §2 passage** (replaces the "you have looked at their work" /
   "Your Jaipur set" bytes) and **the §4 exit clause**. Both are `MAYA_SOUL`
   bytes and both ride his veto.
2. **`EXIT_LINE`** — the static goodbye that ships when the gate fires:
   > I'll leave it here — no more messages from me. If you ever want to pick this up, just reply and I'm right here. All the best.

   **This is the only byte in this delivery a prospect can read.** Drafted for
   his pass as ruled; his to change at the character.

**Money register verified by command:** zero glyphs, zero k/L/Cr, in every byte
added. Nothing else minted.

## 41 · WHAT THE NEXT SITTING PICKS UP

1. **The eleven ×3 on the cured tree**, both lanes, counts against tonight's:
   self-reintroduction Haiku 0/3 · **"welcome back" misread 4/6 → the number to
   watch** · exit wake 0/2 → the gate makes it mechanical · fabricated
   specifics 4 → §2's target · `signed=false` on any link → must be zero.
2. **§3's pre-authorisation stands:** if ×3 still shows ≥1 "welcome back",
   arm 1 (drop the stale inbound) builds next — **with the empty-array guard
   collision resolved first and SHOWN, not inferred.**
3. **Three ratify-or-reverts open:** the ceiling at 12,100 · the sign-off
   upgrade · nothing else.
4. **F-08.73** — the pre-existing red, outside this charter.
5. **F-08.59's provenance slot** — one true sentence from the founder retires
   the class; DeepSeek showed the honest-ignorance line working tonight.
6. **The `PRODUCT_LINK` exit shape** — named, not built (§36).
