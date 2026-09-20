# repo: dream-os @ 704950243522c4b788ad8d6bc898be3d21e1e245 (base) · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307
# closed (docs only, C-44.1) on dream-os @ f3f7398c6eb1f777461fd87f4e1ad9e26f1badd2
# TDW · CE-44 · SEAT LCV-1 · LC-VICTOR P4a · THE STRUCTURED RESULT OF A HAND · HANDOVER

**Rung b88.** Code, so it verifies on the founder's own floor end to end (`run-floor.sh --delivery
scripts/floor-manifest-ce44-lcv1-p4a.txt --check`), installing and building from the applied tree first.

## 1 · What P4a is, as ruled

At P5 the door speaks for the hands (R-44.18), so it must know what happened from a **result**, never by
parsing a display string. P4a gives the three hands P5 speaks for first one structured result each:
`donna_booking`, `donna_milestone_paid`, `donna_invoice_pdf`. Their outcome is born **at the door**
(recordPrimitives.ts:906 to :946 validate and write nothing), so P4a is **door-only, W-1 NONE**. The
engine-born hands are P4b, under a lift issued later against its own pre-cut note. c-44.22 (the chair's)
recorded the corrected premise.

**The shape**, one home (`src/lib/vendor/handResult.js`): `{ hand, ok, code, ids, client?, amount_rupees?,
on?, invoice_number?, line_key }`. `code` is a closed set per hand; `on` is an ISO date the door has
validated; `line_key` is the key of the byte the door spoke in lifecycleHands' `LINES` (the lines' one home
today), or null when it spoke none. **P4a mints nothing and changes no line**, save F-44.30's cure (§4).

| Hand | Codes (closed) | Line keys it may name |
|---|---|---|
| `donna_booking` | booked · advance_recorded · refused: result_unbuildable, invalid_kind, invalid_date, no_name, not_found, ambiguous, read_failed, no_package, no_fee, bad_package, invalid, not_promoted, exception | F29 · D3 · D4 · none |
| `donna_milestone_paid` | paid · paid_in_full · already_marked · absorbed · refused: result_unbuildable, invalid_date, no_name, not_found, ambiguous, read_failed, no_invoice, schedule_read, unreadable_paid_at, unmatched, unavailable, nothing_pending, not_marked, exception | D3 · D4 · D5 · D6 · D7 · D8 · none |
| `donna_invoice_pdf` | minted · refused: result_unbuildable, no_binder, no_amount, not_minted, exception | none (the invoice sentence has no one home until P5: F-44.48, F-43.34) |

## 2 · Files

| Path | Against base | Change |
|---|---|---|
| `src/lib/vendor/handResult.js` | new, 143 | The shape, the closed code sets, the line keys, and **TOTAL** builders: `make()`, `booking`, `milestone`, `invoice`, `validate()` and `bookingRefusalCode()` never throw, whatever they are handed; anything unbuildable yields a minimal frozen result (`ok` false, `refused:result_unbuildable`, `line_key` null). |
| `src/lib/vendor/lifecycleHands.js` | +46 −12 | `runLifecycleSignals` returns `{ lines, results }`: one result beside every line it speaks, and one for each of the three paths that speak none (a confirmed booking, whose D1 is 4b's byte; an advance with no deposit row; the D7 absorbed by the same turn's booking, F-44.8). **Every line is the same expression in the same order**; the two payment lines compute `paidLine(…)` into `said` and push that, so the result can name D3 or D4. **Every result is kept through `note()`, after its line: the line first, the result best-effort** (§7, e-12). |
| `src/api/vendor-engine/chat.js` | +34 −9 | `buildInvoicesWithResults` returns the documents and one result per binder asked for; `buildInvoices` keeps its name and answer; documents also carry `binder_id`. `chipFiling` and `donnaWitnessLines` pass the door's documents through (F-44.30). Two additive exports for b88. |
| `src/lib/vendorInbound.js` | +11 −1 | The WhatsApp twin records the same invoice results; **its text is unchanged**. |
| `src/lib/undoContract.js` | +15 −4 | The invoice branch reads the door's number; no regex (F-44.30). The twelve other patterns stay until P4b. |
| `scripts/b86_lcv_p2_bench.js` | +39 −14 | **Joined by the chair's ruling (e-11, C-44.7).** Only §6 and §7: what P2's cut did is measured on P2's OWN commit, `0675964..cb84f6f`, not base-against-working-tree, which reddened on this cut's lawful edits. A missing commit fails the cells, naming it. Two mutation cells drive the same predicates on a synthetic range (a throwaway repository), never rewriting history. |
| `scripts/b88_lcv_p4a_bench.js` | new | Rung b88. |
| `scripts/floor-manifest-ce44-lcv1-p4a.txt` · this handover | new | |

**Left unchanged, and why:** `src/lib/vendor/promotion.js`. It was on the accepted list for "its steps return
a code instead of `display.startsWith('ERROR')`". Read whole, `promoteLead` already answers in a structured
shape (`{ status, body: { ok, code | field | step, promoted: { lead_id, binder_id, invoice_id,
invoice_number } } }`), and its only `isErr` (:103) judges what the **engine** returned from
`openRecordWithId` and `executeAndPatch`, an engine-born outcome and P4b's ground. `handResult.js` reads
promoteLead's existing answer (`bookingRefusalCode`). Leaving it untouched also means its three callers
(`leadPackages.js`, `clients.js`, `lifecycleHands.js`) cannot behave differently, by construction.

## 3 · W-1: NONE

No `src/engine/src/**` path, no soul, no lens. b88's W-1 cell is required and green.

## 4 · F-44.30, cured, and what it changes on the glass

The undo contract ran `/INV[-\w]+/i` over the engine's display ("Invoice document requested for record <binder
id> …"), so it printed the word "Invoice" as the number (**"Invoice minted: Invoice"**), and it took the
**binder's** id for an invoice id, offering an undo at `/invoices/<binder id>/cancel`, an invoice that does not
exist. Now:

- **The stored line** (the reply row's content, which the app shows on reload) names the door's own number:
  **"Invoice minted: TDW/DEV440/17"**, read from this turn's documents by the binder it was made for.
- **The live chip**, filed before the door has made the invoice, names no number: **"Invoice minted"** (the
  branch's own existing wording with no number), and **claims no undo**, since no invoice id is held.
  `generateInvoiceForBinder` returns no invoice id; the real id, and with it a true undo, arrive with P5's one
  invoice home (F-44.48), not by reaching into `invoices.js`, which is not on this cut's list.

These two are the only vendor-visible changes, and they are the ordered cure. Every other line is byte-identical.

## 5 · What b88 holds (78 cells), measured only against what cannot move (C-44.7)

The closed sets; every line key a key of `LINES` today or null; `make()` never throwing; `validate()` refusing a
key naming no byte, an unknown code, a spoken date, a zero amount. **Twenty lifecycle scenarios: in each, the
lines spoken are the lines' one home (the live `LINES`) rendered with that scenario's own facts**, and one
valid result rides beside each signal with the expected code and line key. (First cut compared against the base
module read from git; the chair's C-44.7 re-expressed it so a later lawful change to a byte's home cannot
redden it.) The invoice results through the real
`buildInvoicesWithResults`. F-44.30 on `TDW/DEV440/17`'s shape, the live beat, the undo, every other hand's
line as the undo contract's own, WhatsApp's sentence unchanged, and one read of fixed history (`7049502`
printed "Invoice minted: Invoice"), which fails naming the commit if it is absent. **W-1 and the untouched spine
are read from P4a's own manifest**: it lists no engine, soul or lens path, not `promotion.js`, not b83, b84 or
b85; and b83, b84, b85 run green from inside b88. **The fuzz cell** calls all three builders and `bookingRefusalCode` over a table of hostile inputs (undefined, null,
'', 0, NaN, {}, [], a 50-character code, an object whose `toString` throws; and ten hostile field shapes): zero
throws, every result frozen and valid or minimal. **The line-safety cell** makes the builders throw on purpose:
"Payment marked" stands alone and a refusal speaks once, with no error. **Six mutations**, each reddening its
cell: a booking recording no result; a payment naming D4 for D3; the regex restored; a hand allowed a key that
names no byte; the builders' guard removed; `note()` letting a failure through.

## 6 · The walk card (P4a), in plain words

Nothing a vendor reads changes, except the invoice chip. In the TDW chat's working room, ask for an invoice for
a booked client with a fee (on a fixture). The live chip should read **"Invoice minted"**, with no ": Invoice",
and offer **no undo** on the invoice. Reload the chat: the stored line should read **"Invoice minted:
TDW/DEV440/<number>"**, the real number. A payment and a booking should read exactly as they do today.

## 7 · Errors and corrections owned

- **e-12.** "make() never throws" was a contract written in a comment and in this handover that no cell exercised.
  The chair called the builders 300 times with hostile input: 57 threw (`fields = {}` defaults only undefined, so
  null threw; a code whose string conversion throws propagated). No call in this cut reached either, but the
  builders run inside live booking and payment turns, and **read statement by statement, a throw there was not
  safe**: every `results.push` sat after its `lines.push` inside the signal's `try`, so a throw would have jumped
  to the `catch`, which pushes a SECOND line (F29, or D8 after "Payment marked"), and the `catch`'s own
  `results.push` could have thrown out of `runLifecycleSignals` and failed the turn. Cured: the builders are
  total; every result is kept through `note()` after its line; the fuzz cell and the line-safety cell hold both,
  each with its mutation.

- **e-11.** b86 (P2) pinned "P2's cut added only and touched no engine path" as base-against-working-tree, so
  the first later lawful edit reddened it; the floor found it on this cut's first full run. Cured in b86's §6
  and §7 by measuring P2's own commit.
- **c-44.23, the chair's:** diffed P2's ZIP and did not see §6 and §7 would redden on the next lawful edit; then
  required the same proxy of b88's W-1 cell. Both are re-expressed under **C-44.7**: a cell that pins what a
  packet did is measured against a fixed commit range, the packet's own manifest, or bytes with their own
  permanent home; never base-against-working-tree.

## 8 · Carried

P4b (the engine-born hands) under its own pre-cut note and lift. F-44.48 and F-43.34 to P5 (one invoice home,
one invoice sentence on both lanes). P5's first precondition: R-44.20 (Basic's Listener on DeepSeek, his
decision), and the Basic-tier question, the chair's to rule with him at P5's charter.

## 9 · P4a's close: landed and walked

**Landed** at `f3f7398c6eb1f777461fd87f4e1ad9e26f1badd2` (parent `7049502`; nine paths as the manifest, byte-identical
to the ZIP the chair confirmed, sha256 `3dea3f56…3bdb48`). On the founder's Codespace: `b88 · 78 pass · 0 fail`,
`b86 · 58 pass · 0 fail`; `[F-14.16] declared files unmoved — set and contents both verified.`; `FLOOR = NAMED
BASE, no delta  (refusals, not in base: 4)`; FLOOR GREEN. Railway ACTIVE, "Deployment successful".

**The walk**, TDW chat's working room, fixture vendor, client **Walk45**. Asked first to "raise an invoice for
walk45", Victor answered that Walk45 already has an invoice on file (TDW/DEV440/19, made when the booking was
confirmed) and asked whether to re-issue it or raise a new one; the tool was not reached. On **"Re-issue the same
invoice for Walk45"** the tool ran: the live chip read **"Invoice minted"**, with no ": Invoice" and no undo;
after a reload the saved line read **"Invoice minted: TDW/DEV440/19"**; the invoice sentence ("Invoice
TDW/DEV440/19 for Walk45 is ready…") was unchanged. **F-44.30 is closed.**

## 10 · Findings and law recorded at P4a's close

- **F-44.45** (ruled for the door): a lookup naming no entity, no date and no kind the door can run is nothing to
  act on and takes the leftover line at P5; the door never runs a lookup on nothing. Fixtures: "Refresh", heard
  once as none and once as search/find (P2 handover §14).
- **F-44.46** (ruled for the date resolver): a day with no month resolves to the next such day on or after today
  in IST; "19th" asked on 20 September is 19 October. The founder may prefer the door to ask.
- **F-44.47:** `engine.usage` names no spender; the listener and harvest are told apart by model alone. A spender
  marker lands in the first packet that touches the usage writer again.
- **F-44.48:** the invoice is made and delivered by two per-surface paths (`chat.js` `buildInvoices` and
  `vendorInbound.js`'s twin), C-43.1's class. Filed to P5 with F-43.34, where the door speaks for invoices
  through one home. Named in P4a, not cured.
- **C-44.7** (chair's mechanics): a cell that pins what a packet did is measured against a fixed commit range,
  the packet's own committed manifest, or bytes with their own permanent home; never base against working tree.
- **C-44.8** (standing law, from the founder's words, verbatim: *"from next time tell me exactly the clients name.
  no guessing game."*): every card names the exact client and the exact words to send, and says what he should see
  for each. Where the act depends on a fixture's state, the card's first step is a schema-witnessed SELECT, with
  its control, showing that state.

## 11 · Errors and corrections owned, P4 in full

- **e-10.** P2's close carried runnable blocks in the message awaiting the chair's read; he ran them first. The
  form since: a message awaiting the chair carries only the hash, the file list and each block described; the
  blocks follow the confirm.
- **e-11**, **e-12** (§7 above).
- **e-13.** P4a's card said "a booked client with a fee" and named none, and assumed the invoice tool would fire;
  on a just-booked client Victor asked which invoice instead. Cured by C-44.8.
- **The chair's:** **c-44.22**, an assumption about where a hand's result is produced, stated as fact without
  reading the case bodies (P4 "cannot be W-1 NONE"); **c-44.23** (§7 above); **c-44.24**, its own summary to the
  founder said "ask for an invoice for a booked client" and named none.

---

Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.
