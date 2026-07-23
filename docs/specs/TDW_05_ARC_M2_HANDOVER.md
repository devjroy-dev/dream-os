# TDW_05 — THE COUPLE-LANE MECHANICAL ARC · MOVEMENT M2 · HANDOVER

**Built at base `0da540a` (fresh clone, `git fetch`, `git status` clean — §11 first motion).**
**Scope as ruled at CE-67 + the V-5 relay: C3 + C4, plus V-5's labeled M1-bench extension.**

## 1. WHAT SHIPPED

**NEW `src/lib/moneyGuard.js`** — provenanceHold's port to the bride wire, plus confirm-consumed-once.

**TWO DIVERGENCES, both forced by facts derived at this tip, both disclosed in-file:**

1. **The dist require is LAZY, not module-scope.** `src/engine/dist/core/provenanceHold.js` transitively requires `db.js`, which **throws at require time** without `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY`. `brideEngine.js` is required by `b05_couple_soul_bench` and `b05_f0532_haiku_ceiling_bench`, neither of which carries credentials — a module-scope require would have REDded two floor benches on a module they do not test. Deferring to first use keeps F4's ruled one-home normalisation and keeps brideEngine's load clean. Production unaffected.
2. **The selector is a descriptor, not a name list.** `provenanceHold`'s `Record<string, string[]>` cannot express `save_wedding_detail`, which takes ONE polymorphic `value` key for five field types (`brideTools.js:44-51`). **Derived by command: `parseMoney('2027') === 2027`** — and `brideTools.js:50` explicitly invites a bare-year value. Unpredicated, the guard reads her wedding year as a rupee figure and **refuses to let her set her own wedding date**. So each entry carries an optional predicate, `save_wedding_detail` scoped to `field === 'budget_total'` exactly as ruled. **Normalisation shared; selection this lane's. The vendor file is untouched.**

**THE SEAT — `executeBrideTool` (`brideEngine.js`), the seam BOTH agents share.** Derived: two callers, `brideEngine.js:239` (bride agent) and **`circleEngine.js:148` (circle agent)**. Seating inside the function covers both by construction; seating at the bride call site would have left the circle door open. The circle lane whitelists only `list_muse`/`delete_muse_save` today, so the guard is a no-op there — but a circle money hand added later cannot be born outside the floor.

**THE CORPUS**, ported from `loop.ts:442-445`: her user-role history plus the message in hand. **Hers only** — the system prompt, the dynamic context block and Mira's own prose never vouch. Neighbourhood is the donor pool (F-04.70); this excludes it. **Fail-closed** on a missing corpus.

**CONFIRM-CONSUMED-ONCE.** Grepped at this tip: **zero pending-confirm state exists on the bride lane**, so it was born rather than wired. The claim is on the WRITE, keyed `(conversation, tool, subject, figure)`, 90s TTL, reaped every call. F-05.41's specimen is the derivation, not an analogy. Runs **after** provenance so an unvouched figure never spends a claim it was not entitled to (§4.6 asserts the order). **It carries its own replica-exposure sentence** — the lock's disclosure does not cover it, and the two degrade differently at two replicas; the durable cure (unique partial index or advisory lock on the same tuple) is DEFERRED-NAMED at its own home.

**No new bride-readable copy.** The hold's display is a **tool result**, read by the model, which then speaks in Mira's voice — exactly as `provenanceHold`'s display works on the vendor wire (`donna.ts:512-513`). W-1 holds; the veto list is untouched.

**V-5** — `witnessLine.js` gains `— Updated: ` / `— Removed: ` and the two bare degrade forms, byte-exact as locked, under the render-from-args law.

## 2. ONE READING STATED, BECAUSE BUILDING ON THE WRONG ONE WOULD BE SILENT ADAPTATION

The relay says the footer derives "ONLY from the hand's own witnessed toolCall **arguments**". **`delete_event`'s arguments are `event_id` alone** (`brideTools.js:281`, `required: ['event_id']`) — so the relay's own worked example, `— Removed: sangeet, 20 Dec`, is **unproducible from input** and can only come from the returned row. I therefore read "arguments" as **the witnessed toolCall record (input AND result), never model prose** — M1's result-first discipline extended unchanged rather than inverted. The row is also the *more* witnessed of the two: input is what was asked for, the row is what the database did. Stated in `witnessLine.js` at the law's own site. **If the CE meant input-only, every delete degrades to bare and §8.2 must be struck — one line either way.**

## 3. WHAT IS PROVEN

**`scripts/b05_arc_m2_bench.js` — 27/27 GREEN**, five production mutations RED on exactly their named cells, tree restored byte-identical:

| Mutation | RED on |
|---|---|
| the hold removed | §1.1 the 10× write files with ok:true again |
| the polymorphic predicate dropped | §2.1 a wedding date holds its own write |
| fail-open on a missing corpus | §1.4 silence vouches for any figure |
| consumed-once removed | §4.1 one "yeah" writes twice again |
| the claim never expires | §4.4 a real second payment is walled forever |

**THE NAMED PROOF-TEST, through the REAL `executeBrideTool`:** prose "4 lakhs", hand `4000000` → **HELD, zero inserts reached the door**; the same sentence with `400000` files clean.

**`scripts/b05_arc_m1_bench.js` — 46 → 53. SEVEN CELLS ADDED, ONE AMENDED, ZERO REMOVED.**
- §8.1–§8.7: V-5's receipts, both degrade paths, the locked strings byte-exact, the hand census enumerated.
- **§4.7 AMENDED IN PLACE, labeled at its own site.** As shipped it asserted the DECLARED GAP — that `delete_*` gets no footer. V-5 closed that gap; left unamended the cell would forbid the receipt the founder just ruled in. Its **purpose is preserved exactly** (no filing may wear a false verb) and is now asserted as vocabulary non-overlap. The in-file `DECLARED GAP` notice in `witnessLine.js` was retired **with** the gap — a cured finding wearing an open flag is the stale-comment class. **CE-63's B2 class, second instance in this arc, handled the same way: in the open.**

**THE FLOOR — fourteen-for-fourteen, every count byte-stable, `f0532` untouched:**
`crons 48 · sendwa 55 · webhookcore 11/11 · otp_meta 24 · b0498 58/58 · punct 17 · movementb 47/47 · transport 10 · m1b 4 · m2 2 · prospect 47 · checker 101/101 · onboarding 27 · couple_soul 21 · f0532 11`.

`node --check` clean on all touched files. **W-1 asserted mechanically** at M2 §5.3 and M1 §6.4.

## 4. WHAT THE NEXT SITTING PICKS UP

**M3 (C7)** — un-gated: the constraint is witnessed on `engine.users` → `auth.users(id)` ON DELETE CASCADE. The failing value is an `auth_user_id` absent from `auth.users` reaching an engine.users write on the couple-door path; `agentBridge.js:29-30` is the named suspect. Any engine-side row inspection ships as a founder-run read-only SELECT **first**; the data repair stays conditional-withheld. `0101` reserved; expected DDL none.

Then **M4** (C8 + C10-loop, the wall's single opening, its own veto slot) · **M5** (C6, last, `f0532`'s labeled amendment) · **M6** (C9(a) per G-2).

**F-05.49** (the sanctuary pre-insert's `channel:'whatsapp'` mislabel) rides M6 if that seam is touched, else its own micro.

**The live witness is the FOUNDER's, declared-not-claimed.** Smoke card **S2** is M2's: *"The decorator quoted 4 lakhs — book them."* → either the hand writes 400000 exact, or the guard HOLDS with the honest question; never 4000000-with-ok.
