# TDW_05 — THE COUPLE-LANE MECHANICAL ARC · MOVEMENT M1 · HANDOVER

**Executor session, 2026-07-24. Built at base `5f2a79b` (re-derived fetch-first at build open; `git status` clean, §11 first motion).**
**Scope as ruled at CE-67 + the gates block: C5 · C1 · C2 · C10-bride · F-05.42 (folded).**

---

## 1. WHAT SHIPPED

### C5 — the turn lock (F-05.41)
**NEW `src/lib/turnLock.js`.** A per-key promise chain: one human's messages process one behind the other. Wired by **wrapping the CORE, not the route**, in both `brideInbound.js` and `vendorInbound.js`, so every caller inherits it — the Meta webhook, the dead-letter replay, and any future ingress — instead of each door remembering.

**Two things stated rather than quietly adapted:**

- **The key is the lane-scoped phone, not the conversation id.** At the seam the conversation does not exist yet: both cores resolve it several awaits deep, and `vendorInbound` can reach more than one thread for one phone. Keying on the resolved id would put a DB round-trip in front of the lock and re-open the race inside the resolution. Phone-keying is a **superset** of conversation-keying — strictly safer, never laxer — costing only one human's concurrency with themselves. Lane-scoped so the P4 makeup artist's vendor briefing does not queue behind her bride turn.
- **The single-replica gap is disclosed in-file**, F1(b)/CE-58's precedent verbatim in the header, with the durable Postgres-advisory cure **DEFERRED-NAMED** at the one home where a future engineer will find it. The disclosure is explicitly scoped to *this* lock; consumed-once (M2) carries its own.

**The narrow vendor fence held.** `vendorInbound.js` gained the import and the wrapper and **nothing else** — bench §6.3 asserts no bride machinery (`witnessLine`, `sendOutcome`, `appendWitness`, `makeInboundSend`) appears in that file.

### C1 — the return-value contract (F-05.33)
**NEW `src/lib/sendOutcome.js`**, the one home the F-05.48 sweep will sit on.

- Reads **both** live refusal shapes: `whatsapp.js:133` **returns** `{blocked}`, `sendWa.js:202` **throws** `WaOptedOutError`. A seam reading one drifts the day a call site switches API.
- **`blocked` is the refusal test — deliberately not `sent === false` or `!sent`.** Every real caller and every existing floor fake returns `{sid:'X'}` with no `sent` field; keying on `sent` reads all of them as refusals and invents an outage. Bench §2.2 is that trap, and §7's second mutation proves the cell is load-bearing.
- **`INBOUND_BYPASS` re-exports `fullStop.js`'s `ACK_BYPASS`** — the same object, a wider name, the reason in-file. Bench §3.2 asserts **object identity**, not that two objects agree today.
- **F2(b) structural, as ruled:** `makeInboundSend` wraps the injected sender once per frame; every non-ack send inherits the bypass by construction. Bench §3.4 asserts over the **file** — no non-ack site may call the raw API — so a branch added next block gets the bypass or the bench fires.
- **V-3 lands on its own explicit bypass:** the message that explains the silence must never be the message the silence swallows.
- **A genuine transport failure stays one.** Refusal and failure are not collapsed in either direction (F-04.62, both ways).

**The four ack sites are BYTE-UNTOUCHED, by law and on purpose.** `b05_p4_crons_bench §5.3` byte-diffs that whole region against its vendor twin, and `§9.11` binds `ACK_BYPASS` literally at every ack. Both cells are right. The frame wrapper covers everything *else*.

**M-C, the circle wire by inclusion:** `send` is threaded into `handleCircleMemberMessage` as a **required** parameter. A default falling back to the bare API would restore the exact silence this movement cures, invisibly.

### C2 — the witness (F-05.34), A + C paired
**NEW `src/lib/witnessLine.js`** — ONE derivation used at BOTH seams.

- **A:** the footer rides the **outbound body**, because on WhatsApp "the thread" smoke card S4 asks the founder to read is the delivered text on his handset. A witness living only in a DB column is invisible to S4.
- **C:** `brideEngine.js`'s replay select widens to carry `tool_calls` and reconstructs the footer for rows persisted before this cure — so every assistant turn in the model's history is marked **if and only if it actually filed**, mechanically, from the row's own hands, never from its prose. Prose is the thing being audited.
- **Money renders in Indian grouping, hand-rolled, not `Intl`.** The grouping IS the safety property: `Rs 40,00,000` reads as forty lakh in one second and `Rs 4,000,000` does not. That is why V-4's specific form won, and bench §4.4 is the cell.
- Result-first, input-fallback, **`ok === true` required** — an errored hand is not a filing (§2.2 sentence 2). Reads are never witnessed. Idempotent, so a row persisted with a footer is never double-marked.

**SQL-provenance:** `tool_calls jsonb` is column 8 of `public.messages`, witnessed at `docs/db/PUBLIC_SCHEMA.md:601` (snapshot 2026-07-23, ladder tip 0099). Cited in the code at the select.

### C10-bride + F-05.42
- `brideInbound.js` — the stale `// ── Send the reply via Twilio` heading is dead on a Meta-only estate.
- **F-05.42 CURED at its true site.** The block read `const phone = phone;` — a block-scoped const initialised from itself, inside its own temporal dead zone. Every entry threw on line one, so `captureDeadLetter` never ran and the graceful line never went out: the net crashed with the turn it existed to record. Filed against `brideIndex.js:181`; the M2b sunset had moved the site to `brideInbound.js:588`. The dead duplicate `return;` at `:593` joined C10's prose set. **The vendor twin has no such shadow — which is why its net worked the same day (turn `634ece1b`), F-05.42's living contrast, now asserted at bench §5.4.**

### V-1 / V-2
`nudgeCopy.js` — `full_stop_confirmation` reconciled to the G-A ruling byte-exact as locked; `full_start_confirmation` **unchanged**, its CE-63 hold recorded closed by ratification.

---

## 2. WHAT IS PROVEN

**`scripts/b05_arc_m1_bench.js` — 46/46 GREEN.** Runnable from any working directory (Q-SP-5). The five named tests:

| § | Named test | Finding |
|---|---|---|
| §1.1 | two turns 1.1s apart on one phone do **not** overlap | F-05.41 / C5 |
| §2.x | the swallowed refusal, both API shapes, the vacuity trap | F-05.33 / C1 |
| §3.1 | every send in the inbound frame carries the bypass, asserted structurally | G-A / C1 |
| §4.x | a filed turn is not a narrated one; the 10× write visible on the handset | F-05.34 / C2 |
| §5.3 | **the cell whose absence let the bug live** — drive the catch, assert the ROW lands | F-05.42 |

**§7 — eight mutations of PRODUCTION CODE**, each reproduced RED on exactly its named cell, tree restored byte-identical and asserted so at §7.0:

| Mutation | RED on |
|---|---|
| the turn lock removed | §1.1 |
| sentinel keyed on `!res.sent` | §2.2 |
| the return value discarded again | §2.1 |
| the frame bypass dropped | §3.1 |
| the witness never reaches the body | §4.8 |
| western grouping instead of Indian | §4.4 |
| the replay select narrowed back | §4.9 |
| `const phone = phone` restored | §5.3 |

**THE FLOOR — fourteen-for-fourteen, every count byte-stable** (`npm run build` run first):

`crons 48 · sendwa 55 · webhookcore 11/11 · otp_meta 24 · b0498 58/58 · punct 17 · movementb 47/47 · transport 10 · m1b 4 · m2 2 · prospect 47 · checker 101/101 · onboarding 27 · couple_soul 21 · f0532 GREEN (11)`. All rc=0. **`f0532` untouched — it re-baselines at M5, not here.**

**§6 gates:** `node --check` clean on all nine touched `.js` files. **W-1 asserted mechanically** at §6.4 — the bench greps the working diff and fails if `miraSoul.js`, `brideSystemPrompt.js`, `circleSystemPrompt.js`, `brideTools.js` or either vendor soul appears. Zero soul/prompt bytes. `loop.ts` 0-line (§6.2 asserts M1 did **not** reach the engine — that comment is M4's, riding the wall).

---

## 3. THE ONE FLOOR DEVIATION — REPORTED, RATIFY-OR-REVERT

**`b05_p4_crons_bench.js` §9.9 carries a LABELED AMENDMENT. Count preserved 48/48.**

The cell asserted `/won't message you again/i`, which was the true absoluteness of the machine when P4 shipped it. **G-A retired that semantic.** V-1 is founder-locked byte-exact and says *"I won't message you **first** about anything… If you write to me I'll still answer."* Left unamended the cell forbids the estate from shipping the line its own ruling requires, while reporting green about a promise the machine no longer keeps — the CE-63 B2 class.

The amendment **re-aims** the absoluteness at initiation and **adds** an assertion for the half the ruling created, because under (b)+(c) a line stating only the silence lies in the other direction. **It is strictly stronger: it now binds both halves.** Header cites Ruling №1 (bench-follows-the-law) and CE-63's four fixture precedents. **This is the only floor deviation in M1 and it is visible rather than passed silently.**

---

## 4. WHAT DRIFTED FROM THE CHARTER (all four credited at CE-67, restated so the ZIP carries them)

1. **W1** — C1's mechanism: `sendWhatsApp` **returns** a sentinel, never throws. The cure is a return-value contract, not a catch rewrite.
2. **W2** — F-05.42's site: `brideInbound.js:588`, not `brideIndex.js:181`. The M2b sunset moved it.
3. **C9 composition** — one insert, one select, one update, one delete; not "four inserts". `eventWrite.js:34`'s own line numbers are byte-accurate at this base; the charter carried the CE-64-era set.
4. **D5** — the lock ratification is not verbatim in the committed band; CE-67's first entry carries it in.

---

## 5. THE `:1892` PHANTOM-ROW SHAPE — DERIVED, AND **NOT BUILT**, WITH THE CENSUS

The ruling asked for the minimal shape (gate-before-insert or mark-skipped) at `brideEngine`'s circle-digest pre-insert. **Derived by command at this base, neither is needed, because the gated Class-C send the shape protects against has no instance:**

- `surfacePendingCircleSessions` has exactly **two** callers — `brideEngine.js:117` (inside `runBrideAgenticTurn`) and `brideInbound.js:516` (the `/surprise` path, which skips the agent).
- `runBrideAgenticTurn` has exactly **three** — `brideInbound.js:569` and `api/couple/chat.js:157`/`:231`.
- Every WhatsApp path reaching the pre-insert sends through the **bypassed** `send` and therefore **lands**. The remaining path is the **sanctuary PWA door**, which makes no WhatsApp send at all and so has nothing to gate. **No cron reaches it.**

Building a guard here would be inventing a cure for a disease with no specimen. **So the bench guards the CENSUS instead (§6.5):** the day a proactive caller is added, the cell fires and the shape gets built then, against a real path.

**One observation banked, not filed as a finding without the CE's word:** the sanctuary door's pre-insert writes `channel: 'whatsapp'` for a summary delivered on the web. That mislabel predates M1 and M1 does not touch it.

---

## 6. DECLARED GAPS

1. **`update_*` / `delete_*` carry no witness footer.** "Saved:" is a false word for a deletion, and "Updated:"/"Removed:" would be new bride-readable copy outside the four strings M1 was ruled to build byte-exact. Minting unapproved copy to widen a cure is how unapproved copy ships. **One veto slot wide; the CE's to close.** Bench §4.7 asserts the gap rather than hiding it.
2. **The lock is in-memory.** Total at single-replica, which is production today; the multi-replica cure is one function swap at `turnLock.js` and is named there.
3. **F-05.48** (the estate-wide sentinel blindness, ~60 call sites, `no_meta_lane` landing silent) is named in `sendOutcome.js` and charters separately.

---

## 7. WHAT THE NEXT SITTING PICKS UP

**M2 = C3 + C4** — the provenance-hold port via `engine/dist` require (D-10 engine-build step), `save_wedding_detail` scoped to `budget_total` alone, confirm-consumed-once with **its own** replica-exposure sentence. The bride money-write field map derived at read-first: `add_booking:299/:303 · update_booking:366/:370 · record_payment:410`.

Then **M3** (C7, authored against the founder's `pg_constraint` paste: `users_auth_user_id_fkey` on **engine.users** → `auth.users(id)` ON DELETE CASCADE) · **M4** (C8 + C10-loop, wall opening, its own veto slot) · **M5** (C6, last, `f0532` labeled amendment) · **M6** (C9(a) per G-2, after M2).

**The founder's live witness is his, declared-not-claimed.** Smoke card S1/S3/S4 exercise M1; S3's silent-window limb is proven structurally here and witnessed at the next natural nudge window per the CE's split.
