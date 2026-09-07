# TDW · BLOCK 19 · G3.4 — PAYMENT REMINDERS · THE POLITE COLLECTOR
## HANDOVER — SITTING 1, SEALED 2026-09-07

**Tips at seal, derived at origin:** dream-os `85bdac1` · dreamos-pwa `faa9acf8`.
**Migration:** `0139_payment_reminders.sql`, founder-run in production 2026-09-06, verified by constraint census (ten rows).
**State:** the collector is live at beta. A real reminder reached a real handset on 2026-09-06.

---

## 1 · WHAT IS TRUE NOW

A vendor opens an invoice, sees its payment schedule, and taps **Remind** on a milestone. She is shown the exact words before they leave. On her tap, one Utility WhatsApp template goes to her client from the bride number. The room records what was asked and what WhatsApp accepted. A standing switch, off by default, lets a nightly sweep send the rest — but only for invoices she has opened herself, and never the first reminder on any of them.

**Witnessed end to end 2026-09-06:** `to_phone +919625759924` · `source vendor_tap` · `reached_meta true` · Railway `[sendWa:template] 919625759924 <- payment_reminder_couple (wamid.HBgMOTE5NjI1NzU5OTI0…) [line=bride]` · the message on the handset.

---

## 2 · THE TEMPLATE

`tdw_payment_reminder` · **Active – Quality pending · Utility · English** · ID `1781270206634381` · WABA **The Dream Wedding Direct** · filed and witnessed by the founder on the template **detail** page 2026-09-06 (R-40.71 — the edit screen is never a reading surface).

```
Hi {{1}}, a payment reminder from {{3}}. {{2}} is due on {{4}}. UPI or cash, whichever suits.
```

`{{1}}` client name · `{{2}}` the **composed phrase** (`The second instalment of Rs 60,000`, built from `milestone_label` + `amount_due`, first character upper-cased because it opens a sentence) · `{{3}}` `vendors.business_name` · `{{4}}` the due date as `12 September`.

**Registry key `payment_reminder_couple`**, line `bride`, `nudgeClass: false`. The older key `payment_reminder` → `tdw_payment_due` is a **vendor-lane** template whose body says *"I'll update your books"*; it is untouched and no caller moved (F-40.142).

**F-40.144:** `docs/TEMPLATES.md:120` recorded a 4-var `tdw_payment_reminder` as approved since 2026-05. **It was never filed.** The doc carried a filing that never happened, and the first arm of the ruling rested on it until the founder's word settled it.

---

## 3 · THE GATES

Two, closed for different reasons by design (`creditInvite.js`'s shape):

| gate | state today |
|---|---|
| `PAYMENT_REMINDER_SEND_ENABLED` | **set to `1`** — R-40.96: once a path is Meta-approved and walked, the flag stands at beta; the Beta mark is the gate |
| `isApproved('payment_reminder_couple')` | **true** — Meta returned Active |

⚠ **R-40.16 does not govern this flag.** It is the relay-lane fixture law. An earlier draft of this handover carried an "unset the flag" line; it is retracted.

---

## 4 · THE LAWS THIS ARC SHIPPED

**Once per milestone is the database, not the code.** `payment_reminders_milestone_kind_key UNIQUE (milestone_id, kind)`. The writer INSERTs first and reads Postgres's answer; `23505` is the guarantee *succeeding*. A SELECT-then-INSERT is two statements with a gap, and the gap is where a client's second message comes from.

**The row is written before the send.** A failed send still leaves a row, so that milestone is never chased twice. `wamid IS NULL` is the honest record that it never reached Meta.

**The room says Sent, never Landed.** A `wamid` means WhatsApp *accepted* the message, never that it reached her phone. The founder amended the seat's proposed word at the veto, and the note beneath names both blind spots — delivered **and** read.

**Silence never means yes.** The first reminder on every invoice is her own tap. The switch releases only the rest. An absent settings row means OFF; a *failed* settings read also means OFF.

**The ledger outlives the schedule.** `schedules.js` hard-deletes milestones, so the FK is `ON DELETE SET NULL` with `milestone_label`, `amount_due` and `invoice_id` denormalised. The row records what was true at the moment of the ask.

**A control's state is a fact about the database.** F-40.209 — the Remind control renders from `reminded_at` joined by the door, never from component state.

⚠ **THE FLAG BEFORE THE SWITCH, ALWAYS.** The writer claims its row *before* it checks the gate. A nightly sweep running dark permanently consumes the UNIQUE key for every milestone in its window. Today the flag is on, so arming is safe. It was not safe two hours before it.

---

## 5 · WHAT SHIPPED

**dream-os** — `0139` (two planes) · `lib/vendor/paymentReminders.js` (sole writer) · `api/vendor/reminders.js` (its own segment router: `/solutions` is GET-only and this feature writes) · `api/vendor/invoiceSchedule.js` (F-40.181's split) · registry entry · nightly at **03:25 IST** · `b59` **105 cells, 17 mutations**, harness on exit codes.

**dreamos-pwa** — the room · the record's Remind control and confirm sheet · `SCHEDULE_ENABLED` flipped · the hub's sixth row · `b40` C31 + C106 · `bs_audit` C43 · 11 mock frames, 44 captures.

---

## 6 · OPEN, AND NONE OF IT IS QUIET

**F-40.215 — the schedule can be created and read, never amended or removed.** `deleteSchedule`, its door and its client wrapper all exist with **no affordance onto any of them**, and the invoice's own `DELETE` sits directly beneath the panel where a vendor will read it as the schedule's. She cannot correct a mistyped label, share or date; the only exit is cancelling the invoice. And `deleteSchedule` refuses once any milestone is paid, so the window closes **silently** at her first payment. F-40.202's shape one verb over — the flip exposed a half-built surface, and this seat owns not censusing the panel's verbs first. **Chartered as G3.4 sitting 2**, mock-first, one P-frame pair, veto delegated.

**The nightly sweep is uncovered on glass.** No in-window milestone existed at the walk and the seat declined to manufacture one. Covered at the file grain by bench §8's four cases and mutations §5/§6/§13. Walkable once F-40.215's edit lets a date be re-cut.

**`clients.phone` via `client_id` is uncovered on glass.** The fixture put the number on the invoice (Branch B — that invoice has no client row). Covered by bench §11b and mutations §13/§14.

**`bs_audit` C36 = F-40.38**, known and declared.

---

## 7 · WHAT THIS SEAT GOT WRONG, KEPT ON THE RECORD

- **F-40.180** — invented a `data` envelope from habit after deriving the field names from the door, and guarded the render with `room !== null`, which is true for `undefined`. A white screen on production. A shape half-derived is a shape guessed.
- **F-40.202** — drew `P8` from the seat's idea of the panel rather than from the tree, so the founder vetoed bytes that did not exist. Then the corrected frame drew a *fake* scrollbar under a tidy row — the same mistake one level down, inside the frame written to cure it.
- **Prose read as code, seven times.** The glyph cell reddened on `formatRs`'s own doc-comment; the §0.3 cell matched a phantom mount inside `core.js`'s comment; the shape census counted `types.ts`'s header comment and then proposed curing an instrument that was already correct. Every absence cell must strip comments first.
- **A cell that passed for the wrong reason.** The rewritten mount cell's assertion was the inverse of its own label and went green only because the cure had just landed.
- **A both-ways harness that scored a crashed bench as clean.** Now judges on exit codes, refuses an anchor matching more than once, and carries a self-test that must crash.
- **F-40.210 was not this plane's**, and the reason is worth keeping: the wamid reads `res.result.wamid` because it copied `reviewAsk.js`, which was already right. Luck sitting on top of a good habit, not a check anyone ran. **It is a check now.**

---

## 8 · FOR THE NEXT SEAT

Derive every tip at origin before believing any hash in this document — four relays this sitting named a tip that had already moved, and one named a commit that did not exist in the repo. `git diff --name-only <base> origin/main` answers *what moved*, not *who moved it*; ancestry answers the second. Name files on every git line — a `git add -A` would have swept another seat's uncommitted migration into this arc's commit on the night it was pushed.
