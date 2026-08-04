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

---

# ADDENDUM 5 · THE ×1 RULING BUILT — §2 → §6 (2026-08-04)

**Base:** dream-os `39087f4` · dreamos-pwa `19978c7` (**ZERO pwa bytes**).
**Ruled to:** the CE's ×1-read ruling, 2026-08-04, §2 through §6.
**Role:** EXECUTOR. Nothing pushed.

## 42 · WHAT SHIPPED

| Ruling | What |
|---|---|
| **§2** | the exit wake makes **no model call**: the static parting line ships from the machinery · `runNudgeJob` admits `exit_static` · the exit declarative leaves context · the link gate becomes `gateExitLink`, defence in depth, proven in isolation · the soul's WHEN NOBODY ANSWERS re-authored |
| **§4** | the nudge fixture's seed becomes a **captured production specimen** |
| **§5** | the soul's WHO YOU ARE gains the biography boundary · identity widens to person/career claims · provenance narrows to source-assertions |
| **§6** | ceiling ratified 12,250; the ladder **records the breach** |
| **§3** | ⚠ **NOT BUILT — the collision is fatal as worded. Shown below.** |

## 43 · ⚠ §3 — ARM 1 CANNOT EXECUTE AS WORDED, AND HERE IS THE COMMAND

Arm 1 applied to production source (`rows = []` where the truncation stood),
driven through `runCloserTurn` on a production-shaped nudge fixture:

```
[closer] no-send — a nudge with no conversation behind it has nothing to say
  RESULT source=no_send  text=""
```

**The model is never reached and no nudge is ever sent.** `runNudgeJob` treats
`no_send` as a legal silent turn that does not even spend one of her two, so
**Maya would simply stop nudging — with no red anywhere in the floor.** The API
constraint underneath it is already on the record: `886d0f7`'s committed
transcripts carry `400 messages: at least one message is required`.

The collision is not the guard being wrong. It is that a nudge which still calls
a model **must** carry a user-role turn, and the only candidates are the stale
inbound (the disease), a machinery line (F-08.57, dead), or her own last send
(the prefill, also dead). **Reported, not adapted.** Resolutions I can see, none
picked:

1. **Quote the inbound into context too and keep it in the array** — the array
   is unchanged, but the frame states its age; this is the current build plus
   §3's declarative, which measured 1/6 explicit and ~5/6 soft.
2. **Retire the model call on wakes 1 and 2 as well**, the way §2 retired the
   exit. Kills the class outright; costs the two messages she is good at.
3. **Accept the residue and measure it at the ×3** — the declarative has one
   run of data and the softest forms may be prose, not architecture.

## 44 · §2 — THE EXIT IS NO LONGER A MODEL TURN

0/4 lifetime, both architectures, while the same models write graceful goodbyes
inside live conversations. **There is no predicate to step around because there
is no model turn.** Zero tokens; it cannot pitch, wall, or narrate.

**THE SILENT-FAILURE CATCH:** `runNudgeJob` gates on `out.source !== 'maya'`.
A new source it does not know is **a send that never happens, with no error** —
the whole feature disappearing without a red. `exit_static` is admitted
explicitly and **a runtime cell drives the real job and asserts the parting line
actually goes on the wire.**

The exit declarative left the context: the exit no longer reaches a model to
read it, and **a bench green over an unreachable path is not evidence** (§9).
The gate survives as `gateExitLink`, defence in depth, proven **in isolation**
for the same reason.

## 45 · ⚠ §0.2 — TWO CORRECTIONS AGAINST MY OWN WORK, AND ONE AGAINST THE RULING

**(a) A VACUOUS CELL OF MINE, convicted by the harness.** My first §2 cell
asserted the nudge-job gate by `fs.readFileSync` on the source. **The harness
mutates production source IN MEMORY before require, so no source-text cell can
ever see a mutation** — `nudge_job_drops_exit` came back GREEN. F-08.53's third
limb convicting my own bench. Replaced with the runtime cell it should always
have been. **Every source-text cell in this bench inherits that limitation and
it is now named in-file.**

**(b) A CELL THAT COULD NOT DISTINGUISH TWO TERMS.** My provenance cell drove
`"I got it from looking at your work"`, which matches **two** terms, so
`watch_prov_narrow` stayed green. Re-driven on a string whose only trigger is
the term under test.

**(c) ⚠ THE CHAIR'S §4 PREMISE DOES NOT HOLD AT THIS TIP.** *"Her real first
outbound is the opener template's bytes."* Derived by command: `runOpenerJob`
(`src/lib/prospects.js`) sends `marketing_opener` and calls `logMessage`
**nowhere** — no conversation exists yet, `openProspectConversation` runs on the
INBOUND. **The opener never enters the conversation and Maya has never been able
to see it.** The conversation's true first outbound is her own seam reply, so
the seed is a **captured specimen** — the Haiku `cold_reply_curiosity` reply
from the ×1 run at `39087f4`, verbatim. Nothing about the reintroduction count
is now an artifact of my typing.

## 46 · ⚠ F-08.75 MINTED — THE MARKETING OPENER INTRODUCES THE WRONG PERSONA, TO THE WRONG AUDIENCE

Derived while chasing §4. `src/lib/templates.js` `marketing_opener`, **approved,
live, and the first thing every prospect ever receives**:

> Hi {{1}}, this is **Mira** from The Dream Wedding. We keep **your vendors,
> payments, and timeline** in one place. Reply here and I'll show you how it
> would work for **your wedding**. Reply STOP to opt out.

Two defects in one template. **(1) It names Mira** — the couple's assistant, per
the estate's own name map — and then **Maya** answers. Its in-file comment says
so explicitly: *"Couple-facing agent is named Mira… Filed 2026-07-19"*, three
weeks before Maya was minted. **(2) It pitches the COUPLE product to a VENDOR.**
"Your vendors, your wedding" is the bride instrument; this lane's prospects are
photographers with `demo_vendor_ref` rows.

**NOT FIXED — it is Meta-approved template copy, which is a re-filing and the
founder's alone.** This is also why the opener's absence from history is a
mercy: Maya cannot see it, so she has never had to reconcile it.

## 47 · §6 — THE CEILING RECORDS ITS OWN BREACH

`soul_chars=12007` **shipped and ran at `39087f4` while the ratified ceiling was
11,750.** The 12,100 const was executor-proposed and no packet ratified it
before the push. The bench asserted `length <= SOUL_CHAR_CEILING` and **the
const had moved with the prose** — so the mechanical check could not see the
breach. **A ceiling that travels with the thing it caps is not a cap.** Named in
the const's own ladder for whoever moves this number next.

Ratified now at **12,250**; measured at this seal **12,244**, headroom 6, after
one tightening pass. §2's exit-paragraph simplification bought some back: the
parting line left the soul entirely when it stopped being hers.

## 48 · THE FLOOR — PAIRED

```
b08_p5_closer_bench  171  (64→89→110→112→130→156→171) · 33 mutations, 33 clean reds, ZERO stale
b5c 47 · b08_p1 106+0 · b08_p3 61 · console 71 · factory 83 · invite 35
b07_f0789 19 · b07_f0774 20 · b07_f0784 59 · b07_p6 29 · b07_p1 75 · b07_p5 136
modelRouter-adjacent: advisor_route 16 · wa_words 19 · f79 19 · f80 24 · rider 32
b06_meter 28/29 ⚠ F-08.73, PRE-EXISTING, unchanged, outside this charter
dreamos-pwa (ZERO bytes): tsc 0 lines · 28 .mjs · 7 .ts — all green
```

## 49 · COPY INVENTORY

**Model-voiced, delegated veto, founder override standing:** the WHO YOU ARE
biography boundary · the re-authored WHEN NOBODY ANSWERS paragraph. Both
`MAYA_SOUL` bytes.

**`EXIT_LINE` is unchanged from the last delivery** and is now the ONLY thing a
prospect reads at the exit — no longer a fallback but **the parting line
itself.** That raises its weight: his to change at the character.

**Nothing else minted.** Money register verified: zero glyphs, zero k/L/Cr.

## 50 · WHAT THE NEXT SITTING PICKS UP

1. **§3's three resolutions** — ruled, then built.
2. **The eleven ×3.** Named reads: exit wake now **mechanically green by
   construction** (assert `source=exit_static`, zero tokens) · "welcome back"
   1/6 → ? · DeepSeek reintroduction 3/3 re-measured against the captured seed ·
   identity/person claims 2 → 0 · provenance flags 5-fires-1-true → inverted.
3. **F-08.75** — the opener template, founder's re-filing.
4. **F-08.73** — the pre-existing 28/29.
5. **Two ratify-or-reverts still open:** the sign-off upgrade (§35), and this
   delivery's §3 hold.

---

# ADDENDUM 6 · THE RENAME — MAYA VACATES, MIRA TAKES THE LANE (2026-08-04)

**Base:** dream-os `101e03e` · dreamos-pwa `19978c7` (**ZERO pwa bytes**).
**Ruled to:** the CE rename charter + the persona-boundary addendum, 2026-08-04.
**Role:** EXECUTOR. Nothing pushed.

## 51 · WHAT SHIPPED

| File | What |
|---|---|
| `src/agent/souls/closerSoul.js` | `MIRA` **imported** from its one home, never re-declared · the NAME section re-authored with F-08.75's evidence · the same-name paragraph carrying the **persona boundary** · version `maya-v2` → `mira-closer-v3` · ceiling **12,250 → 12,800 EXECUTOR-PROPOSED** |
| `src/agent/closerEngine.js` | `LINK_SIGNATURE` and `PARTIAL_SIGNOFF_RE` interpolate the one home · the `source` token `'maya'` → **`'closer'`**, persona-neutral · watcher costume class re-aimed · F-08.55 gains the boundary-mechanism comment · live prose swept |
| `scripts/b08_p5_closer_scenarios.js` | title and labels · the opener **rendered from the registry** · the disjointness rider re-stated against four |
| `scripts/b08_p5_closer_bench.js` | **171 → 180** · three labeled amendments · two new mutations · two re-anchored |
| `docs/FINDINGS_LOG.md` | CE-189 |

## 52 · THE ONE-HOME LAW, AND THE BENCH THAT ENFORCED IT ON ME

`MIRA` lives at `miraSoul.js:91` and is imported. `closerSoul.js` **does not
re-export it** — a re-export is a second door to the same literal.

**CREDITED: `b05_couple_soul_bench` §4.1 caught my one slip.** It went
**21/21 → 20/21** on the first cured tree because the new same-name paragraph
carried a hardcoded `Mira` in soul prose. Interpolated to `${MIRA}`; census
green; **no amendment to that cell was needed or made.** The estate's own law
convicted the sitting implementing it.

**⚠ CORRECTED AT MY TIP (CE-40 class):** the relay said *"the sixteen-importer
discipline; you are the seventeenth."* Derived by command — **six** modules
`require` miraSoul; **this is the seventh.** The other mentions are comments and
strings.

## 53 · ⚠ §0.2 — THE OPENER SEED, BUILT DIFFERENTLY THAN CHARTERED

The charter: *"the fixture re-seed now seeds the TRUE opener bytes."* The
reading behind it is right — every transcript this arc produced began one
message too late. **The cause is not the fixture.** `runOpenerJob` calls
`logMessage` nowhere, so in production the opener enters no conversation and
**the model cannot see it either.**

Pushing it into `sb.db.messages` would hand the model a row production does not
have — **F-08.68's own class, cured six hours earlier.** So the opener is
**RENDERED** into the transcript (read from `TEMPLATES.marketing_opener.body`,
never retyped) and **NOT pushed** into her history. The reader's problem is
solved; the model's history stays honest. **F-08.76 carries the production fork
to the chair, three arms, none picked.**

**Also mechanically:** the charter said the seed would cure the reintroduction
few-shot *"in one act."* It would not. An opener row sits **before** the last
inbound, so `truncateAtLastInbound` keeps it in the MESSAGES array — it never
reaches the quoted block, and the few-shot is unaffected either way. The captured
specimen from Addendum 5 is what addresses that, and it stands.

## 54 · ⚠ §3's ARM 1 — RE-SHOWN ON THE RENAMED TREE, STILL FATAL

Re-derived at this tip, not carried from the last packet. Arm 1 applied to
production source:

```
[closer] no-send — a nudge with no conversation behind it has nothing to say
  RESULT source=no_send text=""
```

**Every nudge silently stops, with no red anywhere in the floor.** Nothing in the
rename changes this: with the opener unlogged, dropping the stale inbound leaves
either an empty array or a leading assistant turn, and Meta's API takes neither.
**The three resolutions in Addendum 5 §43 stand unchanged and unruled.**

## 55 · THE SIGNATURE — PENDING FOUNDER SEAL

`— Mira · The Dream Wedding's AI` **replaces a founder-sealed string** and is
built against the slot, not shipped on my word. The name is **interpolated from
its one home**, so whatever he seals, the signature cannot drift from the
persona. The bench asserts the slot, so a different seal fails loudly.

## 56 · THE PERSONA BOUNDARY — AUDITED, EXPECTED-ZERO, VERIFIED

Every post-conversion promise shape across the soul and `EXIT_LINE`, by command.
**One hit:** the static exit's *"just reply and I'm right here"* — re-entry into
the SALE, ruled fine. **Nothing implies she remains the vendor's ongoing
channel.** The delta list is empty.

The boundary is enforced by `isRegisteredUser`, and a **runtime** cell drives it:
a registered vendor reaches the sealed line and an injected llm that **throws if
the turn is ever reached**. Wrapped, per F-08.50 — a red whose count nobody can
read is not a usable red.

## 57 · THE FLOOR — PAIRED, AND TWO REDS THAT ARE NOT MINE

```
b08_p5_closer_bench  180  (…156→171→180) · 35 mutations, 35 clean reds, ZERO stale
b5c 47 · b08_p1 106 · b08_p3 61 · console 71 · factory 83 · invite 35
b07_f0789 19 · b07_f0774 20 · b07_f0784 59 · b07_p6 29 · b07_p1 75 · b07_p5 136
miraSoul-adjacent (the home I now import from), all re-run:
  b05_arc_m1 53 · m2 27 · m3 11 · m4 18 · m5 11 · ping_drain 31
  b05_couple_soul 21/21 ✓ (caught my slip, then green)
  b05_f0555_media_dedupe 22 + 1 ⚠ PRE-EXISTING
b06_meter 28/29 ⚠ PRE-EXISTING (F-08.73)
dreamos-pwa (ZERO bytes): unchanged since the last seal, green
```

**⚠ A SECOND UNREPORTED RED, same class as F-08.73.**
`b05_f0555_media_dedupe_bench` §6.2 (*"the guard speaks to NOBODY — it writes a
row and returns, never a line"*) reads **22 passed, 1 failed** and is
**identical at `101e03e` and at the cured tree — proven both ways, not mine.**
Two benches in this estate are now known-red and unreported. **Not fixed —
outside this charter.** Reported so the count is disclosed rather than preserved
silently (floor-method law).

## 58 · COPY INVENTORY

**Model-voiced, delegated veto, founder override standing:** the same-name
paragraph carrying the boundary — the only new soul prose. The NAME section
rewrite is comments, not copy.

**PENDING FOUNDER SEAL:** `— Mira · The Dream Wedding's AI`.

**BYTE-UNTOUCHED and stated:** the Meta template `marketing_opener` · the F-08.55
redirect line · `EXIT_LINE` · every other template body. **Nothing was filed with
Meta and nothing needs to be.**

## 59 · WHAT THE NEXT SITTING PICKS UP

1. **The eleven ×3 on the renamed tree** — counts against `39087f4`'s. The
   reintroduction read now means something different: *"this is Mira from The
   Dream Wedding"* is legitimately message one on the wire, so a reintroduction
   in nudge one is a **repetition of the opener**, not a switchboard tic.
2. **The signature seal** — one word.
3. **Three ratify-or-reverts:** the ceiling at 12,800 · the sign-off upgrade
   (Addendum 5 §35) · the `'closer'` source token.
4. **F-08.76's three arms** · **arm 1's three resolutions** — both unruled.
5. **F-08.73 and the media-dedupe red** — two known-red benches, outside charter.
6. **`b5c` and `b08_p1` still stub `source: 'maya'`** — harmless (they never
   reach the engine) but stale-named. Named, not fixed: outside the file list.

---

# ADDENDUM 7 · THE SIGNATURE SEAL (2026-08-04)

**Base:** dream-os `5f29457` · dreamos-pwa `19978c7` (**ZERO pwa bytes**).
**Ruled to:** the CE SEAL, 2026-08-04. **Two files.**

## 60 · THE SEALED BYTES

```
Mira- The Dream Wedding AI Team
```

**Thirty-one characters, derived by command before they were typed** — codepoints
read, not eyeballed. The shape is deliberate and the source comment says so, in
the words a future reader will need before they "fix" it:

- the separator is **HYPHEN-MINUS (U+002D)**, directly after the name, **no space
  before it**
- **no middle dot**, **no em-dash**, **no apostrophe-s**
- it reads **"AI Team"**, not "AI"

**Nothing normalized.** This supersedes both the retired Maya seal and the
chair's proposed Mira form. **The pending-slot is CLOSED — nothing in the rename
build now waits on any founder word.**

## 61 · THE NAME IS STILL INTERPOLATED, AND THAT COSTS NOTHING

`const LINK_SIGNATURE = \`${MIRA}- The Dream Wedding AI Team\`;`

The rendered bytes are identical either way, so interpolation buys two things
free: the signature cannot drift from the persona, and `b05_couple_soul_bench`
§4.1 — the estate's own no-second-literal census — **stays green (21/21)**.

**Idempotence re-keyed by construction.** The check tests the const, so it moved
to the new substring the moment the bytes did; nothing in that function knows the
words. The **upgrade path is unchanged and still correct**: her own trailing
`— Mira` is absorbed and the sealed line takes its position, so a message carries
one sign-off, not two. Proven by command on all four shapes — append, upgrade,
idempotent, watcher-quiet.

## 62 · F-08.58 SURVIVES THE RESEAL, AND A CELL SAYS SO

The signature exists so a link never leaves without the reveal on it. **"AI Team"
carries that.** A cell asserts the letters are present, and the source comment
states the consequence plainly: **if a future seal ever drops them, this floor
stops being a floor and F-08.58 reopens.** Named now rather than discovered then.

## 63 · THE BENCH — 180 → 182

**LABELED AMENDMENT ⑬, count preserved in intent:** the pending-slot cell becomes
the **byte-exactness** cell, which is the stronger form and the one the copy-veto
law actually wants. Three cells now: the exact string, the exact separator/
casing/length, and F-08.58's survival.

**Driven on a literal, deliberately.** A cell that rebuilds the expected string
from the same const it is checking proves nothing — INDEPENDENT-METHOD clause 1,
*a verification that reproduces the method under test is not a verification*. A
sealed byte wants exactly one place that spells it out and everything else
deriving; **that place is a bench cell, where a drift fails loudly.**

**NEW MUTATION `seal_normalized`** — swaps the hyphen for an em-dash, adds the
middle dot and the apostrophe-s. **The exact class the copy-veto law forbids:
every one of those looks like a tidy-up and every one is a founder byte edited by
a sitting.** It reddens both byte-exactness cells.

**36 mutations, 36 clean reds, zero stale anchors.**

## 64 · THE FLOOR — PAIRED

```
b08_p5_closer_bench  182  (…171→180→182) · 36 mutations, 36 clean reds
b5c 47 · b08_p1 106 · b08_p3 61 · console 71 · factory 83 · invite 35
b07_f0789 19 · b07_f0774 20 · b07_f0784 59 · b07_p6 29 · b07_p1 75 · b07_p5 136
b05_couple_soul 21/21 · arc_m1 53 · m2 27 · m3 11 · m4 18 · m5 11 · ping_drain 31
b05_f0555_media_dedupe 22 + 1 ⚠ PRE-EXISTING · b06_meter 28/29 ⚠ PRE-EXISTING (F-08.73)
dreamos-pwa (ZERO bytes): unchanged since the last seal
```

`node --check` clean on both touched files. **Two known-red benches remain,
unchanged and outside charter, disclosed rather than preserved silently.**

## 65 · COPY INVENTORY

**One byte, and it is the founder's own:** `Mira- The Dream Wedding AI Team`.
**Nothing minted. Nothing else moved.** No soul byte, no template byte, no Meta
act.

## 66 · WHAT REMAINS

**Nothing waits on a founder word.** The next act is the eleven ×3 on the sealed
tree, counts against `39087f4`'s — with one read that has changed meaning: a
reintroduction in nudge one is now a **repetition of the opener**, which the wire
genuinely sent, not a switchboard tic.

Still unruled and unchanged: **arm 1's three resolutions** · **F-08.76's three
arms** · the ceiling at 12,800 · the sign-off upgrade · the `'closer'` source
token · F-08.73 and the media-dedupe red.

---

# ADDENDUM 8 · F-08.69 — THE WAKE LOSES ITS LAST TWO HOMES (2026-08-04)

**Base:** dream-os `881a084` · dreamos-pwa `19978c7` (**ZERO pwa bytes**).
**Ruled to:** the CE ×3 ruling, 2026-08-04, §2 through §5. **Five files + one migration.**

## 67 · WHAT SHIPPED

| Ruling | What |
|---|---|
| **§2** | `nudge_provider`/`nudge_model` — Amendment Two's geometry, one role over: replies stay on the seeded lane, **wakes ride DeepSeek** · `0111_marketing_nudge_route.sql` · `wake_split=` on the line of record |
| **§3** | the **wake-send gate**: five convicted tells, drop-to-silence, **wake turns only** |
| **§4** | the seed **re-captured** from the Mira-era run · the transcript label cleaned · the watcher's costume class widened to the structural tells |
| **§5** | floor PAIRED, labeled amendments, the three transcripts ride the delivery |

## 68 · ⚠ THE SEED WAS THE LEAK, AND THE BYTE WAS MINE

Rep 3's break said *"**Maya** opened the conversation with Kanupriya."* I read
that as the model resurrecting a vacated name. **It was reading a byte I put
there.** The seeded seam reply was the captured Haiku specimen from `39087f4`,
and that specimen opens **"Hi, I'm Maya."** — which the F-08.66 cure then quotes
back to her, verbatim, **on every single wake**.

The vacated name sat inside her own evidence three times a run.

**Re-captured from `881a084`'s Haiku `cold_reply_curiosity`** — same slot, same
model, verbatim, Mira-era. **The standing lesson is in the file:** a captured
specimen is only faithful while the tree it was captured from is the tree that
ships. Re-capture whenever the persona moves.

## 69 · §2 — AN ASSIGNMENT, NOT A CURE

Haiku wake-turns failed in **every build of this arc**: 9/9 narration → 7/9
self-reintroduction → 4/9 refusals → 4/9 costume breaks. DeepSeek wake-turns:
**0/9** at `881a084`, effectively clean across the arc. The frame now works so
well that a careful model reads the wake as a brief — and the careful model in
this house is Haiku.

**Nothing new was invented for this.** `donna_provider` has routed a role
separately from its surface since TDW_02 P7; `nudge_provider` is that geometry
one role over, with identical validation and the same drop-rather-than-guess
discipline in `parseRoute` and `guardKeys`.

**⚠ ORDER MATTERS — 0111 RUNS BEFORE THE APPLY.** The seed row **wins over** the
DEFAULTS matrix, so a tree deployed against 0110's old row routes wakes to Haiku
and the ruling is defeated **silently**. `0109`'s discipline exactly. A bench
cell drives the unseeded row and asserts the fallback is the pre-ruling
behaviour rather than a guess — and a second cell drives the **keyless** arm,
because the bench sets `DEEPSEEK_API_KEY` for the split cells and that setup
would otherwise hide the very path `guardKeys` exists for.

## 70 · §3 — WHY A GATE IS SAFE HERE AND WAS NOT ON REPLIES

**A wake send has a property a reply never has: silence is always safe, because
nobody is waiting.** A dropped reply leaves a human staring at nothing; a dropped
wake is indistinguishable from her deciding there was nothing worth sending —
which `[NOTHING]` already makes a first-class outcome.

Five tells, **every one a specimen from a transcript in this repository**:
`markdown_header` (the briefing that walked past the watcher entirely — no
"Claude", no "roleplay") · `roleplay` · `claude` · `nothing_token` embedded in
prose · `vacated_name`.

**Replies remain entirely ungated** and a runtime cell proves it: the *same
bytes* are dropped on a wake and go out untouched on a reply. The founder's
interception refusal stands exactly where he made it.

**A dropped wake does not spend one of her two** — `runNudgeJob` already declines
to log a `no_send`, built for the token path and load-bearing here.

## 71 · ⚠ §0.2 — THREE CORRECTIONS AGAINST MY OWN BENCH, ALL CAUGHT BY THE SWEEP

**(a) I made an existing cell vacuous.** The wake gate treats an embedded
`[NOTHING]` as a tell, so with `nothing_off` mutated the turn still returned
`no_send` — **via the gate instead of the token** — and the mutation came back
green. Discriminated on `wakeTells`, which only the gate sets. **A new wall can
make an old proof stop proving anything, and only the both-ways sweep sees it.**

**(b) A mutation I drafted cannot fire, and it is retired with the reason in-file
rather than dropped quietly.** `seed_vacated_name` targets the scenarios file,
which this harness **never requires** — it reads it with `fs.readFileSync`, and
the harness mutates in memory before require. The mutation applies and reddens
nothing. **The seed's protection is a LINT, and it is named as a lint rather
than dressed as a proof.**

**(c) The route cache, aimed at a bench this time.** Three sub-cells drive three
different route values under **one** config key, and `modelRouter`'s 60-second
cache would have returned the first answer to all three. `_resetRouteCache()`
between them — F-08.72's own mechanism, one layer over.

## 72 · THE FLOOR — PAIRED

```
b08_p5_closer_bench  195  (…180→182→195) · 40 mutations, 40 clean reds, ZERO stale
b5c 47 · b08_p1 106 · b08_p3 61 · console 71 · factory 83 · invite 35
b07_f0789 19 · b07_f0774 20 · b07_f0784 59 · b07_p6 29 · b07_p1 75 · b07_p5 136
b05_couple_soul 21/21 (the one-home census, green through the router change)
modelRouter-adjacent, all re-run: advisor_route 16 · wa_words 19 · f79 19 · f80 24 · rider 32
b06_meter 28/29 ⚠ PRE-EXISTING (F-08.73) — re-proven both ways, unchanged by the DEFAULTS edit
dreamos-pwa (ZERO bytes): unchanged since the last seal
```

`node --check` clean on all four touched `.js` files. Migration ladder: `0111`,
no hole, no renumber.

## 73 · COPY INVENTORY

**ZERO new user-facing bytes.** The tells are machinery; the seed is a fixture;
the migration is config. **No soul byte, no template byte, no signature byte
moved. Nothing minted, nothing to veto.**

## 74 · WHAT THE NEXT SITTING PICKS UP

1. **The eleven ×3 on this tree** — the wake surface is now armored three deep:
   a lane that has never broken one, a gate that drops what breaks anyway, and
   an exit that makes no model call at all. The read: **costume breaks 4/9 → 0**,
   and any `WAKE_DROPPED=` line in a transcript is the gate earning its place.
2. **Watch for over-drop.** A wake dropped for a tell it should not have tripped
   is a defect in the other direction, and the transcript now names the tell so
   it can be read rather than guessed.
3. Unchanged and unruled: **arm 1's three resolutions** · **F-08.76's three
   arms** · the ceiling at 12,800 · the sign-off upgrade · the `'closer'` token
   · **F-08.73 and the media-dedupe red**.

---

# ADDENDUM 9 · THE INSTRUMENT REBUILT · THE REGISTER GETS A WIRE (2026-08-04)

**Base:** dream-os `1d79567` · dreamos-pwa `19978c7` (**ZERO pwa bytes**).
**Ruled to:** the CE ×3 ruling, 2026-08-04, §2 through §6.

## 75 · WHAT SHIPPED

| Ruling | What |
|---|---|
| **§2** | `--lane=production` — seeds the REAL route, `resolveModel` decides per turn, `laneLlm` forces nothing, `wake_split` becomes witnessable · the banner names which lane gates · a missing DeepSeek key is announced, not discovered |
| **§3** | `normalizeRegister` — the glyph swaps to `Rs `, digits untouched · the watcher gains a `register` class taken **pre-normalization** |
| **§4** | the `enumerated_interrogation` tell — the specimen's **anatomy**, not its vocabulary |
| **§5** | `docs/TDW_08_P5_OPEN_ARMS.md` — seven held items, evidence and arms |
| **§6** | floor PAIRED, transcripts ride the delivery |

## 76 · F-08.80 — THE INSTRUMENT COULD NOT SEE WHAT IT WAS GATING

The pinned lanes seed `{provider, model}` — **two fields** — so a per-role split
cannot exist in the fixture, and `:257` forced the provider afterwards regardless.
Eighteen turns at `1d79567` read `wake_split=false` and **the whole of F-08.69 was
invisible to the instrument gating its own deploy.**

`production` mode is a third lane, not a replacement: `haiku` and `deepseek` stay
exactly as built, because *"how does each architecture behave"* is a real question
and they answer it. They just do not answer *"what does the shipped tree do."*
**The banner now says which is which in the transcript**, so a reader cannot
mistake a diagnostic for the gate.

**And the silent-collapse path is announced.** A missing `DEEPSEEK_API_KEY` makes
`guardKeys` drop the split — correct behaviour and a worthless run — so the lane
header says so rather than letting `wake_split=false` be read as a measurement.

## 77 · §3 — THE REGISTER FINALLY HAS A MECHANICAL WITNESS

`₹999` reached the wire at `1d79567` with `flags=none`. The register has been
standing law with **zero enforcement anywhere**: the soul stated it, nothing
checked it, and the watcher's price class had narrowed to tier-attached figures.

**The swap is `scrub.js`'s own class** — the estate has rewritten registers on the
wire since Block 04. A glyph is a **form**, not a claim; it judges nothing she
wrote, exactly as the link normalizer judges nothing.

**THE DIGITS SHIP AS SHE WROTE THEM.** Grouping stays soul-side and the k/L/Cr
shorthand is **watched and never rewritten** — turning "1.2L" into a number is
arithmetic on her words, and semantic acts stay refused. A behavioural cell
proves the shorthand survives untouched; a source-text cell would have been a
lint dressed as a proof.

**The flag is taken BEFORE the swap**, because after it there is nothing left to
see — and a delivered-turn cell proves both halves in one act: no glyph on the
wire, `register` still in `flags`.

## 78 · §4 — ANATOMY, NOT VOCABULARY

Both `1d79567` specimens carried **no old tell**: no header, no "roleplay", no
"Claude". The disease is structural — **an enumeration handed to a stranger plus
a second-person question about who they are or whether they are testing.** The
tell matches that shape, so the next specimen need not share a vocabulary with
the last.

**Both false-positive arms are proven**, because the gate drops to silence and
over-dropping is the defect in the other direction: an ordinary enumerated wake
does not fire, and a bare question does not either. **It takes both limbs.**

## 79 · THE FLOOR — PAIRED

```
b08_p5_closer_bench  209  (…182→195→209) · 45 mutations, 45 clean reds, ZERO stale
b5c 47 · b08_p1 106 · b08_p3 61 · console 71 · factory 83 · invite 35
b07_f0789 19 · b07_f0774 20 · b07_f0784 59 · b07_p6 29 · b07_p1 75 · b07_p5 136
b05_couple_soul 21/21 · b06_advisor_route 16/16
b06_meter 28/29 ⚠ PRE-EXISTING (F-08.73, open-arms §6)
dreamos-pwa (ZERO bytes): unchanged since the last seal
```

`node --check` clean on all three touched `.js` files.

## 80 · COPY INVENTORY

**ZERO new user-facing bytes.** The register normalizer moves a glyph to bytes
the standing law already names — **it mints nothing and the founder's own money
register is the author of `Rs `.** Tells, lanes and flags are machinery.
**No soul byte, no template byte, no signature byte moved.**

## 81 · WHAT THE NEXT SITTING PICKS UP

1. **The eleven ×3 in PRODUCTION mode** — the first run in this arc that
   measures the shipped tree. **Read `wake_split=true` on every nudge turn
   first**; if it reads false, the key is missing and the run measures nothing.
   Then: costume breaks (4/9 → 3/9 → ?), `WAKE_DROPPED=` lines, glyphs (must be
   zero on the wire), `register` flags.
2. **The open-arms packet** — seven items, and **§1 is urgent**: the soul is
   live at 12,793 against a last-ratified 12,250.
3. **The unproposed arm**, named in open-arms §7: a floor runner that fails
   loudly on any non-green bench, so a red cannot be inherited. Two have been
   now.

---

# ADDENDUM 10 · THE PROSPECT CONSOLE · TWO REPOS (2026-08-04)

**Base:** dream-os `dcdc8f1` · dreamos-pwa `19978c7`.
**Ruled to:** the CE re-sequence + screen charter, 2026-08-04.
**TWO ZIPS.**

## 82 · WHAT SHIPPED

| Repo | File | What |
|---|---|---|
| dream-os | `src/api/admin/prospects.js` | the **intake guard** (F-08.55 at the door, both phone forms, fails CLOSED) on `POST /` and `POST /bulk` · phone shape at the door · the `refused` bucket |
| dream-os | `src/agent/closerEngine.js` | **F-08.72's missed line** — the watcher log now names the mouth that spoke |
| dream-os | `scripts/b08_p5_prospect_intake_bench.js` | NEW — 13 cells, 5 both-ways mutations |
| dream-os | `scripts/_noop_middleware.js` | NEW — the injected-past `requireAdmin`, named |
| dreamos-pwa | `app/admin/prospects/page.tsx` | NEW — the console |
| dreamos-pwa | `app/admin/layout.tsx` | the nav entry, Outreach |
| dreamos-pwa | `scripts/tdw08_p5_prospects_console.proof.mjs` | NEW — 45 cells, 4 both-ways mutations |

## 83 · THE API WAS WHOLE — VERIFIED, NOT TAKEN

The relay said eight routes. **Derived at `dcdc8f1`: eight, and `src/api/router.js:52`
mounts them at `/api/v2/admin/prospects`.** Every request and response shape in
the screen was read off the handler before the caller was written (protocol §6),
and the bench asserts all eight are registered — **the console is built against a
door that exists.**

## 84 · THE GUARD FAILS CLOSED, AND THAT IS THE OPPOSITE OF THE TURN

F-08.55 at the turn **fails open**: a human has already spoken and silence is the
ruder failure. **At intake nothing is waiting.** The cost of a refused row is one
the founder re-adds; the cost of a wrong row is a customer receiving a sales
pitch from the house. So a broken lookup **refuses**, loudly logged, and a cell
drives exactly that.

The predicate is `demoLeadAlert`'s own — **both phone forms**, because
`users.phone` has no normalizer governing writes so its canonical shape is
declared, never derived. A mutation dropping the second form reddens.

**The bulk door is guarded as its own act**, and a separate mutation proves the
twin cannot be missed — F-04.38's exact class, which is a cure landing on one
door while its twin sits one file away.

**`refused` is a FOURTH bucket, never a rename.** The n8n sheet flow reads
`insertedCount`/`skippedCount`/`failedCount` and a cell asserts all three survive.

## 85 · ⚠ §0.2 — THREE CORRECTIONS AGAINST MY OWN WORK, ALL CAUGHT BY MY OWN BENCH

**(a) I asserted an envelope I had not read.** My first cells matched
`res.body.error_key` and `res.body.data.…`. `src/lib/response.js`: `ok()` spreads
onto `{ok:true, …}` with **no `data` wrapper**, and `err()` puts the key on
**`code`**. The bench went red against correct production code. **Protocol §6 —
read the actual handler before writing the caller, and a bench is a caller.**

**(b) The door rejected the format printed on a handset.** `+91 98882 94440`
survived `normalizeTo` as `91 98882 94440` and was refused as non-numeric.
Spaces, dashes, brackets and dots are now stripped at the door. **Found by the
cell asserting "the shapes a human actually types are normalized, not refused"**
— a cell written because that is what the founder will type on evening one.

**(c) The bench raced the thing it was testing.** `asyncHandler` returns
**undefined**, so `await handler(…)` yields one microtask and no more: the short
routes had responded by then, `POST /bulk`'s loop had not, and the bench crashed
on a correct tree reading `res.body === null`. It now awaits the **response**,
resolved by `res.json`. Named in-file.

## 86 · CONTROL INVENTORY (CE-115) — ELEVEN CONTROLS, ALL NEW

The state filter · add one prospect · paste a list · add the pasted list · the
cap dial · send opener (arms) · the confirm tap · cancel the send · view the
conversation · mark converted · clear the paste result. **This screen replaces no
surface**, so there is nothing KEPT, MOVED or REMOVED — every control is NEW and
each is asserted by name.

**The send is confirm-tapped** because it spends a real Meta template on a real
handset, and the armed state says which number. A mutation removing the arming
step reddens.

## 87 · THE FLOOR — PAIRED, BOTH REPOS

```
dream-os
  b08_p5_prospect_intake   13   NEW · 5 mutations, 5 clean reds
  b08_p5_closer_bench     209   byte-stable · 45 mutations, 45 clean reds
  b5c 47 · b08_p1 106 · b08_p3 61 · console 71 · factory 83 · invite 35
  b07_f0789 19 · b07_f0774 20 · b07_f0784 59 · b07_p6 29 · b07_p1 75 · b07_p5 136
  b05_couple_soul 21 · b06_meter 28/29 ⚠ PRE-EXISTING (F-08.73)
dreamos-pwa
  tsc 0 lines on a cleared .next
  29 .mjs — 28 green, tdw08_p5_prospects_console 45/45 NEW
  7 .ts green
```

**FLOOR-METHOD DISCLOSURE:** `tdw_f0774_vacuity_probe.mjs` exits 1 on a **dirty
tree by design** — *"Commit or stash first. Nothing was touched."* It is a
mutation probe refusing to run over uncommitted work, which is correct conduct,
not a red. It runs green once this delivery is committed. Proven identical at
base and cured.

## 88 · COPY INVENTORY — USER-FACING BYTES, ALL OPERATOR-SIDE

Every string on the console is **operator copy**, read only by the founder:
labels, the eleven control names, the refusal sentences, the cap's plain line
(*"How many cold prospects the morning job may send an opener to. Set it to 0 to
send none — the job still runs, and sends nothing."*), and two empty states.
**No prospect-facing byte moved.** The two server refusal sentences
(`already_registered`, `missing_country_code`) are operator-facing too — they
reach an admin screen, never a wire.

## 89 · WHAT THE FOUNDER'S THUMB PROVES, AND WHY IT IS EVENING ONE'S FIRST STEP

The live witness is his, declared not claimed: **load the clean SIM's number from
his phone, set the cap, fire Send opener at it, watch the thread render.** That
is simultaneously the console's acceptance and the intake of the evening's
fixture — which is why the re-sequence was worth taking.

**The guard's own witness rides it free:** loading `919888294440` must be refused
with *"Already a vendor with us."* — the same number that is `94440`, the guard's
witness at the turn.

## 90 · WHAT THE NEXT SITTING PICKS UP

1. **The founder's thumb-walk** → the walk card authors from the live rows per
   the fixture-state law → evening one.
2. **The open-arms packet** (`docs/TDW_08_P5_OPEN_ARMS.md`, shipped at `dcdc8f1`)
   — seven items, **§1 urgent**: the soul is live at 12,793 against a
   last-ratified 12,250.
3. **F-08.73** and the media-dedupe red, and the unproposed arm: a floor runner
   that fails loudly on any non-green bench.

---

# ADDENDUM 11 · F-08.83 — THE ESTATE MEASURED HONESTY AND NEVER SELLING (2026-08-04)

**Base:** dream-os `1fe17c0` · dreamos-pwa `2a63c0b`. **TWO ZIPS.**
**Ruled to:** the CE F-08.83 ruling, five limbs.

## 91 · ⚠ THE FINDING NUMBER COLLIDES — RENUMBERED

The ruling mints this as **F-08.80**. **F-08.80 is taken** — it is the harness
blindness, filed in Addendum 9 and committed at `dcdc8f1`. My live sequence:
`.75` opener · `.76` opener unlogged · `.77` boundary · `.78` register ·
`.79` tell · `.80` instrument · `.81` guardKeys exempts its own fallback
(proposed) · `.82` the dead-lettered graceful line is never logged (proposed).

**This finding is filed as F-08.83** throughout the delivery. CE-40 class; the
chair's number, corrected at the executor's tip.

## 92 · WHAT SHIPPED

| Limb | Where | What |
|---|---|---|
| **1** | `docs/TDW_08_P5_OPENER_CANDIDATES.md` | two candidate bodies, both COMPLIANT by command · **drafts, not filed** |
| **2** | pwa `app/admin/prospects/page.tsx` | Instagram · Trade · City on the form; the paste goes positional across five columns; **the board names a bare row in words** |
| **3** | `closerEngine.js` | the bare-row line gains *"What you always have is the product itself."* |
| **4** | `closerSoul.js` | **WHAT YOU HAVE TO SELL** · the question counterweight · WHERE IT BEGINS carries a claim |
| **5** | `scripts/closerReads.js` NEW · bench · harness | the selling read, the `bare_row_cold` scenario, `claim=` on every transcript line |

## 93 · ⚠ LIMB 4 IS DELIVERED AND **HELD** — PAST THE 13,000 LINE

**MEASURED: 13,567** after one tightening pass (13,626 before). The ruling:
*"past 13,000 the ratify request returns here with its arithmetic before
shipping."* **So the ZIP applies and the git line waits on the chair.**

**THE ARITHMETIC, +774 over 12,793:**

| | chars | what |
|---|---|---|
| WHAT YOU HAVE TO SELL | ~640 | the four true things and the lead-with-ONE rule — limb 4's entire substance |
| the counterweight | ~115 | the chair's adopted verbatim |
| WHERE IT BEGINS | ~35 | *"and carrying one concrete thing we do"* |

**Why it cannot come down further:** cutting any of the four leaves her
empty-handed on the axis she was empty-handed on tonight, and the lead-with-ONE
rule is what stops the cure becoming a brochure — the disease's own opposite
failure. **If the chair refuses:** the WHERE IT BEGINS amendment (~35) first,
then the closing brochure line (~110). **The four things do not cut.**

**The cost argument is now PRODUCTION-measured, not benched:** the founder's own
live turn at 12:49 UTC returned `cache_read=7,295` on the second inbound of a
real conversation.

## 94 · LIMB 5 — WHAT THE ELEVEN NEVER ASKED

Nine of eleven `READ_FOR` lines are **negative specs**. The opening scenario's
read is *"specific, short, about them. no adjective paragraph, no booking link"*
— a spec for what **not** to do. **Not one cell in this arc asked whether a
photographer reading the message would want to know more.**

`scripts/closerReads.js` asks one mechanical question: **does this message put a
concrete thing the product DOES in front of the reader, or is it only an
enquiry?** It does not score persuasion or warmth — those are the founder's read
and always will be. **A cell cannot score charm; it can notice an empty hand.**

**THE RED FIXTURE IS THE FOUNDER'S OWN EVENING.** All three live turns from
`918595986978`, verbatim, and the cell asserts **all three score false.** They
are the fixture *because* they are what a perfectly honest agent produced —
**every other cell in this bench would have passed them.**

Non-vacuity runs both ways: a real claim scores, and **adjectives score nothing**
— *"Your stunning portfolio is genuinely exceptional"* is false, by design, and a
cell says so.

`bare_row_cold` joins the eleven, seeded exactly as his row: no handle, no trade,
no city, **no demo**. The state a manually-added prospect is in by default, and
the state no scenario in this arc had ever been in.

## 95 · LIMB 2 — THE BOARD NAMES THE GAP

A bare row now says, on the board: **"No handle, trade or city — Mira has nothing
of theirs to work with."** Absence is the signal, and a mutation removing it
reddens. The founder can see what he is handing her before he sends.

The paste parser goes **positional** across five columns as ruled — and the
two-field digit swap survives as a forgiving fallback, because
`Kanupriya, 919000000123` is what a person actually types. **Beyond two fields
the order is the order:** guessing across five columns would be a screen
inventing data.

## 96 · THE FLOOR — PAIRED, BOTH REPOS

```
dream-os
  b08_p5_closer_bench       225  (…209→225) · 51 mutations, 51 clean reds, ZERO stale
  b08_p5_prospect_intake     13  byte-stable
  b5c 47 · b08_p1 106 · b08_p3 61 · console 71 · factory 83 · invite 35
  b07_f0789 19 · b07_f0774 20 · b07_f0784 59 · b07_p6 29 · b07_p1 75 · b07_p5 136
  b05_couple_soul 21 · b06_meter 28/29 ⚠ PRE-EXISTING (F-08.73)
dreamos-pwa
  tsc 0 lines · tdw08_p5_prospects_console 54 (was 45) · 28 .mjs green · 7 .ts green
  tdw_f0774_vacuity_probe refuses a dirty tree BY DESIGN; green once committed
```

**Already banked, not re-shipped:** the watcher `provider=` line (`1fe17c0`) and
the open-arms packet (`dcdc8f1`). The three production-mode transcripts ride the
founder's `git add -A`.

## 97 · COPY INVENTORY

**MODEL-VOICED, delegated veto, founder override standing:** the WHAT YOU HAVE TO
SELL section · the question counterweight · the WHERE IT BEGINS clause · limb 3's
one context sentence (machinery-visible, never wire-visible).

**FOUNDER'S OWN BYTES, DRAFTED NOT MINTED:** the two opener candidates. **Neither
is filed and neither ships in code.**

**OPERATOR COPY:** three field labels, one hint, one paste placeholder, and the
bare-row line on the board.

**No prospect-facing byte ships in this delivery.** The opener stands
byte-untouched until he files.

## 98 · WHAT THE NEXT SITTING PICKS UP

1. **The ceiling ratify (§93)** — this delivery does not push without it.
2. **The ×3 in production mode, including `bare_row_cold`.** The read that
   matters: `claim=true` on the opening turns. Tonight's baseline is **0/3**.
3. **The opener candidates** — the founder's bytes, his filing.
4. Unchanged: arm 1's three resolutions · F-08.76's arms · the sign-off upgrade ·
   the `'closer'` token · F-08.73 · the media-dedupe red · F-08.81 · F-08.82.

---

# ADDENDUM 12 · THE ×3 AT `9b6e3ca` — SELLING BROUGHT FABRICATION WITH IT (2026-08-04)

**Base:** dream-os `9b6e3ca`. **Ruled to:** the CE ×3 ruling, §1–§5.

## 99 · ⚠ THE DELIVERY IS SPLIT, AND THE BENCH SPLIT IT

**§3 and §4 are machinery and ship now. §1 and §2 are soul prose and are HELD.**

The two soul amendments measure **13,817** against a ratified **13,600**, and the
const-independence law forbids the cap moving in the same commit as the text it
caps. **The bench refused the delivery on its own** — four ceiling cells red — and
that is the first time this estate's ceiling has stopped anything. It was minted
this evening on seven specimens of it failing to.

**The §1/§2 bench cells are not in this ZIP either.** Cells land in the same
commit as the bytes they assert; shipping them now would red a correct tree.

## 100 · THE RATIFY REQUEST — 13,600 → 13,850

**MEASURED: 13,817** after one tightening pass (13,822 before). **+250 over 13,567.**

| chars | what |
|---|---|
| **~95** | §1 — *"Room governs your length and your tone, never whether you put one true thing on the table — a bare hello gets one too."* The `bare_row_cold` red was **0/9 claim=false**, and the mechanism is soul-internal: "Hi" reads as almost no room, and the claim rule lost to the room rule on exactly the shortest inbounds. |
| **~155** | §2 — *"When you know nothing about their work, the product is what you have — 'we saw your work' when you haven't is the fastest way to prove you never looked at all."* This resolves the collision the ×3 exposed: lead with something, and don't invent, were in tension on a bare row and the model resolved it by inventing. |

**Neither cuts.** §1 is the entire cure for a 0/9; §2 is the only thing standing
between "lead with something" and the six fabrications below.

**Cost unchanged and production-measured:** `cache_read=7,471` on every warm turn
of tonight's run.

## 101 · THE TRADE THIS ARC MADE, NAMED

F-08.83's cure gave her something to lead with. **The same ×3 that proved it
produced six fabrications she never made while she was empty-handed.** An agent
that sells invents material when it has none.

Two of six had a class and the watcher caught both (a tier price; an invented
provenance). **Four had none** — and those four are what §3 adds.

## 102 · §3 — TWO CLASSES THAT CANNOT BE DECIDED FROM TEXT ALONE

**This is a new kind of watch class in this estate.** *"We saw your work"* is
**true** on a row carrying a handle and a **lie** on a bare one. *"Your work is on
our marketplace"* is true on a discoverable demo and false on every other row.
Neither can be judged from the outbound; both need the **context the turn was
actually given**.

So `buildProspectContext` publishes `blindToTheirWork` and `discoverable` on the
opts object it already owns — the same named side channel as `o.demoLink` — and
`contextFlags` compares them against what went out. **Deriving them again at the
seam would be a second opinion about the same row.**

**Non-vacuity runs three ways and each has a cell:** the specimen flags · **the
same sentence on a row with a handle flags nothing** · and **the true generic
pitch — *"couples are browsing and your work is not on it yet"* — is untouched**,
because that is the shape limb 4 exists to produce.

## 103 · §4 — post_exit NARROWS

`already sent` fired on a legitimate nudge two — *"I've already sent you the demo
link"* — which is a **reference** to a send, not a send after the exit. First
precision datum on that class. Narrowed to the shape it exists for; both
directions celled.

## 104 · ⚠ §0.2 — A MUTATION COLLISION I CAUSED

`clock_uncond` anchored on the bare string `demo.discover_eligible === true &&`.
**§3's new `o.discoverable` line contains the same expression and sits ABOVE the
clock**, so the mutation started taking the first match and mutating the wrong
predicate — and came back green. **CE-127's exact class: a bare anchor is a coin
flip, and adding a second occurrence anywhere flips it.** Caught by the sweep,
re-anchored on the clock's own multi-line shape.

## 105 · THE FLOOR

```
b08_p5_closer_bench  235  (226 → 235) · 56 mutations, 56 clean reds, ZERO stale
b08_p5_prospect_intake 13 · b5c 47 · b08_p1 106 · console 71 · factory 83
b07_p1 75 · b07_p5 136 · b05_couple_soul 21
```

**W-1: ZERO soul bytes in this ZIP.** `closerSoul.js` is byte-identical to
`9b6e3ca`.

## 106 · COPY INVENTORY

**ZERO user-facing bytes.** Two watch classes and one narrowed regex — all
machinery, all report-only, nothing blocks. **The held prose is the only copy in
flight and it is not in this delivery.**

## 107 · WHAT THE NEXT SITTING PICKS UP

1. **The ratify at 13,850**, then the const in its own commit, then the prose.
2. **The named read the chair ordered:** the second pitch after "not interested"
   — conduct, not machinery, and it goes on the next ×3's read list.
3. **§5 is already in the founder's hands:** the console has the handle and city
   fields, and a row added with them opens with specifics instead of generics.
   **The bare row should become the exception, not the default.**
