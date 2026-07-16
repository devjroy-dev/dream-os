# TDW_04 — SPINE → CHECKER SITTING HANDOFF

**CE-22:** dream-os `ebbd6f3` · dreamos-pwa `552646d` **untouched since the B1 seal** · **`0076_capacity` FOUNDER-APPLIED TO PRODUCTION** · **`main` green: build exit 0 · engine typecheck exit 0, zero output · smoke PASS · tombstone bench 15/15** — all four re-run from a clean clone of `origin/main` at this hash.

Written by the spine executor at the spine's close, 2026-07-16, with the evidence still on screen. CE-ratified. **The spine's five artifacts are SEALED. You build on them. You never reopen them.**

**Why this handoff exists and the checker is not in it:** the executor self-audited and banked. §0.1 is that audit's root cause, ratified into the record. **Read §0 first. Each rule cost this sitting something.**

---

## §0 — THREE RULES. EACH ONE WAS PAID FOR HERE.

### §0.1 — **"I TRUSTED MY EARLIER SELF'S OUTPUT INSTEAD OF RE-DERIVING IT."** *(Ratified into the record beside B3's protocol candidate — the record-domain disease, named at its root.)*

Four record-domain misses in three consecutive deliveries. **Not one was caught by re-reading. Every single one was caught by the founder's terminal or by running a command:**

| Miss | Mechanism | Caught by |
|---|---|---|
| §1.4's publish site — `ctx.conversationId` at the resolve | **written from reading** `loop.ts`, not from running it | **the bench (T-4)** — a tombstone in a thread with no user row |
| **`113+/2-` into a permanent commit** (`674ac6c`) | measured **before** the comment surgery, never re-measured | **the founder's terminal printing `126`** |
| `!ctx.saved` — an **unrun command** | authored, never pasted into a shell | **the founder's terminal** |
| a **superseded command left live** in the transcript | a better command was offered; the old one was never *retracted* | **the founder's terminal**, via a commit message describing four files it did not contain |

**The pattern is exact and it is one thing.** The executor's **tool-verified** work held without exception — 15/15, gates green, five sound artifacts. The executor's **authored** work — commands, comments, numbers, messages — is where every error clustered. **All four share one mechanism: trusting an earlier self's output instead of re-deriving it.**

**B3's §0.2 said re-reading is not verification; running the command is.** This sitting proves the sharper form: **your earlier self is a document, and a document has a documented history of drift.** The number you measured twenty minutes ago is a claim, not a fact. **Re-derive it or do not write it down.**

### §0.2 — **A RULING IS WORDED AGAINST A MENTAL MODEL. THE CODE HOLDS A DIFFERENT ONE. CHECK THE RULING AGAINST THE CODE BEFORE YOU BUILD IT.**

Extend §0.1's standard to rulings, exactly as B3 extended it to findings.

**Three times this sitting a correct ruling could not execute as worded, and each was caught on paper:**
- **F-04.50's charter cure** — *"post-auto-link re-check same-binder/**same-date**/same-kind"* — **cannot fire on its own specimen.** The dedupe is date-pinned; a move *is* a date change; the original sat on its origin date when the dedupe ran. Ruled **(γ)**: no mechanical cure lives in `eventWrite`; the finding routes whole to 06.
- **Q-B3-16's shape (b)** — premised on `getOrCreateConversation` being *"idempotent and cheap."* It is **neither**: three round trips plus a 20-row load (no production caller passes a `conversationId`), it **writes on every path**, and its identity diverges past `CONVERSATION_TIMEOUT_MIN`. **The charter ordered that verification and it killed the lean.**
- **Q-S-3 — and it is still live. See §2.6.** Ruled `.neq('id', event_id)`. **`writeEvent` has two update paths.**

**None of these were bad rulings.** Each was worded against a reasonable model of code that turned out to hold a different one. **The executor's job is to run the ruling against the code before building it — and to report, never to quietly adapt.**

### §0.3 — **A SUPERSEDED COMMAND IS A LIVE COMMAND. THE TRANSCRIPT IS THE FOUNDER'S COMMAND SURFACE.**

The executor gave a combined B+C commit line, then two messages later a better split-B line — **and never retracted the first.** The founder ran both. The split one committed B correctly (`2053058`); the stale one found one file left and committed it under a message written for five (`ebbd6f3`).

**Saying "a better command is coming" is not retracting the old one.** Anything runnable left in the transcript will be run — and it will look *correct* while it does the wrong thing.

**Its sibling, and the protocol candidate it belongs to (§7.2):** the executor's git line bounced on the founder's terminal — `bash: !ctx.saved: event not found`. **And the fix a careful executor reasons to (`set +H &&`) ALSO fails**, because bash expands `!` when it *reads* the line, before `set +H` executes. **Only a pty catches this; `bash -i -c` does not reproduce it.** The §6 gates covered code and never covered the commands handed to the founder. **Paste it into a real shell or do not ship it.**

---

## §1 — WHAT IS SEALED. FIVE ARTIFACTS, EVERY CLAIM WITNESSED.

| # | Artifact | Witness |
|---|---|---|
| 1 | **F-04.51's tombstone** — `loop.ts`, shape **(d)**, `674ac6c` | `126+/2-`. **Zero re-indent proven by git itself:** `git diff -w --numstat` is byte-identical to `git diff --numstat` (both `126 2`). 25 added code lines. The moved `RunTurnArgs` type's interior is *unchanged context* — git recognised the relocation. Callers untouched: the export name never moved. **Bench 15/15 against the real compiled `runTurn`**, driven through the real anthropic rethrow. Founder-witnessed on his own terminal. |
| 2 | **`0076_capacity`** — `vendors.slot_capacity` | **APPLIED TO PRODUCTION.** Parsed against real PostgreSQL grammar; executed against Postgres 16; `information_schema` proof witnessed on `nvzkbagqxbysoeszxent`/`main`, role `postgres`: `public\|vendors\|slot_capacity\|integer\|YES\|NULL`. **Witnessed a second way** at `PUBLIC_SCHEMA.md`'s `vendors` ordinal **45**. **LD-8: 0076 is this column's address forever.** |
| 3 | **`db/queries/public_schema_dump.sql`** | Read-only **by grammar** (pglast: one `SelectStmt`). **The guard computes itself** — see §3.6. Proven against Postgres 16: capped deliberately to 5 rows of 12, **every surviving row still reported `tables_expected = 12`.** |
| 4 | **`docs/db/PUBLIC_SCHEMA.md`** — **F-04.57 CLOSED** | **GUARD PASSED: `tables_expected` 57 == 57 rows returned.** 57 tables, **641 columns.** Founder-run, **generated by script from his output, never hand-transcribed.** Both of the dump's falsifiable predictions held (57 tables; `vendors` at 37). `0077`'s drop confirmed independently: `vendor_availability` absent. |
| 5 | **`src/engine/tombstone_bench.js`** — Q-SP-5 | Landed beside `smoke.js`, its only sibling in kind. **15/15 from its home and from any working directory.** *A cure nobody can re-run quietly stops being a cure.* |

**Also sealed:** F-04.55, F-04.56, F-04.57 filed · the masterplan's *"dead structurally"* corrected to *"dead on the ENGINE plane; the PUBLIC plane stayed open until F-04.57"* · T19 recorded in the census as the standing baseline · **the `113→126` erratum in the record** (`2053058`, per Q-SP-4).

**Not code, and it outranks all of it:** **Finding #1's admin credential — `OPEN — rotation pending` since 2026-05-18, recoverable from `dreamos-pwa`'s PUBLIC git history across 29 commits — is ROTATED (founder, 2026-07-16).** Found because the executor's own credential gate fired on a file it was merely re-shipping. **Update Finding #1's status line; the block handover should not carry it as open.**

---

## §2 — YOUR WORK. THE CHECKER. **FULLY SPECCED, FULLY RULED, ZERO LINES WRITTEN.**

Replace `checkOccupancy`'s body — `eventWrite.js`, the statement `async function checkOccupancy(_ctx) { return null; }`. **NO CALLER CHANGES** except §2.5's one ruled exception. Slot branches 3/4 as **pure extension**.

*(Line numbers are given once, at `ebbd6f3`, and then never relied on: `checkOccupancy` at **:273**, its call site at **:382**, `module.exports` at **:501**. The spine's own tombstone moved every number in `loop.ts` down by ~126 and its comments cited the old ones within minutes. **Grep the statement.**)*

### §2.1 — What the checker receives. **Read whole, this sitting:**
```js
const conflict = await checkOccupancy({
  supabase, vendorId, kind, event_date, slot: derivedSlot, event_time,
  ready_by, source, event_id, existing,
});
if (conflict && !force) return { ok: false, conflict };   // WRITE NOTHING
// force -> the clash lands in the note: `[forced YYYY-MM-DD] ${conflict.message}`
```
**One context object, never scalars** (§8's pluggability for 04.5's crew math — the resolver must extend the same context). **B2 shipped the control flow; you write a checker, not a door.**

### §2.1a — **THE WIRING STATE AT `ebbd6f3`, verified. You cannot infer this from the comments.**

**`eventWrite.js` does NOT import `occupancy.js` today.** There is only a comment *predicting* it will (*"B3 replaces the body with a `require('./occupancy')`"*). **The seam is unwired; you wire it.** `checkOccupancy` currently lives **inside `eventWrite.js`** as a private stub.

**The two export surfaces, verbatim at `ebbd6f3`:**
```js
// src/lib/vendor/occupancy.js  — the set + the anchor rule. 175 lines. NO checker.
module.exports = {
  OCCUPYING_KINDS, APPOINTMENT_KINDS, isOccupying, isAppointment, isWeddingAnchor,
};

// src/lib/vendor/eventWrite.js  — the door.
module.exports = { writeEvent, CALENDAR_KINDS, deriveSlot };
```
**The checker's home is `occupancy.js`** (the CE's *"the set ships in occupancy.js as the one export"*, and the file's own header says its body *"lands here at B3's occupancy sitting, after 0076"* — **0076 is now applied; that condition is met**). `eventWrite`'s stub becomes a thin `require('./occupancy')` call. **`deriveSlot` stays in `eventWrite`** — it is exported and its branches 1–2 are witnessed-correct; branches 3/4 consult the table via an import, **never by moving the function** (two homes for one rule would BE F-04.36).

**No migration is owed.** `slot_capacity` exists at `0076`, applied. Ladder tail: `0076` ✓ · `0077` ✓. **Do not claim a number you do not need.**

**Gates you owe:** `node --check` on every touched `.js` (the checker is `.js`, not `.ts` — **`tsc` is N/A unless you touch the engine**) · `npm run build` + `node src/engine/smoke.js` if you do · **`node src/engine/tombstone_bench.js` must stay 15/15** — it is a sibling now, and a green estate includes it. **Frontend N/A (dream-os only) — if that changes, STOP and ask.** Delivery: **ZIP-only, `deploy/` prefix, verified with `unzip -l` before handover.**

### §2.2 — The map (Q-B3-2, corrected and ruled). **Key space = `PROFILES`' six** — the only space `profileFor` can return, verified by running the real resolvers:
```
photography 1 · makeup 2 · decor 1 · venue 1        (timelineType 'event')
designer / jewellery -> occupancy OFF               (timelineType 'delivery'; ready_by clustering, C9)
other -> occupancy OFF + occupancy_unmapped, once per vendor
```
**No `florist` key** — `normaliseCategory('florist')` → `'other'`; `categories.js` merged florist into decor on 2026-05-15. A floral-decor vendor sets `slot_capacity=3`. **`profileFor` returns a synthetic `other` for everything unmapped — which is what makes `occupancy_unmapped` reachable at all.** All defaults **NULL-overridable**: `vendor.slot_capacity ?? categoryDefault`.

### §2.3 — **`slot_capacity = 0` (Q-SP-1, RULED).** `0` **IS LAWFUL**. It emits **`capacity`**, and it is **FORCE-ABLE**. No CHECK, ever.

**The distinction goes in the checker's comment, citing this ruling:**
> **A block is a dated, deliberate refusal — overriding it must be two witnessed acts.** **`slot_capacity = 0` is a standing posture** — *"I never shoot mornings"* — **and an exception to a posture is ordinary vendor life**: *"…but for this client I will."* **Force past a posture is the owner amending his own default for one decision. Force past a block would be confidence beating a stated refusal.**

**The verdict's `message` must make the posture visible** — *"your morning capacity is 0"* — **so the force is informed.**

### §2.4 — **`date_blocked` (Q-B3-8).** Fourth `ConflictPayload.kind`. **`force` explicitly ignored** — assert it **by source position, benched**, the way B2 asserted force-never-reaches-dedupe. P3's *"blocked consumes all capacity"* is **SUPERSEDED ON THE RECORD**: a refusal is not capacity arithmetic; refusals do not participate in force math.

**The wire** (spec `:62-66`), which you extend to four:
```ts
{ kind:'capacity'|'appointment_overlap'|'cluster'|'date_blocked', slot?, date,
  holding:[{event_id,title,slot,kind}], capacity?, message }   // message = a plain sentence, handed to Victor verbatim
```

### §2.5 — **The sealed leg (Q-S-2, RULED — this authorises the touch, minimally).**
`lockstepBinderToEvent`'s drag — the statement `event_id: ev.id, event_date: date` inside its `for (const ev of evs)` — gains **`force: true`**, **plus one fire-and-forget ledger line when a drag's conflict was overridden.**

**Why:** a wedding moving is a decision already made; the drag is its consequence, not a proposal. **And `date_blocked` still refuses by Q-B3-8, so a drag can never land on a block.** **F-04.56 is why:** today the drag passes no `force` and **never reads the return** — the `catch` catches throws; a conflict is a *return*. Inert only because `checkOccupancy` returns `null`. **The moment you give it a body, this leg silently drops drags: the binder moves and the calendar does not.** The vendor-facing surfacing is **B4's, with F-04.55.**

### §2.6 — 🔴 **Q-S-3 IS INCOMPLETE AS WORDED. DO NOT BUILD IT LITERALLY. THIS IS YOUR OPENING QUESTION.**

**Ruled:** *"`.neq('id', event_id)` when present. One row seen twice is not a conflict."* **The intent is right. The predicate is short, and the code is why:**
```js
// dedupe fork:            if (!isUpdate) { existing = await findExistingEvent(...) }
// the write's own target:  const targetId = event_id || existing.id;
```
**`writeEvent` has TWO update paths.** A CRUD PATCH carries `event_id` (and `existing` is null). **A dedupe-resolved re-booking carries `event_id: undefined` and `existing.id` set — and it is an UPDATE of that row.** Excluding only `event_id` excludes **nothing** on that path.

**Consequence, concretely:** Victor re-books *"Meera Kapoor - wedding shoot"* on a date it already occupies. Dedupe resolves it → this is an idempotent re-confirmation. The checker queries the date, finds **the very row being updated**, and at `photography 1` returns **`capacity`** — **a booking conflicting with itself, forceable only by pretending it is a double-booking.**

**PROPOSED, NOT TAKEN:** the exclusion is **`event_id || existing?.id`** — the write's own `targetId` expression, reused. **This is §0.2's shape exactly, third instance, and it is the one still live. Ask before you build.**

**Q-B3-13 is untouched by this and stands: exact duplicates ARE capacity consumption — the checker tells the truth. That is TWO ROWS. This is ONE ROW SEEN TWICE.**

### §2.7 — **Horizon-blindness (F-04.47, ratified).** Query `from('events')` **directly**. **`deleted_at is null` + `state <> 'cancelled'` are the ONLY lawful non-occupancy.** Carry a comment naming F-04.47 against a future *"symmetry with the grid."*

**The witnessed list settles two things that were guesswork until `PUBLIC_SCHEMA.md` landed:**
- **`state text NOT NULL default 'upcoming'`** — state is **never NULL**, so `.neq('state','cancelled')` is safe. **Had it been nullable, that filter would silently drop NULL-state rows** (`NULL <> 'cancelled'` → NULL → excluded) **and hand a vendor a clean slot on a date already holding a booking — F-04.47's disease through a nullability trap.**
- **`vendor_id uuid` NULLABLE** (the couple XOR) — `.eq('vendor_id', …)` excludes NULLs, which is what you want.

**All eight columns witnessed present:** `event_date date NOT NULL` · `slot text` · `kind text NOT NULL` · `state text NOT NULL default 'upcoming'` · `deleted_at timestamptz` · `vendor_id uuid` · `linked_binder_id uuid` · `ready_by date`.

### §2.8 — Also yours: **C5's `appointment_overlap`** (APPOINTMENT ∩ slot shared with an OCCUPYING booking; advisory) · **C9's clustering** (>3 `ready_by` in any rolling 7 days → `cluster`, advisory, **never blocks**, once per window).

### §2.9 — **The proofs.**
- **§1.6's crown — BENCHED AT THE `writeEvent` BOUNDARY (Q-S-1(i)).** Two source positions, one payload, byte-compared. **NOT through the doors: they swallow it — F-04.55.** `force` on a capacity clash lands with the clash in the note; `force` on a block is refused.
- **Acceptance #9's boundary units:** 11:59 → morning · 12:00 → noon · 15:59 → noon · 16:00 → evening. **Branch 2 is already exactly C2 — witnessed at HEAD. Your units codify existing behaviour; branches 3/4 are the only new derivation.**
- **Acceptance #3, reachable at last** (makeup 2: two morning bookings OK, third conflicts).
- **Exact-duplicate = real conflict** (Q-B3-13).
- **§5's inherited ledger — explicitly.**

---

## §3 — RULINGS THAT APPLY WITHOUT RE-LITIGATION

1. **The ternary is RATIFIED IN FULL** — `OCCUPYING` 3 (`shoot`,`family`,`ceremony`) / `APPOINTMENT` 8 / `NEITHER` 2 (`other`,`blocked`) = 13. **Run, not read, at the spine: 3+8+2=13, no kind in two homes.** Membership is asked **POSITIVELY** — `isOccupying(kind)`, never `!isAppointment(kind)`. On a ternary those differ on exactly `{other, blocked}` — the two that must never speak for a wedding (Q-B3-9).
2. **`other` is NON-OCCUPYING** because **`recordPrimitives.ts:403` instructs the model** — *"if unsure, leave it and a neutral booking is kept."* **`other` is the uncertainty sink by written instruction, and uncertainty must never consume capacity.** *"A timeless entry must not eat a day"* is the corollary, **not the reason.**
3. **SLOT ANSWERS WHERE. OCCUPANCY ANSWERS WHETHER.** Branches 1–2 are **KIND-BLIND and stay that way.** Only the no-time case consults the table.
4. **Q-S-4 — blocking onto a booking: SILENT.** A block is a refusal of *future* work; standing bookings remain, visible, occupying. **The tension is the day sheet's to render (B5 note), never the wire's to invent.**
5. **F-04.50 → (γ), RULED.** No mechanical cure lives in `eventWrite`; the finding routes **whole to 06's dispatch half.** *(α)* is a janitor arriving after the crime; *(β)* redefines dedupe against legitimate second shoots.
6. **The dump's guard computes itself, and that is a ruling, not a style.** The engine twin hardcodes *"confirm 25 rows"*; the public twin **cannot** — public's table count is the fact it exists to establish, and every available number is stale. **Hardcoding it would be F-04.57's disease inside F-04.57's cure.** If you regenerate: **rows returned must equal `tables_expected`, or the cap bit and the output must not be committed.**
7. **`isWeddingAnchor` lives in `occupancy.js` beside the set it consumes** (Q-B3-10). **One home, both doors, takes `supabase` not `req`.** Do not fork it.
8. **The tombstone's predicate is canonical:** *the tombstone marks an orphan; an orphan requires a user row.* The catch fires **only** on `ctx.conversationId && !ctx.saved`, and **always rethrows.**

---

## §4 — FINDINGS. DO NOT TRIP OVER THESE.

- **F-04.55 🔴 → B4's opening item.** **The conflict verdict is unreachable through chat and unreadable through CRUD — the fifth unreachability-family member** (with `findExistingEvent`'s dedupe · `ALREADY_BLOCKED` · the sentinel · the short-circuit). Of **eleven** `writeEvent` call sites **exactly one** mentions `.conflict`, and it `console.error`s the kind and `continue`s. The CRUD door does `errRes(res, 400, result.error)` and a conflict return **has no `error` field** — the vendor receives a bare **`{"ok":false}`** (witnessed by running `lib/response.js`'s real helper). **Spec P2's *"door hands it to Victor verbatim"* is specced-never-implemented.** **Spec §5's founder smoke is DEFERRED to B4, where it becomes provable.** The silent-door + F-04.51's fabrication habit is **an invitation to a fabricated "Done"** → noted into 06's packet.
- **F-04.56 🔴 → B4, with F-04.55.** §2.5. **Your checker is what makes it live.**
- **F-04.57 🟡 CURED.** Its sharpest evidence, for whoever doubts the cure was needed: **the engine twin's two founding specimens were `vendor_activity_log.detail` and `agent_snapshot.rebuilt_at` — column names guessed from prose into founder-run SQL. `vendor_activity_log` is PUBLIC.** The cure was built on the engine plane; one of its two specimens was on this one.
- **F-04.47 🟡 → B5.** The surfaces carry a forward horizon the database does not. **Your checker is horizon-blind by construction and must stay so.**
- **F-04.49 🟡.** Every ledger row before `77107c6` is **unattributable**. **Do not read the old ledger as evidence of a door.**
- **§4.3 SSE — OPEN.** *"…I'll have Operator log that.Done."* **Not reproduced is not exonerated.**

---

## §5 — THE UNPROVEN LEDGER. **YOUR SMOKE INHERITS THESE. THEY HAVE NOW SURVIVED THREE SITTINGS.**

| item | status |
|---|---|
| **F-04.42** (add-and-strike) | shipped, **no production witness**. Move an event off a date via Victor; **no `donna_unblock_date` may appear in the turn.** The row won't tell you — only the log will. |
| **F-04.44** (both selects) | shipped, **no production witness**. Create a lead with a budget; edit a field on one that has a budget. **The figure must appear both times.** |
| **T12** (retroLink) | **inherited, never proven, three blocks running.** Calendar event for a brand-new couple name → file a lead for that name via chat → **the event must gain `linked_binder_id`.** |
| **ERROR gate** | **BENCH-ONLY by deliberate restraint, CE-accepted.** Forcing a real `writeFields` failure means breaking a live estate on purpose. |
| **T1** | Twilio-blocked. |

---

## §6 — ANCHOR TRUTHS

**L-8 / T19 — the standing baseline, and it must be green again at block close:**
```
oracle_outstanding  125000
oracle_owed_count        3
oracle_on_calendar       4
```
Rows: Family wedding 25 Jul · Ananya recce 25 Jul · **Meera trial 2 Aug** · Meera wedding shoot 22 Nov.

> **A green oracle is not a clean estate. It counts money and rows; it never asks whether a binder's date is a wedding.** `125000/3/4` was green while Ananya's binder said her wedding was her recce.

**⚠ T19 is carried on a FOUNDER ATTESTATION, not a cold-run transcript** — the run's output was lost to context truncation and the founder's word is the witness, by his ruling. **The block-close re-run owes the full header + pasted rows, and this record does not excuse it.**

**Prod state:** Meera binder `2026-11-22` · shoot `671902e6` `2026-11-22` upcoming · shoot `5464cc5d` `2026-11-08` **cancelled** (F-04.50's residue; had it survived it would have been the checker's first conflict — with itself) · **trial `98c91056` `2026-08-02`** (founder SQL, 2026-07-16 — **supersedes the opening packet's §6, which carried a stale document's 1 Aug**) · Ananya binder `2027-01-01` · recce `c0401b41` `2026-07-25` 09:00.

**`oracle_date_coherence` (§2.7's costed proposal) LANDS — one CTE, ruled.** In the **census file** beside the oracle it extends. **Census `match_key` semantics BY RULING** — `coalesce(nullif(trim(phone),''), lower(trim(client)))`, **not `phoneKey`**: `phoneKey` already has two homes (engine + the PWA's `cabinet.ts`, byte-for-byte by its own comment) and **a SQL third would be F-04.36's regression.** **`donna_find` has NO pairing logic to reuse** — it runs the same tokens against both planes and prints two lists; the "pairing" was a human reading adjacent output. **`engine.records` has 21 columns and no lead FK.** The term's comment carries **both caveats verbatim: a floor in one direction (asymmetric/differently-formatted phones never pair), inflatable in the other (the name fallback false-fuses two clients named "Priya") — a floor with a known false-positive channel, never a rate.** Reads only; the R1(b)/R2 boundary uncrossed. **Widening the oracle's `binders` CTE cannot disturb T19:** `sum(pending)` and `count(*) filter (where pending>0)` are indifferent to extra columns.

---

## §7 — OPEN CE ITEMS (all four ruled; none built)

| # | Item | Ruling |
|---|---|---|
| 1 | **`ebbd6f3`'s message describes four files it does not contain** (they are in `2053058` beneath it) | **LEAVE IMMUTABLE.** Correct forward. Q-SP-4's reasoning unchanged: force-pushing shared history is disproportionate, and the erratum in the record teaches what an amend would erase. |
| 2 | **Retraction-by-name** (§0.3) | **PROTOCOL CANDIDATE.** A superseded command is retracted **by name** in the same message — *"do not run the earlier block"* — never merely followed by a better one. **Sibling to Q-SP-6's two ratified clauses** (`git commit -F -` with a quoted heredoc for any message carrying shell metacharacters; every shell line handed to the founder is pasted into a real shell first). **The `set +H` trap is recorded verbatim — it is the paragraph that makes the candidate teachable.** |
| 3 | **The log gap** — `FINDINGS_LOG` runs F-04.2 → F-04.49 and stops. **F-04.50–F-04.54 (B3's, including F-04.51, whose cure the spine shipped) are NOT indexed there** — they live only in `TDW_04_B3_RIDER_PROOF_PACKET.md`. The spine charter says to read *"F-04.43 through F-04.54"* in FINDINGS_LOG; **five of eleven are not in that file.** | **INDEX ENTRIES OWED.** Not backfilled by the spine — a docs pass outside its charter, raised rather than taken. |
| 4 | **The constraints dump** — `PUBLIC_SCHEMA.md` carries **name, type, nullability, default and nothing else.** `information_schema.columns` does not yield **CHECK constraints, indexes, FKs, triggers or RLS.** So `events.kind`'s thirteen-value CHECK, `events.slot`'s CHECK and `0075`'s UNIQUE partial index are **real and invisible in it.** It answers *what columns exist*, never *what values are legal*. | **ADDENDUM FOR THE FOUNDER.** Named in the file's own header so the silence is not misread as absence. |

**Also owed:** **Finding #1's status line still reads `OPEN — rotation pending`. The rotation is DONE (founder, 2026-07-16). Close it.**

---

## §8 — DISCLOSURE

1. **§0.1 is this sitting's whole disclosure, compressed.** Four record-domain misses, three deliveries, **zero caught by re-reading.** The sentence is in the record because it is the root, not because it is elegant.
2. **The executor banked rather than build ZIP D, and the self-audit was the deciding evidence** — which is itself a claim that deserves suspicion, so here is what made it decidable: **the trend line, not the feeling.** Tool-verified work held without exception; authored work degraded, and **the checker is mostly authoring** — ~200 lines holding eight interacting rulings, whose failure modes are **gate-blind** (`typecheck` will not catch *"you added a horizon filter for symmetry with the grid"*). **The CE had to rule Q-SP-2 because one line was wrong in the simplest piece of the block.**
3. **Three deviations from protocol §7, all disclosed at the time, all still deviations:** the CE-packet ZIPs deliberately carry **no `deploy/` prefix** (transport must not be applicable — the founder's instruction, and the fixed apply command was **tested to land nothing**) · the spine's own packets were transport, never applied · **`674ac6c` carries a false `113`** and stays immutable by ruling.
4. **The credential find was luck wearing procedure's clothes.** The executor's gate fired on `FINDINGS_LOG` — a file it was **merely re-shipping, not authoring.** Had the ZIP not happened to contain that file, nobody would have looked. **The gate deserves the credit; the executor does not.**
5. **Claims in this handoff that are NOT the executor's own witness, named in place:** F-04.50's turn payload (B3's, from the rider proof packet — the executor has no turn log) · `35c9ce50` (a prod row; cited from B2's `FINDINGS_LOG` and the handoff) · **T19** (founder attestation, §6) · the Meera trial `2026-08-02` (founder SQL) · the Anthropic API's rejection of a leading assistant turn (asserted from knowledge, **never run** — and the T-4 finding does not lean on it: *a tombstone answering nothing is already a lie*).
6. **Everything else in this handoff was read whole or run this sitting and re-verified by command immediately before it was written down**, at `ebbd6f3` — including §2.6's two update paths, §2.7's eight columns, the `126 2` in §1, and the four gates in the header. **§0.1 is why that sentence is here rather than assumed.**

---

**The spine's five artifacts are sealed and defended. The checker is fully specced and entirely unbuilt. §2.6 is your opening question and it is the third instance of §0.2 — a ruling that cannot execute as worded. Ask before you build it.**

**Your first act is §2.6, on paper. Your second is T19 on a green banner. Nothing else opens before those two.**
