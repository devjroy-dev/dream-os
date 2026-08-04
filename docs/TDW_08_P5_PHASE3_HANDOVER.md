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
