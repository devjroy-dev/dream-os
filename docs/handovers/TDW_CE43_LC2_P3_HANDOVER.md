# repo: dream-os @ 73b5200f3ab5ebb04e8755e49f24f4615bd580e9
# TDW · CE-43 · SEAT LC-2r · PACKET 3 · HANDOVER (the dream-os packet) · 2026-09-17

Cut on dream-os `73b5200f3ab5ebb04e8755e49f24f4615bd580e9` (P2b), re-derived at origin by `git ls-remote` at the moment of cutting. The seat is LC-2r, the re-seat of LC-2 after its container was lost mid-packet 3 with nothing cut (F-43.83); nothing from that seat reached this tree. No migration: 0167 and 0168 carry every column this packet writes. The dreamos-pwa packet (rung b82) cuts after this one is final and at origin (R-38.16). Findings used: F-43.84 and F-43.85. This packet is **provisional** under C-43.17 until the founder's floor on the applied tree is pasted.

## §1 · What shipped

| File | What |
|---|---|
| `src/lib/vendor/promotion.js` | NEW. The one home for the booking act (roadmap §3 Moment 2). `promoteLead` in the ruled order, each step reading before it writes. Returns `{ status, body }` and never throws. |
| `src/lib/vendor/bookedLeads.js` | NEW. `readBookedBinderIds`, the one read behind F13(a), spelled without `.not()` (arm (iii), ratified). |
| `src/lib/vendor/schedules.js` | F7 `milestoneAmounts` (one remainder helper), explicit amounts (C-43.2), F6's received-on date and due move, F17 `payNextMilestone`, F16 refused at the home, the R-43.11 mirror behind `PACKAGE_MONEY_MIRROR`, and `doorAgentResolver`. |
| `src/lib/vendor/invoices.js` | `createInvoice` carries `binder_id` and `lead_package_id` (both default null) and returns the error `code`. |
| `src/lib/vendor/bookingEvent.js` | LC-1's seam predicate is "has a booked lead" plus the legacy `(book\|confirm)` test. A failed read writes nothing for the pass. |
| `src/engine/src/core/tools/recordPrimitives.ts` | `openRecordWithId`, the door-only export for F3. It is named by no tool schema and is absent from `RECORD_TOOLS`. |
| `src/api/vendor/leadPackages.js` | The attach act lifted into `attachPackage` with its behaviour unchanged. NEW `POST /:leadId/promote`. |
| `src/api/vendor/clients.js` | NEW `POST /direct`, the walk-in (R-43.5, F28(b), C5 vs F29). |
| `src/api/vendor/schedules.js` | The milestone PATCH applies F7 and **F-43.81** (vendor scope, beyond scope, disclosed). The paid route takes `received_on` (F6). |
| `src/api/vendor/money.js` | F17: mark-paid on a package invoice pays the next milestone on today's IST date. |
| `src/api/vendor/invoices.js` | F4: `generateInvoiceForBinder` serves the package invoice and never mints beside it. |
| `src/api/vendor-engine/cabinet.js`, `today.js` | F13(a): a binder with a booked lead behind it is a client, plus the legacy six-word set. |
| `scripts/b83_lc2_p3_promotion_bench.js` | NEW, rung b83. |
| `scripts/b82_lc2_p2_packages_bench.js` | M12 AMENDED BY LABEL, re-aimed at the refusal line's new form inside `attachPackage` (the P2b M9 precedent). No cell changed. |
| `scripts/verify-lc2-p3.sh` | NEW. The founder's one verify command: build, `node --check`, the four nearest benches, then the floor with declared dirt. |
| `scripts/floor-manifest-lc2-p3.txt` | The declared dirt. No new directory. |

## §2 · The contract the pwa packet builds on

- **`POST /api/v2/vendor/leads/:leadId/promote`**
  - Body: `{ kind: 'advance_paid' | 'booking_confirmed', advance_received_on?: 'YYYY-MM-DD' }`.
  - 200: `{ ok, promoted: { lead_id, binder_id, invoice_id, invoice_number, adopted, opened, event } }`, where `event` is one of `{ id, created }`, `{ id, existing }`, `{ refused: conflict }`, `{ skipped }` or `{ error }`.
  - 422 refusal: `{ ok:false, error:'refused', code }`, with code one of `no_package`, `no_fee`, `bad_package`.
  - 422 bad input: `{ ok:false, error:'invalid', field }`, with field one of `kind`, `advance_received_on`, `name`.
  - 404 when the lead is not the vendor's.
  - 500: `{ ok:false, error:'promotion_failed', step }`.
  - Surface mapping: A9 for `no_package` and `no_fee`; F29 for everything else; A13 on 200.
- **`POST /api/v2/vendor/clients/direct`**
  - Body: `{ name, phone?, wedding_date, package_id, fee?, advance_received: boolean, received_on? }`.
  - 200: `{ ok, lead_id, deduped, promoted }`, surfaced as C4.
  - 422 before any write: `{ ok:false, error:'invalid', field }`. `received_on` is required only when `advance_received` is true (F28(b)); the amount is always the package's deposit.
  - After the lead exists, any failure answers `{ ok:false, error:'saved_as_lead', lead_id, step, code, field }` with 422 or 500, surfaced as C5.
  - A failure before the lead exists answers 500 `{ ok:false, error:'promotion_failed', step:'lead' }`, surfaced as F29.
- **`POST /api/v2/vendor/money/invoices/:vendorId/:invoiceId/payments`** is unchanged for any other invoice. On a package invoice the body figure is ignored, and the answer adds `milestone`.
- **`POST /api/v2/vendor/schedules/:milestoneId/paid`** accepts `received_on`.
- **`DELETE /api/v2/vendor/invoices/:invoiceId/schedule`** answers 409 on a package invoice (F16). The pwa hides the control.

## §3 · Rulings carried

- **The order (F3, F27(b), lead state, event, invoice, schedule, deposit), as ruled and as built.** Each step reads before it writes.
  - "Promoted" means the link is set, the binder is present, and an invoice exists for the `lead_package_id`.
  - A second tap writes nothing (b83 §6.13).
- **Choice 1, YES.** A calendar refusal is returned in `promoted.event`, and the booking completes.
- **Choice 2, YES.**
  - `milestone_label` carries A5's labels with the package's own shares.
  - The dream-os twin of the pwa's `scheduleLabel` is `promotion.js` `packageScheduleLabel`.
- **Choice 3, YES.**
  - `/direct` creates the lead through `createLead` with source `direct` and state `new`; promotion then sets it to `booked`.
  - On failure the lead stays `new`, which matches C5.
  - `createLead` was not widened, so b38 §10 is untouched.
- **Choice 4, as ruled.** An adopted binder is linked:
  - its stage is set to `confirmed booking` through the engine writer (`donna_stage`);
  - money is written only into empty cells (`donna_money` when `amount` is empty; `donna_money_edit` for an empty received, pending or status);
  - pending is written only when the amount is empty or equals the fee;
  - nothing else is rewritten.

  A binder the act opens is born with the package's figures. For `booking_confirmed`, its received and pending cells stay unfiled ("an unfiled cell means unfiled").
- **Choice 5, disclosed and accepted.**
  - Promotion does not patch Donna's lead snapshot line; the binder's line is patched.
  - A lost race on `uq_invoices_lead_package` consumes one invoice number. That number is skipped and logged as `[promotion] … lost the invoice race; one invoice number was consumed and skipped`.
- **Arm (iii) on `.not()`, RATIFIED.**
  - `tdw09_micro_bench` needed no amendment and reads 23/23.
  - Its exit 1 on the prior seat's tree is explained in §6 (a reconstruction, not a witness).
- **F-43.81.** Shipped and disclosed as beyond scope, with cell §4b.3 and mutation M17.
- **R-43.11.** Built behind `PACKAGE_MONEY_MIRROR`, which stays unset until packet 5. **No Railway act this packet.**

## §4 · What is proven

- **`b83_lc2_p3_promotion_bench`: 116/116 on the cured tree**, run from `/tmp`.
  - §1: the chair's cell. The id set from `bookedLeads.js` equals the `.not('binder_id','is',null)` form on a fixture holding null and non-null binder ids.
  - §2: both slicers, through their real handlers.
  - §6: promotion over a double of both planes. It enforces `uq_leads_binder_id`, `uq_invoices_lead_package`, `(invoice_id, ordinal)` and the records key. It drives the real `createInvoice`, `createSchedule` and `markMilestonePaid`.
  - §7: both doors, with the real `createLead` and the real attach.
  - §8: F17 on the real money handler.
  - §11: twenty-three mutations of production code, each turning its named cell RED.
- **Both ways.**
  - Method: a clean worktree at `73b5200`, its engine built from its own source, the bench copied in.
  - Result: **14 passed, 102 failed.**
  - The 14 greens are true facts at base: §2.2 and §2.3 (the legacy slice), §4b.1 (a pct sum refusal), §5.5 and §8.2 (the legacy invoice paths), §9.3 (no tool schema), and §10 (the eight schema witnesses).
  - Two of the seat's own bench defects were caught and fixed before the cut:
    - the drivers threw at base instead of reddening;
    - M23 was built with an empty replacement that `||` turned into a syntax error.
- **Readers of the touched files, 63 benches, base and cured identical by exit code and failing-line count.** The set was derived by grep over `scripts/`, plus the whole-`src` scanners `bOB_taxonomy`, `b36_leadgate_a` and `b38_doorboot_enrich` (F-43.72's lesson).
  - Non-green on both trees and in `floor-base.txt`: b06_meter, b07_f0772, b07_f0791, b08_p1, b10_p1, b10_p2, b10_p3, b59_g34, b59_mutations.
  - Environment refusals (exit 3) on both trees: b06_gauntlet, b5_wa_door_smoke.
  - **Red on both trees in this container and absent from `floor-base.txt`:** `b46_money_books` (1 exit, 4 lines) and `b56_contract` (1 exit, 4 lines). These are container-side; the founder's floor is their witness.
- **`node --check`:** clean on every touched `.js`.
- **`npm run build`:** clean. The built engine carries `openRecordWithId` (b83 §9.2).
- **Not run in the seat's container, declared before the cut:**
  - the full floor (the container's call limit);
  - anything against the real database or the real engine client (no curl reaches Railway or Supabase from here);
  - the environment-refused benches `b06_gauntlet`, `b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`, `test-shape`.

  **The founder's provisional floor on the applied tree is their witness**, taken before this ZIP is called final.

## §5 · Drift and reports

- **F-43.84 (c-43.15, owned by the chair).** The kickoff said the LC-2 handovers carried every vetoed surface byte. They carried only the founder's YES to a chat-held list. The chair pasted the record, and it is carried whole in the Appendix, so the tree holds it.
- **b82 M12**, amended by label as in §1.
- **The verify is a file.** This packet changes engine TypeScript, and `run-floor.sh` does not rebuild `src/engine/dist`. The build therefore has to precede the benches, and R-38.21 forbids chaining it in a paste.
- **The event read** uses two queries (by lead, then by binder), not `.or()`, so the doubles and the estate's builder vocabulary stay as they are.

## §6 · Notes

- **The floor harness's silence.**
  - `scripts/floor-batch.sh` runs every bench with `>/dev/null 2>&1` and records only `RED: <name>`. It is a batched pass, not the floor of record.
  - That is how `tdw09_micro_bench`'s exit 1 on the prior seat's tree read as silent. That tree's F13(a) cut met a double with no `.not()`, which failed §3.3 to §3.5 with named lines when run directly.
  - This is reconstructed on a scratch copy and is not a witness. The chair's view is recorded: design, not defect. No number is filed.
- **F-43.85 → LC-3.** `markMilestonePaid` does not stamp `invoices.last_payment_at`, the F-39.8 class that `recordPayment` cured. The milestone path therefore leaves the Books register's date empty for package payments. It is not cured here, because it is outside the ruled list.

## §7 · Founder acts

None on Railway or Supabase in this packet: `PACKAGE_MONEY_MIRROR` stays unset. The apply is in the chat relay as Blocks 1 to 3. The git line follows only after the provisional floor is pasted and the chair calls the ZIP final.

## §8 · What the pwa packet (b82) picks up

- **The booking sheet (A12, F15(a)):**
  - A2's `Booking confirmed` and `Advance paid` controls on the lead's package card.
  - The swipe-right `Booked` opens the sheet, and nothing is written until the vendor confirms.
- **The two outcomes:**
  - A13 on success.
  - F29 (`Could not confirm the booking.`) for anything that is not an A9 code.
- **The Clients sheet wired to `/clients/direct`:**
  - F28(b): "Advance received" is yes/no, and "Received on" appears only on yes.
  - C4 on success, C5 on `saved_as_lead`, F29 otherwise.
- **F13(a) needs no pwa change:** the cabinet read carries it.
- **On the invoice detail:**
  - F16: no Remove schedule on a package invoice.
  - F17: the row, swipe and bulk mark-paid need no pwa change beyond reading the answer.
  - The mirror confession: the binder's figures lag until packet 5.
- **C-43.16:** the sheets' Cancel buttons are outlined in muted ink.
- **The copy home:** `lib/worklist/packages.ts` stops deferring to "the veto record" and cites this handover's Appendix.
- **The walk card P3:**
  - Advance paid on Sarah `88dbb52b` → the rows.
  - Sarah on Clients.
  - A walk-in through Clients +.
  - The swipe opens the sheet.
  - Invoice detail F16 and F17, with the mirror confession.
  - A second tap is idempotent.
  - Both-theme screenshots.
  - The milestone count is stated from a fresh Q-P3-f1 at the tap.

## Appendix · THE VETO RECORD (founder's YES 2026-09-17 on the chair's lean; carried verbatim as the chair pasted it)

```
  A1  Package
  A2  Attach package · Change package · Send quote · Booking confirmed · Advance paid
  A3  Attach a package
  A4  Package · Fee for this couple · Handover date
  A5  Deposit, {pct}% of the fee, on booking · Rs {a} · {date} / {pct}% one month before the first function (optional) · Rs {b} · {date} / The remainder, on delivery, before the work is handed over · Rs {c} · {date}   (shares are the package's own, F26)
  A6  The event is under a month away, so the middle payment is part of the final one.
  A7  Counted from the wedding date.
  A8  Delivery · {date}
  A9  Attach a package first. · Set the fee first. · Add the wedding date first. · Add the handover date first.
  A10 Quote sent.
  A11 She hasn't written to you in the last day. We've let her know you have an update; your quote goes the moment she replies.
  A12 Confirm booking · Advance received on
  A13 Booked. The client, the event and the invoice are ready.
  C1  New client   C2  Name · Phone · Wedding date · Package · Fee · Advance received · Received on   C3  Add client
  C4  Added. The client, the event and the invoice are ready.
  C5  Saved as a lead. Finish the booking from Leads.
  F29 Could not confirm the booking.
  Q1  {package name} / {item}: {detail} / Fee: Rs {total} / the A5 lines with "(optional)" DROPPED in the quote only / Delivery: {date}
  D1  Booked: {client}. Client, event and invoice {number} are ready.
  D2  Quote staged for {client}.
  D3  Payment marked: {client} · {milestone label} · Rs {amount} · {date}. Next due {date}.
  D4  Payment marked: {client} · paid in full.
  V1  donna_package_list: Read this vendor's own packages: each one's name, what it includes, its fee if set, and which is the default. Read before attaching a package, or when Harvey asks what the vendor offers. Packages are made and changed by the vendor in the app, never here.
  V2  Packages on file: {n}. / {name}{ (default)} · fee Rs {x} | fee not set · {k} items
  V3  No packages on file. The vendor adds them in the Packages room.
  V4  donna_package_attach: Attach one of the vendor's packages to a lead as that couple's quote, with a fee and changes for this couple only. The vendor's package never changes. Needs the lead and the package (from donna_package_list).
  V5  Attached {package} to {lead}. Fee Rs {x}. Deposit Rs {a} due {date} · Rs {b} due {date} · remainder Rs {c} due {date}.
  V6  ERROR: that package is not on file. · ERROR: the fee is not set; ask for it. · ERROR: the lead has no wedding date; ask for it.
  V7  donna_quote_send: Send the attached quote to the couple on the vendor's line. The vendor sees it first; it goes only on his yes.
  V8  donna_booking: Confirm a couple's booking. The lead moves to booked and the client, the event and the one invoice open from the attached package. If the package or, for an advance, the date it arrived is missing, ask Harvey for it rather than filing.
  V9  Booking requested for {lead}; the client, event and invoice are being prepared.
  V10 donna_milestone_paid: Mark a payment on a booked couple's invoice as received: which payment, and the date it arrived. The amount is that payment's own. The invoice fills up; there is never a second one.
  V11 Payment requested for {lead}: {milestone label}, received {date}.
  V12 ERROR: a booked client needs a lead behind it. Ask which package and whether the advance has arrived, then use donna_booking.
  Presentation rulings: C-43.15 sentence-case names; "1 package"; the eight packet 2 failure bytes as landed; F-43.77 filed.
```

Sequencing beyond this sitting is the founder's.
